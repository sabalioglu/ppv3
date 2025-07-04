// lib/recipeAIService.ts - MEVCUT DOSYAYI GÜNCELLEYIN
import { Platform } from 'react-native';
import { ScrapeDoService, ScrapedContent } from './scrapeService';

// Scrape.do service instance
const scrapeService = new ScrapeDoService();

// Platform-aware OpenAI import (mevcut kod aynı kalacak)
let openai: any = null;

// Initialize OpenAI (mevcut kod aynı kalacak)
const initializeOpenAI = async () => {
  // ... mevcut kod aynı kalacak
};

// Rate limiting (mevcut kod aynı kalacak)
const rateLimitStore = new Map();

// ✅ YENİ extractRecipeFromUrl FONKSİYONU
export async function extractRecipeFromUrl(url: string, userId: string): Promise<ExtractedRecipeData | null> {
  try {
    // Initialize OpenAI client
    if (!openai) {
      openai = await initializeOpenAI();
      if (!openai) {
        throw new Error('OpenAI client could not be initialized. Please check your API key configuration.');
      }
    }

    // Rate limiting check (mevcut kod aynı)
    const rateLimitResult = checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      const waitMinutes = Math.ceil((rateLimitResult.waitTime || 0) / 60000);
      throw new Error(`Rate limit exceeded. Please wait ${waitMinutes} minutes before trying again.`);
    }

    console.log('🔍 Starting recipe extraction from URL:', url);

    // 🚀 SCRAPE.DO ENTEGRASYONİ - RECIME PLUS STRATEJİSİ
    
    // Katman 1: Optimal strateji belirleme
    const strategy = scrapeService.getOptimalStrategy(url);
    console.log('📋 Scraping strategy:', strategy);

    // Katman 2: İçerik çekme
    const scrapedContent = await scrapeService.scrapeUrl(url, {
      screenshot: strategy.screenshot,
      jsRendering: strategy.jsRendering
    });

    if (!scrapedContent.success || !scrapedContent.html) {
      throw new Error(`Failed to scrape content: ${scrapedContent.error || 'Unknown error'}`);
    }

    console.log('✅ Successfully scraped content. HTML length:', scrapedContent.html.length);

    // Katman 3: JSON-LD kontrolü (öncelik)
    const jsonLdRecipe = extractJsonLdRecipe(scrapedContent.html);
    if (jsonLdRecipe) {
      console.log('🎯 Recipe extracted from JSON-LD (no AI needed)');
      return {
        ...jsonLdRecipe,
        source_url: url,
        is_ai_generated: false,
        ai_match_score: 95 // JSON-LD'den geldiği için yüksek güven
      } as ExtractedRecipeData;
    }

    // Katman 4: AI analizi (JSON-LD bulunamazsa)
    console.log('🤖 Using AI analysis for content extraction');

    // Gelişmiş sistem prompt'u
    const systemPrompt = `You are an expert culinary assistant. Extract comprehensive recipe information from the provided HTML content.

**CRITICAL ANTI-HALLUCINATION RULES:**
1. Extract information ONLY from the provided HTML content
2. If information is not present, use null/undefined - DO NOT make up data
3. Cross-reference extracted title with the source URL for consistency
4. Provide confidence score (0-100) for your extraction

**EXTRACTION PRIORITIES:**
- Recipe title and description
- High-quality image URL (from og:image, twitter:image, or img tags)
- Prep/cook times in minutes
- Servings count
- Difficulty level assessment
- Complete ingredients with quantities
- Step-by-step instructions
- Nutritional information (if available)
- Relevant tags and category

**RESPOND ONLY WITH VALID JSON:**
{
  "title": "string",
  "description": "string (optional)",
  "image_url": "string (high priority)",
  "prep_time": "number (minutes, optional)",
  "cook_time": "number (minutes, optional)",
  "servings": "number (optional)",
  "difficulty": "Easy|Medium|Hard (optional)",
  "ingredients": [{"name": "string", "quantity": "string", "unit": "string", "notes": "string"}],
  "instructions": [{"step": "number", "instruction": "string", "duration_mins": "number"}],
  "nutrition": {"calories": "number", "protein": "number", "carbs": "number", "fat": "number", "fiber": "number"},
  "tags": ["string"],
  "category": "string",
  "confidence_score": "number (0-100)"
}`;

    // AI'a gönderilecek içerik hazırlama
    const contentForAI = `
URL: ${url}
Page Title: ${scrapedContent.title || 'Not available'}
${scrapedContent.screenshot ? `Screenshot URL: ${scrapedContent.screenshot}` : ''}

HTML Content:
${scrapedContent.html.substring(0, 12000)} // Token limit için kısaltma
`;

    // OpenAI API çağrısı
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contentForAI }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Düşük sıcaklık = daha deterministik
      max_tokens: 3000,
    });

    const rawJson = response.choices[0].message.content;
    if (!rawJson) {
      throw new Error('OpenAI returned empty response');
    }

    // JSON parsing ve validasyon
    const parsedData = JSON.parse(rawJson);
    
    // Güven skoru kontrolü
    if (parsedData.confidence_score && parsedData.confidence_score < 70) {
      throw new Error(`Low confidence extraction (${parsedData.confidence_score}%). Please try a different URL.`);
    }

    // Kritik alanları kontrol et
    if (!parsedData.title || !parsedData.ingredients || parsedData.ingredients.length === 0) {
      throw new Error('Incomplete recipe data extracted. Please try a different URL.');
    }

    // Görsel URL optimizasyonu
    if (!parsedData.image_url && scrapedContent.screenshot) {
      parsedData.image_url = scrapedContent.screenshot;
    }

    // Final recipe data
    const finalRecipe: ExtractedRecipeData = {
      title: parsedData.title,
      description: parsedData.description || '',
      image_url: parsedData.image_url,
      prep_time: parsedData.prep_time || 0,
      cook_time: parsedData.cook_time || 0,
      servings: parsedData.servings || 1,
      difficulty: parsedData.difficulty || 'Easy',
      ingredients: parsedData.ingredients || [],
      instructions: parsedData.instructions || [],
      nutrition: parsedData.nutrition,
      tags: parsedData.tags || [],
      category: parsedData.category || 'General'
    };

    console.log('✅ Recipe successfully extracted:', finalRecipe.title);
    return finalRecipe;

  } catch (error: any) {
    console.error('❌ Error extracting recipe:', error);
    
    // Kullanıcı dostu hata mesajları
    if (error.message?.includes('Rate limit')) {
      throw error;
    } else if (error.message?.includes('Low confidence')) {
      throw error;
    } else if (error.message?.includes('Incomplete recipe')) {
      throw error;
    } else if (error.message?.includes('Failed to scrape')) {
      throw new Error('Could not access the webpage. Please check the URL and try again.');
    } else {
      throw new Error('Could not extract recipe from this URL. Please try a different link.');
    }
  }
}

// JSON-LD çıkarma yardımcı fonksiyonu
function extractJsonLdRecipe(html: string): Partial<ExtractedRecipeData> | null {
  try {
    const jsonLdMatch = html.match(/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/gis);
    if (!jsonLdMatch) return null;

    for (const match of jsonLdMatch) {
      const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
      const data = JSON.parse(jsonContent);
      
      // Recipe şeması kontrolü
      if (data['@type'] === 'Recipe' || (Array.isArray(data) && data.some(item => item['@type'] === 'Recipe'))) {
        const recipe = Array.isArray(data) ? data.find(item => item['@type'] === 'Recipe') : data;
        
        return {
          title: recipe.name,
          description: recipe.description,
          image_url: recipe.image?.url || (Array.isArray(recipe.image) ? recipe.image[0]?.url : recipe.image),
          prep_time: parseDuration(recipe.prepTime),
          cook_time: parseDuration(recipe.cookTime),
          servings: parseInt(recipe.recipeYield) || undefined,
          ingredients: recipe.recipeIngredient?.map((ing: string) => ({ name: ing })) || [],
          instructions: recipe.recipeInstructions?.map((inst: any, idx: number) => ({
            step: idx + 1,
            instruction: typeof inst === 'string' ? inst : inst.text
          })) || [],
          nutrition: recipe.nutrition ? {
            calories: parseFloat(recipe.nutrition.calories) || undefined,
            protein: parseFloat(recipe.nutrition.proteinContent) || undefined,
            carbs: parseFloat(recipe.nutrition.carbohydrateContent) || undefined,
            fat: parseFloat(recipe.nutrition.fatContent) || undefined,
            fiber: parseFloat(recipe.nutrition.fiberContent) || undefined
          } : undefined,
          tags: recipe.keywords?.split(',').map((tag: string) => tag.trim()) || [],
          category: recipe.recipeCategory || 'General'
        };
      }
    }
    return null;
  } catch (error) {
    console.warn('JSON-LD parsing error:', error);
    return null;
  }
}

// ISO 8601 süre formatını dakikaya çeviren fonksiyon
function parseDuration(duration: string): number | undefined {
  if (!duration) return undefined;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (match) {
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    return hours * 60 + minutes;
  }
  return undefined;
}

// Mevcut fonksiyonlar aynı kalacak
function checkRateLimit(userId: string) {
  // ... mevcut kod
}

export function getOpenAIStatus(): string {
  // ... mevcut kod
}
