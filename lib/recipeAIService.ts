// lib/recipeAIService.ts - DÜZELTİLMİŞ SCRAPE.DO - TAM KULLANIMA HAZIR
import { Platform } from 'react-native';

// Platform-aware OpenAI import
let openai: any = null;

// Düzeltilmiş Scrape.do Service Class
class ScrapeDoService {
  private apiKey: string;
  private baseUrl = 'https://api.scrape.do'; // HTTPS kullanımı

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_SCRAPE_DO_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ [SCRAPE.DO] API key bulunamadı! .env dosyanızı kontrol edin.');
    } else {
      console.log('✅ [SCRAPE.DO] Servis başarıyla başlatıldı (düzeltilmiş GET formatı).');
    }
  }

  async scrapeUrl(url: string, options: {
    screenshot?: boolean;
    jsRendering?: boolean;
  } = {}): Promise<{
    html: string;
    screenshot?: string;
    success: boolean;
    error?: string;
  }> {
    console.log('\n🔍 [SCRAPE.DO] ===== SCRAPING BAŞLADI (DÜZELTİLMİŞ GET FORMAT) =====');
    console.log('🌐 [SCRAPE.DO] Hedef URL:', url);
    console.log('📋 [SCRAPE.DO] Seçenekler:', {
      screenshot: options.screenshot || false,
      jsRendering: options.jsRendering || false
    });
    
    try {
      if (!this.apiKey) {
        throw new Error('Scrape.do API key yapılandırılmamış');
      }

      // Scrape.do desteğinin önerdiği GET query formatı
      const queryParams = new URLSearchParams({
        token: this.apiKey,           // ✅ X-API-KEY yerine token parametresi
        url: url,                     // ✅ URL otomatik encode edilecek
        super: 'True',               // ✅ Scrape.do'nun önerdiği parametre
        customheaders: 'false'       // ✅ Proxy modu için önerilen
      });

      // Opsiyonel parametreler
      if (options.jsRendering) {
        queryParams.append('render', 'true');
      }
      if (options.screenshot) {
        queryParams.append('screenshot', 'true');
      }

      // Format validation
      queryParams.append('format', 'html'); // HTML response istiyoruz

      const requestUrl = `${this.baseUrl}/?${queryParams.toString()}`;
      
      console.log('📤 [SCRAPE.DO] Düzeltilmiş GET isteği hazırlandı');
      console.log('🌐 [SCRAPE.DO] Request URL (token gizli):', requestUrl.replace(this.apiKey, 'TOKEN_HIDDEN'));
      console.log('🔑 [SCRAPE.DO] Token query parametresi kullanılıyor:', this.apiKey.substring(0, 8) + '...');

      const startTime = Date.now();
      
      // ✅ GET request (POST değil!)
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'AI-Food-Pantry-RecimePlus/1.0'
        }
      });

      const endTime = Date.now();
      const requestDuration = (endTime - startTime) / 1000;
      
      console.log('📡 [SCRAPE.DO] Yanıt durumu:', response.status);
      console.log('⏱️ [SCRAPE.DO] İstek süresi:', requestDuration.toFixed(2) + 's');

      // Response headers analizi
      const responseHeaders = {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        server: response.headers.get('server')
      };
      console.log('📋 [SCRAPE.DO] Response headers:', responseHeaders);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [SCRAPE.DO] API Hata Detayları (Düzeltilmiş GET Format):');
        console.error('  📊 Status:', response.status, response.statusText);
        console.error('  📄 Response Body (ilk 1000 karakter):', errorText.substring(0, 1000));
        
        // Hata türü analizi
        if (response.status === 400) {
          console.error('⚠️ [SCRAPE.DO] 400 Bad Request: Format düzeltildi, plan kısıtlaması olabilir');
          console.error('💡 [SCRAPE.DO] Çözüm önerileri:');
          console.error('   1. Free plan limitlerini kontrol edin');
          console.error('   2. URL encoding doğru mu kontrol edin');
          console.error('   3. API token geçerli mi kontrol edin');
        } else if (response.status === 401) {
          console.error('🔑 [SCRAPE.DO] 401 Unauthorized: API token hatası');
        } else if (response.status === 403) {
          console.error('🚫 [SCRAPE.DO] 403 Forbidden: Site erişimi engelli veya plan kısıtlaması');
        }
        
        throw new Error(`Scrape.do API hatası: ${response.status} ${response.statusText}`);
      }

      // Başarılı yanıt işleme
      const contentType = response.headers.get('content-type') || '';
      let result: {
        html: string;
        screenshot?: string;
        success: boolean;
        error?: string;
      };

      if (contentType.includes('application/json')) {
        // JSON response (screenshot modunda)
        console.log('📦 [SCRAPE.DO] JSON response alındı');
        const data = await response.json();
        result = {
          html: data.html || data.body || '',
          screenshot: data.screenshot,
          success: true
        };
      } else {
        // HTML response (normal modda)
        console.log('📄 [SCRAPE.DO] HTML response alındı');
        const htmlContent = await response.text();
        result = {
          html: htmlContent,
          success: true
        };
      }
      
      // 🔍 DEBUG: Yanıt analizi
      console.log('✅ [SCRAPE.DO] Başarılı! Yanıt analizi (düzeltilmiş GET format):');
      console.log('📄 [SCRAPE.DO] HTML uzunluğu:', result.html.length);
      console.log('📸 [SCRAPE.DO] Screenshot:', result.screenshot ? 'Mevcut' : 'Yok');
      
      if (result.html && result.html.length > 1000) {
        // İçerik kalite analizi
        const hasJsonLd = result.html.includes('application/ld+json');
        const hasOpenGraph = result.html.includes('og:');
        const hasImages = result.html.includes('<img');
        const hasRecipeSchema = result.html.includes('"@type":"Recipe"') || result.html.includes("'@type':'Recipe'");
        const hasTitle = result.html.includes('<title');
        
        console.log('🔍 [SCRAPE.DO] İçerik kalite analizi:');
        console.log('  📊 JSON-LD mevcut:', hasJsonLd);
        console.log('  🖼️ Open Graph meta:', hasOpenGraph);
        console.log('  📷 Görseller bulundu:', hasImages);
        console.log('  🍳 Recipe şeması:', hasRecipeSchema);
        console.log('  🏷️ Title tag:', hasTitle);
        
        // HTML önizleme (daha detaylı)
        const htmlPreview = result.html.substring(0, 500).replace(/\s+/g, ' ');
        console.log('👀 [SCRAPE.DO] HTML önizleme:', htmlPreview + '...');
        
        // AllRecipes spesifik kontroller
        if (url.includes('allrecipes.com')) {
          const hasAllRecipesStructure = result.html.includes('allrecipes') || result.html.includes('recipe-summary');
          console.log('🥘 [SCRAPE.DO] AllRecipes yapısı tespit edildi:', hasAllRecipesStructure);
        }
      } else {
        console.warn('⚠️ [SCRAPE.DO] HTML içeriği çok kısa veya boş:', result.html.length);
      }
      
      console.log('🔍 [SCRAPE.DO] ===== SCRAPING TAMAMLANDI (DÜZELTİLMİŞ GET) =====\n');
      
      return result;

    } catch (error) {
      console.error('\n❌ [SCRAPE.DO] ===== SCRAPING BAŞARISIZ =====');
      console.error('💥 [SCRAPE.DO] Hata detayları:', error);
      
      if (error instanceof Error) {
        console.error('🔍 [SCRAPE.DO] Hata mesajı:', error.message);
        
        // Specific error handling with solutions
        if (error.message.includes('400')) {
          console.error('💡 [SCRAPE.DO] 400 Hatası Çözüm Önerileri:');
          console.error('   1. Scrape.do dashboard\'da plan durumunu kontrol edin');
          console.error('   2. API token\'ın geçerli olduğunu doğrulayın');
          console.error('   3. URL\'nin doğru encode edildiğini kontrol edin');
        } else if (error.message.includes('fetch')) {
          console.error('🌐 [SCRAPE.DO] Network hatası: İnternet bağlantınızı kontrol edin');
        }
      }
      
      console.error('❌ [SCRAPE.DO] ===== SCRAPING BAŞARISIZ SON =====\n');
      
      return {
        html: '',
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  // Platform stratejisi
  getOptimalStrategy(url: string): {
    screenshot: boolean;
    jsRendering: boolean;
    priority: 'speed' | 'quality';
    reasoning: string;
  } {
    const domain = url.toLowerCase();
    
    // AllRecipes ve recipe blogs: JSON-LD olasılığı yüksek
    if (domain.includes('allrecipes.com') || domain.includes('food.com') || 
        domain.includes('foodnetwork.com') || domain.includes('seriouseats.com') ||
        domain.includes('epicurious.com') || domain.includes('tasty.co')) {
      return { 
        screenshot: false, 
        jsRendering: true, 
        priority: 'speed',
        reasoning: 'Recipe blog: JSON-LD olasılığı yüksek, düzeltilmiş GET formatı ile optimize'
      };
    }
    
    // Social media: Screenshot + JS gerekli
    if (domain.includes('youtube.com') || domain.includes('tiktok.com') || 
        domain.includes('instagram.com') || domain.includes('pinterest.com')) {
      return { 
        screenshot: true, 
        jsRendering: true, 
        priority: 'quality',
        reasoning: 'Social media: Screenshot + JS rendering gerekli'
      };
    }
    
    // Genel siteler
    return { 
      screenshot: false, 
      jsRendering: true, 
      priority: 'speed',
      reasoning: 'Genel website: Düzeltilmiş GET formatı ile standart işlem'
    };
  }

  // API durumu kontrolü
  getApiStatus(): {
    configured: boolean;
    keyPreview: string;
    baseUrl: string;
  } {
    return {
      configured: !!this.apiKey,
      keyPreview: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'Ayarlanmamış',
      baseUrl: this.baseUrl
    };
  }

  // Test bağlantısı (düzeltilmiş format)
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    console.log('\n🔧 [SCRAPE.DO] API bağlantısı test ediliyor (düzeltilmiş GET formatı)...');
    
    if (!this.apiKey) {
      return {
        success: false,
        message: 'API key yapılandırılmamış'
      };
    }

    try {
      // Basit test URL'si
      const testUrl = 'https://httpbin.org/html';
      const result = await this.scrapeUrl(testUrl, { screenshot: false, jsRendering: false });
      
      if (result.success && result.html.length > 100) {
        console.log('✅ [SCRAPE.DO] Bağlantı testi başarılı (düzeltilmiş GET formatı)');
        return {
          success: true,
          message: 'API bağlantısı başarılı (düzeltilmiş GET formatı)',
          details: {
            htmlLength: result.html.length,
            hasContent: result.html.includes('<html')
          }
        };
      } else {
        console.error('❌ [SCRAPE.DO] Bağlantı testi başarısız:', result.error);
        return {
          success: false,
          message: result.error || 'Bağlantı testi başarısız'
        };
      }
    } catch (error) {
      console.error('❌ [SCRAPE.DO] Bağlantı testi hatası:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }
}

// Scrape.do service instance
const scrapeDoService = new ScrapeDoService();

// Initialize OpenAI (mevcut kod aynı kalacak)
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

// Extracted recipe data interface (mevcut interface aynı kalacak)
export interface ExtractedRecipeData {
  title: string;
  description?: string;
  image_url?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  ingredients: Array<{ name: string; quantity?: string; unit?: string; notes?: string }>;
  instructions: Array<{ step: number; instruction: string; duration_mins?: number }>;
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

// Rate limiting (mevcut kod aynı kalacak)
const rateLimitStore = new Map<string, { count: number; lastRequest: number; dailyCount: number; dailyReset: number }>();

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

// JSON-LD extraction helper (mevcut kod aynı kalacak)
function extractJsonLdRecipe(html: string): Partial<ExtractedRecipeData> | null {
  try {
    const jsonLdMatch = html.match(/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/gis);
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

// Main extraction function - DÜZELTİLMİŞ SCRAPE.DO
export async function extractRecipeFromUrl(url: string, userId: string): Promise<ExtractedRecipeData | null> {
  try {
    console.log('\n🧪 [RECIPE] ===== "RECIME PLUS" DÜZELTİLMİŞ SCRAPE.DO TARİF ÇIKARIM BAŞLADI =====');
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

    console.log('✅ [RECIPE] OpenAI + Düzeltilmiş Scrape.do hazır, "Recime Plus" stratejisi başlıyor...');

    // 🚀 KATMAN 1: Optimal strateji belirleme
    const strategy = scrapeDoService.getOptimalStrategy(url);
    console.log('📋 [RECIPE] Düzeltilmiş Scrape.do stratejisi:', strategy);

    // 🚀 KATMAN 2: Düzeltilmiş Scrape.do ile içerik çekme
    console.log('🔍 [RECIPE] Düzeltilmiş Scrape.do (GET format) ile içerik çekiliyor...');
    const scrapedContent = await scrapeDoService.scrapeUrl(url, {
      screenshot: strategy.screenshot,
      jsRendering: strategy.jsRendering
    });

    if (!scrapedContent.success || !scrapedContent.html) {
      console.warn('⚠️ [RECIPE] Düzeltilmiş Scrape.do başarısız, fallback basit fetch...');
      
      // Fallback: Simple fetch
      try {
        const response = await fetch(url);
        const html = await response.text();
        scrapedContent.html = html;
        scrapedContent.success = true;
        console.log('✅ [RECIPE] Fallback fetch başarılı');
      } catch (fetchError) {
        throw new Error(`Failed to scrape content: ${scrapedContent.error || 'Unknown error'}`);
      }
    }

    console.log('📄 [RECIPE] Düzeltilmiş Scrape.do içerik alındı, uzunluk:', scrapedContent.html.length);

    // 🚀 KATMAN 3: JSON-LD kontrolü (öncelik)
    console.log('🔍 [RECIPE] JSON-LD kontrolü yapılıyor...');
    const jsonLdRecipe = extractJsonLdRecipe(scrapedContent.html);
    if (jsonLdRecipe && jsonLdRecipe.title && jsonLdRecipe.ingredients && jsonLdRecipe.ingredients.length > 0) {
      console.log('🎯 [RECIPE] JSON-LD bulundu! AI\'sız çıkarım (Düzeltilmiş Scrape.do ile)');
      console.log('📝 [RECIPE] Başlık:', jsonLdRecipe.title);
      console.log('🥘 [RECIPE] Malzeme sayısı:', jsonLdRecipe.ingredients.length);
      
      const result: ExtractedRecipeData = {
        ...jsonLdRecipe,
        is_ai_generated: false,
        ai_match_score: 98 // Düzeltilmiş Scrape.do + JSON-LD = en yüksek güven
      } as ExtractedRecipeData;
      
      console.log('✅ [RECIPE] Düzeltilmiş Scrape.do + JSON-LD çıkarımı tamamlandı!');
      console.log('🧪 [RECIPE] ===== "RECIME PLUS DÜZELTİLMİŞ SCRAPE.DO" BAŞARILI =====\n');
      
      return result;
    }

    // 🚀 KATMAN 4: AI analizi (JSON-LD bulunamazsa)
    console.log('🤖 [RECIPE] JSON-LD bulunamadı veya eksik, Düzeltilmiş Scrape.do + AI analizi başlatılıyor...');

    // Gelişmiş anti-halüsinasyon prompt
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
Düzeltilmiş Scrape.do ile çekildi (GET format)

HTML Content:
${scrapedContent.html.substring(0, 12000)}
`;

    console.log('📡 [RECIPE] OpenAI API çağrısı yapılıyor (Düzeltilmiş Scrape.do content)...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contentForAI }
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

    console.log('✅ [RECIPE] Düzeltilmiş Scrape.do + AI çıkarımı tamamlandı!');
    console.log('📝 [RECIPE] Başlık:', finalRecipe.title);
    console.log('🖼️ [RECIPE] Görsel:', finalRecipe.image_url ? 'Mevcut' : 'Yok');
    console.log('🧪 [RECIPE] ===== "RECIME PLUS DÜZELTİLMİŞ SCRAPE.DO" BAŞARILI =====\n');
    
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

export function getOpenAIStatus(): string {
  if (Platform.OS === 'web') {
    return 'Running in browser mode (development only)';
  } else {
    return 'Running in native mode';
  }
}
