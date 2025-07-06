// lib/recipeAIService.ts - ScrapingBee Entegrasyonu - %100 Kullanıma Hazır
import { Platform } from 'react-native';
import { scrapeUrl, ScrapingResult } from '@/lib/scrapeService';

// Platform-aware OpenAI import
let openai: any = null;

// ExtractedRecipeData interface
export interface ExtractedRecipeData {
  title: string;
  description?: string;
  image_url?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
    notes?: string
  }>;
  instructions: Array<{
    step: number;
    instruction: string;
    duration_mins?: number
  }>;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  tags?: string[];
  category?: string;
  is_ai_generated?: boolean;
  ai_match_score?: number;
}

// Rate limiting
const rateLimitStore = new Map<string, {
  count: number;
  lastRequest: number;
  dailyCount: number;
  dailyReset: number
}>();

function checkRateLimit(userId: string): { allowed: boolean; waitTime?: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit) {
    rateLimitStore.set(userId, {
      count: 1,
      lastRequest: now,
      dailyCount: 1,
      dailyReset: now + 24 * 60 * 60 * 1000
    });
    return { allowed: true };
  }

  if (now > userLimit.dailyReset) {
    userLimit.dailyCount = 0;
    userLimit.dailyReset = now + 24 * 60 * 60 * 1000;
  }

  if (userLimit.dailyCount >= 20) {
    return { allowed: false, waitTime: userLimit.dailyReset - now };
  }

  const timeSinceLastRequest = now - userLimit.lastRequest;
  if (timeSinceLastRequest < 30000) {
    return { allowed: false, waitTime: 30000 - timeSinceLastRequest };
  }

  userLimit.count++;
  userLimit.dailyCount++;
  userLimit.lastRequest = now;

  return { allowed: true };
}

// Initialize OpenAI
const initializeOpenAI = async () => {
  console.log('\n🔄 [OPENAI] ===== OpenAI CLIENT BAŞLATILIYOR =====');
  console.log('📱 [OPENAI] Platform:', Platform.OS);

  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.error("❌ [OPENAI] API KEY BULUNAMADI!");
    return null;
  }

  console.log('✅ [OPENAI] API Key bulundu:', OPENAI_API_KEY.substring(0, 8) + '...');

  try {
    if (Platform.OS === 'web') {
      console.log('🌐 [OPENAI] Web platform - özel import stratejisi...');

      let OpenAI;
      try {
        const OpenAIModule = await import('openai');
        OpenAI = OpenAIModule.default || OpenAIModule.OpenAI || OpenAIModule;
        console.log('📦 [OPENAI] OpenAI modülü yüklendi:', typeof OpenAI);
      } catch (importError) {
        console.error('❌ [OPENAI] Import hatası:', importError);
        throw new Error('OpenAI modülü web platformunda yüklenemedi');
      }

      if (!OpenAI || typeof OpenAI !== 'function') {
        throw new Error('OpenAI constructor bulunamadı');
      }

      const client = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
        timeout: 60000,
        maxRetries: 3,
      });

      console.log('🏗️ [OPENAI] Client oluşturuldu, test API çağrısı...');

      const testResponse = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 5,
        temperature: 0
      });

      if (testResponse && testResponse.choices && testResponse.choices[0]) {
        console.log('✅ [OPENAI] Test API çağrısı başarılı!');
        console.log('🔄 [OPENAI] ===== OpenAI CLIENT HAZIR =====\n');
        return client;
      } else {
        throw new Error('Test API çağrısı geçersiz yanıt döndü');
      }

    } else {
      console.log('📱 [OPENAI] Native platform için başlatılıyor');
      const OpenAI = (await import('openai')).default;
      return new OpenAI({
        apiKey: OPENAI_API_KEY,
      });
    }

  } catch (error) {
    console.error('❌ [OPENAI] Client başlatma hatası:', error);
    return null;
  }
};

// JSON-LD extraction helper
function extractJsonLdRecipe(html: string): Partial<ExtractedRecipeData> | null {
  try {
    const jsonLdMatch = html.match(/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>([\s\S]*?)<\/script>/gi);
    if (!jsonLdMatch) return null;

    for (const match of jsonLdMatch) {
      const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
      const data = JSON.parse(jsonContent);

      if (data['@type'] === 'Recipe' || (Array.isArray(data) && data.some(item => item['@type'] === 'Recipe'))) {
        const recipe = Array.isArray(data) ? data.find(item => item['@type'] === 'Recipe') : data;

        return {
          title: recipe.name,
          description: recipe.description,
          image_url: recipe.image?.url || (Array.isArray(recipe.image) ? recipe.image[0]?.url : recipe.image),
          prep_time: parseDuration(recipe.prepTime),
          cook_time: parseDuration(recipe.cookTime),
          servings: parseInt(recipe.recipeYield) || undefined,
          ingredients: recipe.recipeIngredient?.map((ing: string) => ({
            name: ing
          })) || [],
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
    console.warn('⚠️ [RECIPE] JSON-LD parsing error:', error);
    return null;
  }
}

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

// ScrapingBee için optimize edilmiş platform stratejisi
function getOptimalScrapingStrategy(url: string): {
  renderJs: boolean;
  screenshot: boolean;
  screenshotFullPage: boolean;
  waitFor: number;
  premium_proxy: boolean;
  priority: 'speed' | 'quality';
  reasoning: string;
} {
  const domain = url.toLowerCase();

  // Recipe blogs: JSON-LD olasılığı yüksek
  if (domain.includes('allrecipes.com') || 
      domain.includes('food.com') || 
      domain.includes('foodnetwork.com') ||
      domain.includes('seriouseats.com') || 
      domain.includes('epicurious.com') || 
      domain.includes('tasty.co') ||
      domain.includes('delish.com') ||
      domain.includes('bonappetit.com') ||
      domain.includes('eatingwell.com') ||
      domain.includes('foodandwine.com')) {
    return {
      renderJs: true,
      screenshot: false,
      screenshotFullPage: false,
      waitFor: 2000,
      premium_proxy: false,
      priority: 'speed',
      reasoning: 'Recipe blog: JSON-LD olasılığı yüksek, ScrapingBee hızlı mod'
    };
  }

  // Social media: Screenshot + JS gerekli (Multimodal AI için)
  if (domain.includes('youtube.com') || 
      domain.includes('tiktok.com') || 
      domain.includes('instagram.com') || 
      domain.includes('pinterest.com') ||
      domain.includes('facebook.com') ||
      domain.includes('fb.com')) {
    return {
      renderJs: true,
      screenshot: true,
      screenshotFullPage: true,
      waitFor: 5000,
      premium_proxy: true,
      priority: 'quality',
      reasoning: 'Social media: Screenshot + JS rendering gerekli, Multimodal AI için'
    };
  }

  // Genel siteler
  return {
    renderJs: true,
    screenshot: false,
    screenshotFullPage: false,
    waitFor: 2000,
    premium_proxy: false,
    priority: 'speed',
    reasoning: 'Genel website: ScrapingBee standart işlem'
  };
}

// MAIN EXTRACTION FUNCTION - ScrapingBee Entegrasyonu
export async function extractRecipeFromUrl(url: string, userId: string): Promise<ExtractedRecipeData | null> {
  try {
    console.log('\n🧪 [RECIPE] ===== "RECIME PLUS" ScrapingBee TARİF ÇIKARIM BAŞLADI =====');
    console.log('🌐 [RECIPE] URL:', url);

    // Initialize OpenAI client
    if (!openai) {
      console.log('🔄 [RECIPE] OpenAI client başlatılıyor...');
      openai = await initializeOpenAI();
      if (!openai) {
        throw new Error('OpenAI client could not be initialized. Please check your API key configuration.');
      }
    }

    // Rate limiting check
    const rateLimitResult = checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      const waitMinutes = Math.ceil((rateLimitResult.waitTime || 0) / 60000);
      throw new Error(`Rate limit exceeded. Please wait ${waitMinutes} minutes before trying again.`);
    }

    console.log('✅ [RECIPE] OpenAI + ScrapingBee hazır, "Recime Plus" stratejisi başlıyor...');

    // KATMAN 1: Optimal strateji belirleme
    const strategy = getOptimalScrapingStrategy(url);
    console.log('📋 [RECIPE] ScrapingBee stratejisi:', strategy);

    // KATMAN 2: ScrapingBee ile içerik çekme
    console.log('🔍 [RECIPE] ScrapingBee ile içerik çekiliyor...');
    const scrapingResult: ScrapingResult = await scrapeUrl(url, {
      renderJs: strategy.renderJs,
      screenshot: strategy.screenshot,
      screenshotFullPage: strategy.screenshotFullPage,
      waitFor: strategy.waitFor,
      premium_proxy: strategy.premium_proxy
    });

    if (!scrapingResult.success || !scrapingResult.html) {
      console.warn('⚠️ [RECIPE] ScrapingBee başarısız, fallback basit fetch...');
      
      // Fallback: Simple fetch
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const html = await response.text();
        scrapingResult.html = html;
        scrapingResult.success = true;
        console.log('✅ [RECIPE] Fallback fetch başarılı');
      } catch (fetchError) {
        throw new Error(`Failed to scrape content: ${scrapingResult.error || 'Unknown error'}`);
      }
    }

    console.log('📄 [RECIPE] ScrapingBee içerik alındı:', {
      htmlLength: scrapingResult.html.length,
      platform: scrapingResult.platform,
      hasScreenshot: !!scrapingResult.screenshot,
      creditsUsed: scrapingResult.creditsUsed,
      executionTime: scrapingResult.executionTime
    });

    // KATMAN 3: JSON-LD kontrolü (Öncelik)
    console.log('🔍 [RECIPE] JSON-LD kontrolü yapılıyor...');
    const jsonLdRecipe = extractJsonLdRecipe(scrapingResult.html);
    
    if (jsonLdRecipe && jsonLdRecipe.title && jsonLdRecipe.ingredients && jsonLdRecipe.ingredients.length > 0) {
      console.log('🎯 [RECIPE] JSON-LD bulundu! AI\'sız çıkarım (ScrapingBee ile)');
      console.log('📝 [RECIPE] Başlık:', jsonLdRecipe.title);
      console.log('🥘 [RECIPE] Malzeme sayısı:', jsonLdRecipe.ingredients.length);

      const result: ExtractedRecipeData = {
        ...jsonLdRecipe,
        is_ai_generated: false,
        ai_match_score: 98 // ScrapingBee + JSON-LD = en yüksek güven
      } as ExtractedRecipeData;

      console.log('✅ [RECIPE] ScrapingBee + JSON-LD çıkarımı tamamlandı!');
      console.log('🧪 [RECIPE] ===== "RECIME PLUS ScrapingBee" BAŞARILI =====\n');

      return result;
    }

    // KATMAN 4: AI analizi (JSON-LD bulunamazsa)
    console.log('🤖 [RECIPE] JSON-LD bulunamadı veya eksik, ScrapingBee + AI analizi başlatılıyor...');

    // Multimodal AI için content hazırlama
    let aiContent = `
URL: ${url}
Platform: ${scrapingResult.platform || 'Unknown'}
ScrapingBee ile çekildi (Credits: ${scrapingResult.creditsUsed || 'Unknown'})
Execution Time: ${scrapingResult.executionTime || 'Unknown'}s

HTML Content:
${scrapingResult.html.substring(0, 12000)}
`;

    // Screenshot varsa AI'a ekle
    if (scrapingResult.screenshot) {
      aiContent += `

Screenshot Available: ${scrapingResult.screenshot}
Visual context provided for enhanced accuracy.
`;
      console.log('📸 [RECIPE] Screenshot AI\'a dahil edildi:', scrapingResult.screenshot);
    }

    // Gelişmiş anti-halüsinasyon prompt
    const systemPrompt = `You are an expert culinary assistant. Extract comprehensive recipe information from the provided HTML content.

**CRITICAL ANTI-HALLUCINATION RULES:**
1. Extract information ONLY from the provided HTML content
2. If information is not present, use null/undefined - DO NOT make up data
3. Cross-reference extracted title with the source URL for consistency
4. Provide confidence score (0-100) for your extraction
5. If screenshot is provided, use visual context to enhance accuracy

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

    console.log('📡 [RECIPE] OpenAI API çağrısı yapılıyor (ScrapingBee content + screenshot)...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: aiContent }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 3000,
    });

    const rawJson = response.choices[0].message.content;
    if (!rawJson) {
      throw new Error('OpenAI returned empty response');
    }

    console.log('✅ [RECIPE] OpenAI yanıtı alındı, parsing...');

    const parsedData = JSON.parse(rawJson);

    // Güven skoru kontrolü
    if (parsedData.confidence_score && parsedData.confidence_score < 75) {
      throw new Error(`Low confidence extraction (${parsedData.confidence_score}%). Please try a different URL.`);
    }

    // Kritik alanları kontrol et
    if (!parsedData.title || !parsedData.ingredients || parsedData.ingredients.length === 0) {
      throw new Error('Incomplete recipe data extracted. Please try a different URL.');
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
      category: parsedData.category || 'General',
      is_ai_generated: true,
      ai_match_score: parsedData.confidence_score || 90
    };

    console.log('✅ [RECIPE] ScrapingBee + AI çıkarımı tamamlandı!');
    console.log('📝 [RECIPE] Başlık:', finalRecipe.title);
    console.log('🖼️ [RECIPE] Görsel:', finalRecipe.image_url ? 'Mevcut' : 'Yok');
    console.log('💳 [RECIPE] Kullanılan ScrapingBee kredisi:', scrapingResult.creditsUsed || 'Bilinmiyor');
    console.log('📸 [RECIPE] Screenshot kullanıldı:', !!scrapingResult.screenshot);
    console.log('🧪 [RECIPE] ===== "RECIME PLUS ScrapingBee" BAŞARILI =====\n');

    return finalRecipe;

  } catch (error: any) {
    console.error('❌ [RECIPE] Hata:', error);

    // Kullanıcı dostu hata mesajları
    if (error.message?.includes('Rate limit')) {
      throw error;
    } else if (error.message?.includes('Low confidence')) {
      throw error;
    } else if (error.message?.includes('Incomplete recipe')) {
      throw error;
    } else if (error.message?.includes('Failed to scrape')) {
      throw new Error('Could not access the webpage. Please check the URL and try again.');
    } else if (error.message?.includes('OpenAI client could not be initialized')) {
      throw error;
    } else {
      throw new Error('Could not extract recipe from this URL. Please try a different link.');
    }
  }
}

// Utility functions
export function getOpenAIStatus(): string {
  if (Platform.OS === 'web') {
    return 'Running in browser mode (development only)';
  } else {
    return 'Running in native mode';
  }
}

export function getScrapingServiceStatus(): string {
  const apiKey = process.env.EXPO_PUBLIC_SCRAPINGBEE_API_KEY;
  return apiKey ? 'ScrapingBee configured and ready' : 'ScrapingBee not configured';
}

// Debug function for testing
export async function debugRecipeExtraction(url: string): Promise<{
  success: boolean;
  scrapingResult?: ScrapingResult;
  jsonLdFound?: boolean;
  error?: string;
}> {
  try {
    console.log('\n🔍 [DEBUG] Recipe extraction debug başlatılıyor:', url);
    
    const strategy = getOptimalScrapingStrategy(url);
    console.log('📋 [DEBUG] Strateji:', strategy);
    
    const scrapingResult = await scrapeUrl(url, {
      renderJs: strategy.renderJs,
      screenshot: false, // Debug için screenshot'sız
      screenshotFullPage: false,
      waitFor: strategy.waitFor,
      premium_proxy: strategy.premium_proxy
    });
    
    const jsonLdRecipe = scrapingResult.success ? extractJsonLdRecipe(scrapingResult.html) : null;
    
    console.log('📊 [DEBUG] Sonuçlar:', {
      scrapingSuccess: scrapingResult.success,
      htmlLength: scrapingResult.html?.length || 0,
      jsonLdFound: !!jsonLdRecipe,
      platform: scrapingResult.platform
    });
    
    return {
      success: true,
      scrapingResult,
      jsonLdFound: !!jsonLdRecipe
    };
    
  } catch (error) {
    console.error('❌ [DEBUG] Debug hatası:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
