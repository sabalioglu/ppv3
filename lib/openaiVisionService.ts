// lib/openaiVisionService.ts
export interface OpenAIVisionResult {
  type: 'food' | 'receipt' | 'multiple' | 'unknown';
  mainItem: string | null;
  confidence: number;
  detectedItems: Array<{
    name: string;
    confidence: number;
    category: 'food' | 'drink' | 'unknown';
    price?: number;
    is_food?: boolean;
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
  store_name?: string;
}

export class OpenAIVisionService {
  // 🔧 FIXED: Direct API key with fallback
  private static readonly API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || 
    'sk-proj-O2xzmTKT0mKow067leggZh7gf9RFHFMFj-QC9jqE8UDAFVYUC pp9fsVtfRGoOpI0I9zXSPbYOZT3BIbkFJEpIEuGCQe1F4DjRVHGC_jL6uEIVhRdOvP6rAjp_flU1iyoG2CoDED4qi9ro2OIgANgpk5COcwA';
  
  private static readonly BASE_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly MAX_IMAGE_SIZE = 20000000; // ~15MB base64 limit

  static async analyzeImage(base64Image: string, mode: string): Promise<OpenAIVisionResult> {
    try {
      console.log('🤖 OpenAI Vision: Starting analysis...');
      console.log('🔑 Final API Key check:', this.API_KEY?.substring(0, 10) + '...');
      console.log('🔑 API Key starts with sk-:', this.API_KEY?.startsWith('sk-'));
      console.log('🔑 API Key length:', this.API_KEY?.length || 0);
      
      if (!this.API_KEY) {
        throw new Error('OpenAI API key not found in environment variables');
      }
      
      // Image size validation
      if (base64Image.length > this.MAX_IMAGE_SIZE) {
        throw new Error('Image too large for OpenAI Vision API (max ~15MB)');
      }
      
      const prompt = this.getPromptForMode(mode);
      
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
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
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: mode === 'receipt-scanner' ? 'high' : 'auto'
                  }
                }
              ]
            }
          ],
          max_tokens: mode === 'receipt-scanner' ? 2000 : 1000,
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
        return `Analyze this receipt image and extract ONLY food and beverage items.

        Return response in this EXACT JSON format:
        {
          "type": "receipt",
          "mainItem": "Receipt Analysis Complete",
          "confidence": 85,
          "store_name": "Store name if visible",
          "detectedItems": [
            {
              "name": "PROPER ITEM NAME",
              "price": 0.00,
              "category": "food",
              "confidence": 85,
              "is_food": true
            }
          ],
          "suggestions": ["Review items before adding", "Confirm food items only"],
          "text": "raw extracted text if needed"
        }

        STRICT RULES:
        1. ONLY include food, beverages, snacks, fresh produce
        2. EXCLUDE: toiletries, cleaning products, medicine, household items
        3. Clean item names: "MLK 2%" → "MILK 2%", "BRD WHL WHT" → "BREAD WHOLE WHEAT"
        4. Include price if visible, use 0.00 if not found
        5. Set confidence 70-95 based on image clarity
        6. Maximum 50 items to prevent spam

        EXAMPLES TO EXCLUDE:
        - Toilet paper, tissues, paper towels
        - Shampoo, soap, toothpaste, deodorant
        - Detergent, fabric softener, bleach
        - Medicine, vitamins, supplements
        - Batteries, light bulbs, household tools

        EXAMPLES TO INCLUDE:
        - Milk, eggs, cheese, yogurt, butter
        - Bread, cereal, pasta, rice
        - Fruits, vegetables, herbs
        - Meat, chicken, fish, seafood
        - Snacks, chips, cookies, candy
        - Beverages, juice, soda, water, coffee, tea
        - Spices, sauces, condiments`;
        
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
        detectedItems: this.validateDetectedItems(parsed.detectedItems, mode),
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

      // ✅ RECEIPT SCANNER SPECIFIC FIELDS
      if (mode === 'receipt-scanner' && parsed.store_name && typeof parsed.store_name === 'string') {
        result.store_name = parsed.store_name;
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

  private static validateDetectedItems(items: any, mode: string): Array<{name: string; confidence: number; category: 'food' | 'drink' | 'unknown'; price?: number; is_food?: boolean}> {
    if (!Array.isArray(items)) return [];
    
    return items.slice(0, 50).map(item => {
      const validatedItem: any = {
        name: typeof item.name === 'string' ? item.name : 'Unknown Item',
        confidence: this.clampConfidence(item.confidence),
        category: ['food', 'drink', 'unknown'].includes(item.category) ? item.category : 'unknown'
      };

      // ✅ RECEIPT SCANNER SPECIFIC FIELDS
      if (mode === 'receipt-scanner') {
        if (typeof item.price === 'number' && item.price > 0) {
          validatedItem.price = Math.round(item.price * 100) / 100; // Round to 2 decimals
        }
        if (typeof item.is_food === 'boolean') {
          validatedItem.is_food = item.is_food;
        } else {
          validatedItem.is_food = validatedItem.category === 'food' || validatedItem.category === 'drink';
        }
      }

      return validatedItem;
    });
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
      mainItem = 'Receipt processed';
      suggestions = ['Receipt analyzed', 'Check image quality', 'Try better lighting'];
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