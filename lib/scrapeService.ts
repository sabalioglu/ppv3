// lib/recipeAIService.ts - DÜZELTİLMİŞ SCRAPE.DO FORMAT - TAM KOD
import { Platform } from 'react-native';

// Platform-aware OpenAI import
let openai: any = null;

// Düzeltilmiş Scrape.do Service Class (Format parametresi kaldırıldı)
class ScrapeDoService {
  private apiKey: string;
  private baseUrl = 'https://api.scrape.do';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_SCRAPE_DO_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ [SCRAPE.DO] API key bulunamadı!');
    } else {
      console.log('✅ [SCRAPE.DO] Servis başlatıldı (format düzeltmesi ile).');
    }
  }

  async scrapeUrl(url: string, options: {
    screenshot?: boolean;
    jsRendering?: boolean;
  } = {}): Promise<{
    html: string;
    screenshot?: string;
    title?: string;
    success: boolean;
    error?: string;
  }> {
    console.log('\n🔍 [SCRAPE.DO] ===== SCRAPING BAŞLADI (DÜZELTİLMİŞ FORMAT) =====');
    console.log('🌐 [SCRAPE.DO] Hedef URL:', url);
    console.log('📋 [SCRAPE.DO] Seçenekler:', options);
    
    try {
      if (!this.apiKey) {
        throw new Error('Scrape.do API key yapılandırılmamış');
      }

      // ✅ DÜZELTİLMİŞ URL ENCODING - URLSearchParams kullanarak
      const params = new URLSearchParams();
      params.append('token', this.apiKey);
      params.append('url', url); // URLSearchParams otomatik encode eder
      params.append('super', 'true');
      params.append('customheaders', 'false');

      // Opsiyonel parametreler
      if (options.jsRendering) {
        params.append('render', 'true');
      }
      if (options.screenshot) {
        params.append('screenshot', 'true');
      }

      // ❌ 'format' parametresi tamamen kaldırıldı - bu 400 hatasının nedeni

      const requestUrl = `${this.baseUrl}/?${params.toString()}`;

      console.log('📤 [SCRAPE.DO] Düzeltilmiş GET isteği hazırlandı');
      console.log('🌐 [SCRAPE.DO] Request URL (token gizli):', requestUrl.replace(this.apiKey, 'TOKEN_HIDDEN'));
      console.log('🔑 [SCRAPE.DO] Token query parametresi kullanılıyor:', this.apiKey.substring(0, 8) + '...');

      const startTime = Date.now();
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'AI-Food-Pantry-RecimePlus/1.0'
        }
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log('📡 [SCRAPE.DO] Yanıt durumu:', response.status);
      console.log('⏱️ [SCRAPE.DO] İstek süresi:', duration.toFixed(2) + 's');

      // Response headers debug
      const headers = {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        server: response.headers.get('server')
      };
      console.log('📋 [SCRAPE.DO] Response headers:', headers);

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
        } else if (response.status === 429) {
          console.error('⏱️ [SCRAPE.DO] 429 Rate Limit: Çok fazla istek, bekleyin');
        }
        
        // Debug URL'i (desteğe gönderilebilir)
        const debugUrl = requestUrl.replace(this.apiKey, 'YOUR_TOKEN');
        console.error('🔗 [SCRAPE.DO] Debug URL (desteğe gönderin):', debugUrl);
        
        throw new Error(`Scrape.do API hatası: ${response.status} ${response.statusText}`);
      }

      // Response'u parse etme
      const contentType = response.headers.get('content-type') || '';
      let responseData: any;

      if (contentType.includes('application/json')) {
        console.log('📊 [SCRAPE.DO] JSON response alındı');
        responseData = await response.json();
      } else {
        console.log('📄 [SCRAPE.DO] HTML response alındı');
        const htmlContent = await response.text();
        responseData = { html: htmlContent };
      }

      const htmlContent = responseData.html || responseData;
      
      console.log('✅ [SCRAPE.DO] Başarılı! HTML uzunluğu:', htmlContent.length);
      
      // İçerik kalite kontrolü
      if (htmlContent.length > 1000) {
        const hasJsonLd = htmlContent.includes('application/ld+json');
        const hasRecipeSchema = htmlContent.includes('"@type":"Recipe"') || htmlContent.includes("'@type':'Recipe'");
        const hasOpenGraph = htmlContent.includes('og:');
        const hasImages = htmlContent.includes('<img');
        
        console.log('🔍 [SCRAPE.DO] İçerik kalite analizi:');
        console.log('  📊 JSON-LD mevcut:', hasJsonLd);
        console.log('  🍳 Recipe şeması:', hasRecipeSchema);
        console.log('  🖼️ Open Graph meta:', hasOpenGraph);
        console.log('  📷 Görseller bulundu:', hasImages);
        
        // HTML önizleme (debug için)
        const htmlPreview = htmlContent.substring(0, 300).replace(/\s+/g, ' ');
        console.log('👀 [SCRAPE.DO] HTML önizleme:', htmlPreview + '...');
      }
      
      console.log('🔍 [SCRAPE.DO] ===== SCRAPING TAMAMLANDI =====\n');
      
      return {
        html: htmlContent,
        screenshot: responseData.screenshot,
        title: responseData.title || this.extractTitleFromHtml(htmlContent),
        success: true
      };

    } catch (error) {
      console.error('\n❌ [SCRAPE.DO] ===== SCRAPING BAŞARISIZ =====');
      console.error('💥 [SCRAPE.DO] Hata detayları:', error);
      
      if (error instanceof Error) {
        console.error('🔍 [SCRAPE.DO] Hata mesajı:', error.message);
        
        // Hata türüne göre özel çözüm önerileri
        if (error.message.includes('400')) {
          console.error('💡 [SCRAPE.DO] 400 Hatası Çözüm Önerileri:');
          console.error('   1. Scrape.do dashboard\'da plan durumunu kontrol edin');
          console.error('   2. API token\'ın geçerli olduğunu doğrulayın');
          console.error('   3. URL\'nin doğru encode edildiğini kontrol edin');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          console.error('🌐 [SCRAPE.DO] Ağ hatası tespit edildi - internet bağlantınızı kontrol edin');
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

  // HTML'den title çıkarma yardımcı fonksiyonu
  private extractTitleFromHtml(html: string): string | undefined {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : undefined;
  }

  getOptimalStrategy(url: string): {
    screenshot: boolean;
    jsRendering: boolean;
    priority: 'speed' | 'quality';
    reasoning: string;
  } {
    const domain = url.toLowerCase();
    
    // Recipe blogs: Genellikle static content, JSON-LD olasılığı yüksek
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
    
    // YouTube: JS rendering yeterli, screenshot video thumbnail için
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      return { 
        screenshot: true, 
        jsRendering: true, 
        priority: 'quality',
        reasoning: 'YouTube: Video metadata için JS rendering, thumbnail için screenshot'
      };
    }
    
    // TikTok, Instagram: Hem JS hem screenshot gerekli
    if (domain.includes('tiktok.com') || domain.includes('instagram.com')) {
      return { 
        screenshot: true, 
        jsRendering: true, 
        priority: 'quality',
        reasoning: 'Sosyal medya: Tam içerik için hem JS hem screenshot gerekli'
      };
    }
    
    // Pinterest: Görsel odaklı
    if (domain.includes('pinterest.com')) {
      return { 
        screenshot: true, 
        jsRendering: true, 
        priority: 'quality',
        reasoning: 'Pinterest: Görsel içerik, screenshot önemli'
      };
    }
    
    // Genel durumlar için orta yol
    return { 
      screenshot: false, 
      jsRendering: true, 
      priority: 'speed',
      reasoning: 'Genel website: Dinamik içerik için JS rendering, maliyet için screenshot yok'
    };
  }

  // Test bağlantısı
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    console.log('\n🔧 [SCRAPE.DO] API bağlantısı test ediliyor (düzeltilmiş format)...');
    
    if (!this.apiKey) {
      return { success: false, message: 'API key yapılandırılmamış' };
    }

    try {
      const testUrl = 'https://httpbin.org/html';
      const result = await this.scrapeUrl(testUrl, { screenshot: false, jsRendering: false });
      
      if (result.success) {
        console.log('✅ [SCRAPE.DO] Bağlantı testi başarılı');
        return {
          success: true,
          message: 'API bağlantısı başarılı (düzeltilmiş format)',
          details: {
            htmlLength: result.html.length,
            title: result.title
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
}

// Scrape.do service instance
const scrapeDoService = new ScrapeDoService();

// Initialize OpenAI
const initializeOpenAI = async () => {
  console.log('\n🔄 [OPENAI] ===== OpenAI CLIENT BAŞLATILIYOR =====');
  console.log('📱 [OPENAI] Platform:', Platform.OS);
  
  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  console.log('🔍 [OPENAI] Environment Variables Debug:');
  console.log('  - EXPO_PUBLIC_OPENAI_API_KEY:', process.env.EXPO_PUBLIC_OPENAI_API_KEY ? 'MEVCUT' : 'YOK');
  console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'MEVCUT' : 'YOK');
  console.log('  - Final Key:', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 8) + '...' : 'BULUNAMADI');

  if (!OPENAI_API_KEY) {
    console.error("❌ [OPENAI] API KEY BULUNAMADI!");
    console.error("💡 [OPENAI] Çözüm adımları:");
    console.error("   1. .env dosyasında EXPO_PUBLIC_OPENAI_API_KEY=sk-... var mı?");
    console.error("   2. Metro'yu yeniden başlattınız mı: npx expo start --clear");
    console.error("   3. Dosya proje kökünde mi?");
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
      
      // Test API call ile doğrulama
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
    
    if (error instanceof Error) {
      console.error('💥 [OPENAI] Hata detayı:', error.message);
      
      if (error.message.includes('API key')) {
        console.error('🔑 [OPENAI] API key problemi - OpenAI dashboard kontrol edin');
      } else if (error.message.includes('billing') || error.message.includes('quota')) {
        console.error('💳 [OPENAI] Billing/quota hatası - hesabınızda kredi var mı?');
      } else if (error.message.includes('import') || error.message.includes('modül')) {
        console.error('📦 [OPENAI] Import hatası - OpenAI paketi kurulu mu?');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        console.error('🌐 [OPENAI] Network hatası - internet bağlantınızı kontrol edin');
      }
    }
    
    return null;
  }
};

// Extracted recipe data interface
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

// Rate limiting storage
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

// JSON-LD extraction helper
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

// Main extraction function - DÜZELTİLMİŞ SCRAPE.DO FORMAT
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
    console.log('🔍 [RECIPE] Düzeltilmiş Scrape.do (format düzeltmesi) ile içerik çekiliyor...');
    const scrapedContent = await scrapeDoService.scrapeUrl(url, {
      screenshot: strategy.screenshot,
      jsRendering: strategy.jsRendering
    });

    if (!scrapedContent.success || !scrapedContent.html) {
      console.warn('⚠️ [RECIPE] Düzeltilmiş Scrape.do başarısız, fallback basit fetch...');
      
      // Fallback: Simple fetch (CORS riski)
      try {
        const response = await fetch(url, {
          mode: 'cors',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AI-Food-Pantry/1.0)'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
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
Page Title: ${scrapedContent.title || 'Not available'}
${scrapedContent.screenshot ? `Screenshot URL: ${scrapedContent.screenshot}` : ''}

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

// Debug fonksiyonları
export const debugScrapeService = {
  checkStatus: () => {
    const status = scrapeDoService.getApiStatus();
    
    console.log('\n🔍 [DEBUG] Düzeltilmiş Scrape.do Servis Durumu:');
    console.log('✅ Yapılandırılmış:', status.configured);
    console.log('🔑 API Key:', status.keyPreview);
    console.log('🌐 Base URL:', status.baseUrl);
    console.log('🛠️ Format düzeltmesi: format parametresi kaldırıldı');
    
    return status;
  },

  testConnection: async () => {
    return await scrapeDoService.testConnection();
  },

  getStrategy: (url: string) => {
    const strategy = scrapeDoService.getOptimalStrategy(url);
    
    console.log('\n🎯 [DEBUG] Düzeltilmiş Scrape.do Optimal Strateji:', url);
    console.log('📸 Screenshot:', strategy.screenshot);
    console.log('🔄 JS Rendering:', strategy.jsRendering);
    console.log('⚡ Öncelik:', strategy.priority);
    console.log('💭 Açıklama:', strategy.reasoning);
    
    return strategy;
  }
};

export function getOpenAIStatus(): string {
  if (Platform.OS === 'web') {
    return 'Running in browser mode (development only)';
  } else {
    return 'Running in native mode';
  }
}
