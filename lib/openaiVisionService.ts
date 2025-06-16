// lib/openaiVisionService.ts
import { API_CONFIG } from './apiConfig';

export interface OpenAIVisionResult {
  type: 'food' | 'receipt' | 'multiple' | 'unknown';
  mainItem: string | null;
  confidence: number;
  detectedItems: Array<{
    name: string;
    confidence: number;
    category: 'food' | 'drink' | 'unknown';
  }>;
  calories?: number;
  nutrition?: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  text?: string;
  suggestions: string[];
}

export class OpenAIVisionService {
  private static readonly config = API_CONFIG.openAI;
  private static readonly MAX_IMAGE_SIZE = 20000000; // ~15MB base64 limit

  static async analyzeImage(base64Image: string, mode: string): Promise<OpenAIVisionResult> {
    try {
      console.log('🤖 OpenAI Vision: Starting analysis...');
      
      // Image size validation
      if (base64Image.length > this.MAX_IMAGE_SIZE) {
        throw new Error('Image too large for OpenAI Vision API (max ~15MB)');
      }
      
      const prompt = this.getPromptForMode(mode);
      
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API Error:', errorText);
        throw new Error(`OpenAI API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0]?.message?.content || '';
      
      console.log('✅ OpenAI Vision: Analysis complete');
      console.log('📄 Raw response:', analysisText);
      
      return this.parseResponse(analysisText, mode);
      
    } catch (error) {
      console.error('❌ OpenAI Vision Error:', error);
      throw error;
    }
  }

  private static getPromptForMode(mode: string): string {
    switch (mode) {
      case 'food-recognition':
      case 'single-photo':
        return `Analyze this image and identify all food items. Return ONLY a JSON response with:
        {
          "type": "food",
          "mainItem": "primary food item name",
          "confidence": confidence_score_0_to_100,
          "detectedItems": [{"name": "item", "confidence": score, "category": "food|drink"}],
          "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
        }`;
        
      case 'calorie-counter':
        return `Analyze this food image and calculate nutritional information. Return ONLY JSON:
        {
          "type": "food",  
          "mainItem": "food name",
          "confidence": score,
          "detectedItems": [{"name": "item", "confidence": score, "category": "food"}],
          "calories": total_calories_number,
          "nutrition": {"protein": grams, "carbs": grams, "fat": grams, "fiber": grams},
          "suggestions": ["calorie-focused suggestions"]
        }`;
        
      case 'receipt-scanner':
        return `Extract all text from this receipt/document. Return ONLY JSON:
        {
          "type": "receipt",
          "text": "full extracted text",
          "confidence": score,
          "detectedItems": [{"name": "item or price", "confidence": score}],
          "suggestions": ["receipt-related suggestions"]
        }`;
        
      case 'multiple-images':
        return `Analyze this image as part of multiple food analysis. Return ONLY JSON:
        {
          "type": "multiple",
          "detectedItems": [{"name": "item", "confidence": score, "category": "food|drink"}],
          "suggestions": ["batch analysis suggestions"]
        }`;
        
      default:
        return `Analyze this image and identify any food items or text. Return ONLY JSON format.`;
    }
  }

  private static parseResponse(response: string, mode: string): OpenAIVisionResult {
    try {
      let parsed;
      
      // Method 1: Direct JSON parse
      try {
        parsed = JSON.parse(response.trim());
      } catch {
        // Method 2: Extract JSON from markdown code blocks
        const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          parsed = JSON.parse(codeBlockMatch[1]);
        } else {
          // Method 3: Extract JSON object from text
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        }
      }
      
      // Validate and sanitize data
      const result: OpenAIVisionResult = {
        type: this.validateType(parsed.type) || 'unknown',
        mainItem: typeof parsed.mainItem === 'string' ? parsed.mainItem : null,
        confidence: this.clampConfidence(parsed.confidence),
        detectedItems: this.validateDetectedItems(parsed.detectedItems),
        suggestions: this.validateSuggestions(parsed.suggestions)
      };

      // Add optional fields if present
      if (parsed.calories && typeof parsed.calories === 'number') {
        result.calories = Math.max(0, Math.round(parsed.calories));
      }

      if (parsed.nutrition && typeof parsed.nutrition === 'object') {
        result.nutrition = this.validateNutrition(parsed.nutrition);
      }

      if (parsed.text && typeof parsed.text === 'string') {
        result.text = parsed.text;
      }

      return result;
      
    } catch (error) {
      console.error('❌ Parse error:', error);
      console.error('📄 Raw response:', response);
      
      // Intelligent fallback based on mode
      return this.getFallbackResponse(mode, response);
    }
  }

  private static validateType(type: any): 'food' | 'receipt' | 'multiple' | 'unknown' {
    const validTypes = ['food', 'receipt', 'multiple', 'unknown'];
    return validTypes.includes(type) ? type : 'unknown';
  }

  private static clampConfidence(confidence: any): number {
    const num = typeof confidence === 'number' ? confidence : 0;
    return Math.min(Math.max(Math.round(num), 0), 100);
  }

  private static validateDetectedItems(items: any): Array<{name: string; confidence: number; category: 'food' | 'drink' | 'unknown'}> {
    if (!Array.isArray(items)) return [];
    
    return items.slice(0, 10).map(item => ({
      name: typeof item.name === 'string' ? item.name : 'Unknown Item',
      confidence: this.clampConfidence(item.confidence),
      category: ['food', 'drink', 'unknown'].includes(item.category) ? item.category : 'unknown'
    }));
  }

  private static validateSuggestions(suggestions: any): string[] {
    if (!Array.isArray(suggestions)) return [];
    
    return suggestions
      .filter(s => typeof s === 'string')
      .slice(0, 5)
      .map(s => s.trim());
  }

  private static validateNutrition(nutrition: any) {
    return {
      protein: Math.max(0, Math.round(nutrition.protein || 0)),
      carbs: Math.max(0, Math.round(nutrition.carbs || 0)),
      fat: Math.max(0, Math.round(nutrition.fat || 0)),
      fiber: Math.max(0, Math.round(nutrition.fiber || 0))
    };
  }

  private static getFallbackResponse(mode: string, rawResponse: string): OpenAIVisionResult {
    // Try to extract meaningful info from failed response
    const hasFood = /food|eat|meal|ingredient|recipe/i.test(rawResponse);
    const hasCalorie = /calorie|nutrition|protein|carb/i.test(rawResponse);
    const hasText = /text|receipt|document|price|\$/i.test(rawResponse);
    
    let type: 'food' | 'receipt' | 'multiple' | 'unknown' = 'unknown';
    let mainItem = 'Analysis completed';
    let suggestions = ['Try with a clearer image', 'Retake photo'];

    if (mode === 'receipt-scanner' || hasText) {
      type = 'receipt';
      mainItem = 'Text detected';
      suggestions = ['Document processed', 'Check image quality'];
    } else if (hasFood || hasCalorie) {
      type = 'food';
      mainItem = 'Food detected';
      suggestions = ['Food identified', 'Add to pantry', 'Check nutrition'];
    }

    return {
      type,
      mainItem,
      confidence: 25, // Low confidence for fallback
      detectedItems: [],
      suggestions
    };
  }
}
