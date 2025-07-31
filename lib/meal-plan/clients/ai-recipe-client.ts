// lib/meal-plan/clients/ai-recipe-client.ts (YENİ DOSYA)
import { AIRecipe, AIRecipeRequest, AIRecipeResponse } from '../types/ai-recipe-types';

export class AIRecipeClient {
  private openaiApiKey: string;
  private geminiApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    this.geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  }

  async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse> {
    try {
      // Önce OpenAI dene
      return await this.generateWithOpenAI(request);
    } catch (error) {
      console.log('OpenAI failed, trying Gemini...', error);
      // Fallback: Gemini
      return await this.generateWithGemini(request);
    }
  }

  private async generateWithOpenAI(request: AIRecipeRequest): Promise<AIRecipeResponse> {
    const prompt = this.buildSmartPrompt(request);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a master chef who creates practical, delicious recipes using only available ingredients. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error('No response from OpenAI');
    }

    return this.parseAIResponse(generatedText, request);
  }

  private async generateWithGemini(request: AIRecipeRequest): Promise<AIRecipeResponse> {
    const prompt = this.buildSmartPrompt(request);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini');
    }

    return this.parseAIResponse(generatedText, request);
  }

  private buildSmartPrompt(request: AIRecipeRequest): string {
    return `
    Create a ${request.mealType} recipe using ONLY these available ingredients:
    ${request.pantryItems.join(', ')}

    REQUIREMENTS:
    - Servings: ${request.servings}
    - Max cooking time: ${request.maxCookingTime || 60} minutes
    - User goal: ${request.userGoal}
    - Dietary restrictions: ${request.dietaryRestrictions.join(', ') || 'none'}
    - Allergies to avoid: ${request.allergies.join(', ') || 'none'}
    ${request.calorieTarget ? `- Target calories: ${request.calorieTarget}` : ''}
    ${request.cuisine ? `- Preferred cuisine: ${request.cuisine}` : ''}

    INTELLIGENCE RULES:
    ✅ Use ingredients that naturally complement each other
    ✅ Follow traditional ${request.mealType} patterns
    ✅ Consider proper cooking techniques for ingredients
    ✅ Ensure nutritional balance for ${request.userGoal}
    ❌ NO weird ingredient combinations (fish + chocolate, etc.)
    ❌ NO ingredients not in the available list
    ❌ NO overly complex techniques

    NUTRITIONAL OPTIMIZATION:
    ${this.getNutritionalGuidance(request.userGoal, request.mealType)}

    Respond with ONLY valid JSON in this exact format:
    {
      "recipe": {
        "name": "Recipe name",
        "description": "Brief description",
        "ingredients": [
          {
            "name": "ingredient name",
            "amount": number,
            "unit": "unit",
            "category": "protein|carbs|vegetables|dairy|spices",
            "isOptional": false
          }
        ],
        "instructions": ["step 1", "step 2", ...],
        "cookingTime": minutes,
        "servings": ${request.servings},
        "difficulty": "easy|medium|hard",
        "calories": estimated_calories,
        "macros": {
          "protein": grams,
          "carbs": grams,
          "fat": grams,
          "fiber": grams
        },
        "tags": ["tag1", "tag2"],
        "cuisine": "cuisine_type",
        "mealType": "${request.mealType}"
      },
      "confidence": score_0_to_100,
      "reasoning": "Why these ingredients work well together"
    }
    `;
  }

  private getNutritionalGuidance(userGoal: string, mealType: string): string {
    const goalGuidance = {
      weight_loss: "Focus on high protein, high fiber, low calorie density. Minimize refined carbs.",
      muscle_gain: "Prioritize protein (25-35g). Include complex carbs for energy.",
      maintenance: "Balanced macros. Focus on nutritional variety and satisfaction.",
      general_health: "Emphasize whole foods, variety, and micronutrient density."
    };

    const mealGuidance = {
      breakfast: "Light but energizing. Include protein to prevent mid-morning crashes.",
      lunch: "Balanced and sustaining. Should fuel afternoon activities.",
      dinner: "Can be heartier. Focus on satisfaction and digestibility.",
      snack: "Keep light. Focus on satiety without heaviness."
    };

    return `${goalGuidance[userGoal]} ${mealGuidance[mealType]}`;
  }

  private parseAIResponse(responseText: string, request: AIRecipeRequest): AIRecipeResponse {
    try {
      // JSON'dan fazla metin varsa temizle
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
      
      const parsed = JSON.parse(cleanJson);
      
      // Validation ve enrichment
      const recipe: AIRecipe = {
        ...parsed.recipe,
        id: this.generateRecipeId(),
        pantryMatch: this.calculatePantryMatch(parsed.recipe.ingredients, request.pantryItems),
        missingIngredients: this.findMissingIngredients(parsed.recipe.ingredients, request.pantryItems),
        compatibilityScore: parsed.confidence || 85,
        source: 'ai-generated' as const,
        createdAt: new Date(),
      };

      return {
        recipe,
        confidence: parsed.confidence || 85,
        reasoning: parsed.reasoning || 'AI generated recipe based on available ingredients',
        alternatives: []
      };

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private generateRecipeId(): string {
    return `ai-recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculatePantryMatch(recipeIngredients: AIIngredient[], pantryItems: string[]): number {
    const availableCount = recipeIngredients.filter(ingredient => 
      pantryItems.some(pantryItem => 
        pantryItem.toLowerCase().includes(ingredient.name.toLowerCase()) ||
        ingredient.name.toLowerCase().includes(pantryItem.toLowerCase())
      )
    ).length;

    return Math.round((availableCount / recipeIngredients.length) * 100);
  }

  private findMissingIngredients(recipeIngredients: AIIngredient[], pantryItems: string[]): string[] {
    return recipeIngredients
      .filter(ingredient => 
        !pantryItems.some(pantryItem => 
          pantryItem.toLowerCase().includes(ingredient.name.toLowerCase()) ||
          ingredient.name.toLowerCase().includes(pantryItem.toLowerCase())
        )
      )
      .map(ingredient => ingredient.name);
  }
}
