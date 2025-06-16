// lib/googleVisionService.ts
import { API_CONFIG, APIClient } from './apiConfig';
import { cleanBase64 } from './imageUtils';

export interface GoogleVisionTextResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    boundingBox: any;
  }>;
}

export interface GoogleVisionFoodResult {
  detectedItems: Array<{
    name: string;
    confidence: number;
    category: 'food' | 'drink' | 'unknown';
  }>;
  isFood: boolean;
  mainItem: string | null;
  suggestions: string[];
}

export class GoogleVisionService {
  private static readonly config = API_CONFIG.googleVision;

  // OCR Text Detection (for receipts)
  static async detectText(imageBase64: string): Promise<GoogleVisionTextResult> {
    try {
      console.log('🔍 Google Vision: Starting text detection...');
      
      // 👇 DEBUG EKLEMELERI:
      console.log('🔑 API Key:', this.config.apiKey?.substring(0, 10) + '...');
      console.log('🔑 API Key length:', this.config.apiKey?.length);
      console.log('🔑 API Key exists:', !!this.config.apiKey);
      console.log('🌐 Base URL:', this.config.baseUrl);
      console.log('📸 Image Base64 length:', imageBase64?.length);
      // 👆 DEBUG SONU
      
      const requestBody = {
        requests: [{
          image: { content: cleanBase64(imageBase64) },
          features: [
            { type: this.config.features.textDetection, maxResults: 50 },
            { type: this.config.features.documentTextDetection, maxResults: 50 }
          ]
        }]
      };

      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await APIClient.makeRequest(
        `${this.config.baseUrl}?key=${this.config.apiKey}`,
        { method: 'POST', body: JSON.stringify(requestBody) }
      );

      console.log('📥 API Response:', response);
      console.log('✅ Google Vision: Text detection successful');
      return this.parseTextResponse(response);
    } catch (error) {
      console.error('❌ Google Vision Text Detection Error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw new Error('Failed to detect text from image');
    }
  }

  // Food Detection and Classification
  static async detectFood(imageBase64: string): Promise<GoogleVisionFoodResult> {
    try {
      console.log('🍎 Google Vision: Starting food detection...');
      
      // 👇 DEBUG EKLEMELERI:
      console.log('🔑 API Key exists for food detection:', !!this.config.apiKey);
      console.log('📸 Image Base64 length for food:', imageBase64?.length);
      // 👆 DEBUG SONU
      
      const requestBody = {
        requests: [{
          image: { content: cleanBase64(imageBase64) },
          features: [
            { type: this.config.features.labelDetection, maxResults: 20 },
            { type: this.config.features.objectLocalization, maxResults: 10 }
          ]
        }]
      };

      console.log('📤 Food detection request body:', JSON.stringify(requestBody, null, 2));

      const response = await APIClient.makeRequest(
        `${this.config.baseUrl}?key=${this.config.apiKey}`,
        { method: 'POST', body: JSON.stringify(requestBody) }
      );

      console.log('📥 Food detection response:', response);
      console.log('✅ Google Vision: Food detection successful');
      return this.parseFoodResponse(response);
    } catch (error) {
      console.error('❌ Google Vision Food Detection Error:', error);
      console.error('❌ Food detection error details:', JSON.stringify(error, null, 2));
      throw new Error('Failed to detect food from image');
    }
  }

  // Comprehensive Analysis
  static async analyzeImage(imageBase64: string): Promise<{
    text: GoogleVisionTextResult;
    food: GoogleVisionFoodResult;
    type: 'receipt' | 'food' | 'mixed' | 'unknown';
  }> {
    try {
      console.log('🔬 Google Vision: Starting comprehensive analysis...');
      console.log('🔑 Config check - API Key exists:', !!this.config.apiKey);
      console.log('🌐 Config check - Base URL:', this.config.baseUrl);
      
      const [textResult, foodResult] = await Promise.all([
        this.detectText(imageBase64),
        this.detectFood(imageBase64)
      ]);

      const imageType = this.determineImageType(textResult, foodResult);
      
      console.log(`✅ Google Vision: Analysis complete - Type: ${imageType}`);
      
      return {
        text: textResult,
        food: foodResult,
        type: imageType
      };
    } catch (error) {
      console.error('❌ Google Vision Analysis Error:', error);
      console.error('❌ Analysis error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  // Helper Methods
  private static parseTextResponse(response: any): GoogleVisionTextResult {
    console.log('🔍 Parsing text response:', response);
    
    const textAnnotations = response.responses?.[0]?.textAnnotations || [];
    
    if (textAnnotations.length === 0) {
      console.log('⚠️ No text annotations found');
      return { text: '', confidence: 0, words: [] };
    }

    const fullText = textAnnotations[0]?.description || '';
    const words = textAnnotations.slice(1).map(annotation => ({
      text: annotation.description,
      boundingBox: annotation.boundingPoly
    }));

    console.log('✅ Text parsed successfully:', { textLength: fullText.length, wordsCount: words.length });

    return {
      text: fullText,
      confidence: textAnnotations.length > 5 ? 90 : 70,
      words
    };
  }

  private static parseFoodResponse(response: any): GoogleVisionFoodResult {
    console.log('🍎 Parsing food response:', response);
    
    const labels = response.responses?.[0]?.labelAnnotations || [];
    console.log('🏷️ Labels found:', labels.length);
    
    const foodKeywords = [
      'food', 'fruit', 'vegetable', 'meat', 'dairy', 'bread', 'beverage',
      'drink', 'apple', 'banana', 'orange', 'tomato', 'carrot', 'broccoli',
      'cheese', 'milk', 'water', 'juice', 'coffee', 'tea', 'pizza', 'burger'
    ];

    const drinkKeywords = ['drink', 'beverage', 'water', 'juice', 'coffee', 'tea'];

    const detectedItems = labels
      .filter(label => {
        const desc = label.description.toLowerCase();
        return foodKeywords.some(keyword => desc.includes(keyword));
      })
      .map(label => ({
        name: label.description,
        confidence: Math.round(label.score * 100),
        category: this.categorizeFoodItem(label.description, drinkKeywords)
      }))
      .sort((a, b) => b.confidence - a.confidence);

    console.log('🍽️ Food items detected:', detectedItems);

    const isFood = detectedItems.length > 0 && detectedItems[0].confidence > 60;
    const mainItem = isFood ? detectedItems[0].name : null;

    return {
      detectedItems: detectedItems.slice(0, 10),
      isFood,
      mainItem,
      suggestions: this.generateFoodSuggestions(detectedItems)
    };
  }

  private static categorizeFoodItem(itemName: string, drinkKeywords: string[]): 'food' | 'drink' | 'unknown' {
    const lowerName = itemName.toLowerCase();
    return drinkKeywords.some(keyword => lowerName.includes(keyword)) ? 'drink' : 'food';
  }

  private static generateFoodSuggestions(items: any[]): string[] {
    if (items.length === 0) return [];
    
    const suggestions = [];
    if (items[0].category === 'food') {
      suggestions.push('Add to pantry inventory', 'Check nutrition information');
    } else if (items[0].category === 'drink') {
      suggestions.push('Track beverage consumption');
    }
    
    if (items.length > 1) {
      suggestions.push('Analyze multiple ingredients');
    }
    
    return suggestions;
  }

  private static determineImageType(
    textResult: GoogleVisionTextResult, 
    foodResult: GoogleVisionFoodResult
  ): 'receipt' | 'food' | 'mixed' | 'unknown' {
    const hasSignificantText = textResult.confidence > 70 && textResult.text.length > 50;
    const hasFood = foodResult.isFood;
    
    const receiptKeywords = ['total', 'price', '$', 'tax', 'receipt'];
    const hasReceiptKeywords = receiptKeywords.some(keyword => 
      textResult.text.toLowerCase().includes(keyword)
    );
    
    if (hasSignificantText && hasReceiptKeywords) return 'receipt';
    if (hasFood && hasSignificantText) return 'mixed';
    if (hasFood) return 'food';
    return 'unknown';
  }
}
