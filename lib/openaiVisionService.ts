// lib/openaiVisionService.ts
// Image understanding now runs server-side via the `vision-analyze` edge function
// (Gemini 2.5 Flash vision). No AI key ships in the app bundle. The class name is kept
// for existing callers; parsing/validation stays client-side and model-agnostic.
import { supabase } from './supabase';

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
  private static readonly MAX_IMAGE_SIZE = 20000000; // ~15MB base64 limit

  static async analyzeImage(
    base64Image: string,
    mode: string,
  ): Promise<OpenAIVisionResult> {
    try {
      if (base64Image.length > this.MAX_IMAGE_SIZE) {
        throw new Error('Image too large for vision analysis (max ~15MB)');
      }

      // Server-side Gemini vision (key never leaves the edge function).
      const { data, error } = await supabase.functions.invoke(
        'vision-analyze',
        {
          body: { image: base64Image, mode },
        },
      );
      if (error) throw error;

      const analysisText = (data as { text?: string })?.text ?? '';
      return this.parseResponse(analysisText, mode);
    } catch (error) {
      console.error('❌ Vision analysis error:', error);
      throw error;
    }
  }

  private static parseResponse(
    response: string,
    mode: string,
  ): OpenAIVisionResult {
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
        suggestions: this.validateSuggestions(parsed.suggestions),
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
      if (
        mode === 'receipt-scanner' &&
        parsed.store_name &&
        typeof parsed.store_name === 'string'
      ) {
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

  private static validateType(
    type: any,
  ): 'food' | 'receipt' | 'multiple' | 'unknown' {
    const validTypes = ['food', 'receipt', 'multiple', 'unknown'];
    return validTypes.includes(type) ? type : 'unknown';
  }

  private static clampConfidence(confidence: any): number {
    const num = typeof confidence === 'number' ? confidence : 0;
    return Math.min(Math.max(Math.round(num), 0), 100);
  }

  private static validateDetectedItems(
    items: any,
    mode: string,
  ): Array<{
    name: string;
    confidence: number;
    category: 'food' | 'drink' | 'unknown';
    price?: number;
    is_food?: boolean;
  }> {
    if (!Array.isArray(items)) return [];

    return items.slice(0, 50).map((item) => {
      const validatedItem: any = {
        name: typeof item.name === 'string' ? item.name : 'Unknown Item',
        confidence: this.clampConfidence(item.confidence),
        category: ['food', 'drink', 'unknown'].includes(item.category)
          ? item.category
          : 'unknown',
      };

      // ✅ RECEIPT SCANNER SPECIFIC FIELDS
      if (mode === 'receipt-scanner') {
        if (typeof item.price === 'number' && item.price > 0) {
          validatedItem.price = Math.round(item.price * 100) / 100; // Round to 2 decimals
        }
        if (typeof item.is_food === 'boolean') {
          validatedItem.is_food = item.is_food;
        } else {
          validatedItem.is_food =
            validatedItem.category === 'food' ||
            validatedItem.category === 'drink';
        }
      }

      return validatedItem;
    });
  }

  private static validateSuggestions(suggestions: any): string[] {
    if (!Array.isArray(suggestions)) return [];

    return suggestions
      .filter((s) => typeof s === 'string')
      .slice(0, 5)
      .map((s) => s.trim());
  }

  private static validateNutrition(nutrition: any) {
    return {
      protein: Math.max(0, Math.round(nutrition.protein || 0)),
      carbs: Math.max(0, Math.round(nutrition.carbs || 0)),
      fat: Math.max(0, Math.round(nutrition.fat || 0)),
      fiber: Math.max(0, Math.round(nutrition.fiber || 0)),
    };
  }

  private static getFallbackResponse(
    mode: string,
    rawResponse: string,
  ): OpenAIVisionResult {
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
      suggestions = [
        'Receipt analyzed',
        'Check image quality',
        'Try better lighting',
      ];
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
      suggestions,
    };
  }
}
