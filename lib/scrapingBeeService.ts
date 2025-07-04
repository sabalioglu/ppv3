// lib/scrapingBeeService.ts - YENİ DOSYA OLUŞTURUN
export interface ScrapingBeeResult {
  html: string;
  screenshot?: string;
  success: boolean;
  error?: string;
  cost?: number;
}

export class ScrapingBeeService {
  private apiKey: string;
  private baseUrl = 'https://app.scrapingbee.com/api/v1/';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_SCRAPINGBEE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ [SCRAPINGBEE] EXPO_PUBLIC_SCRAPINGBEE_API_KEY bulunamadı! .env dosyanızı kontrol edin.');
    } else {
      console.log('✅ [SCRAPINGBEE] Servis başarıyla başlatıldı.');
    }
  }

  async scrapeUrl(url: string, options: {
    screenshot?: boolean;
    jsRendering?: boolean;
    premium?: boolean;
  } = {}): Promise<ScrapingBeeResult> {
    console.log('\n🐝 [SCRAPINGBEE] ===== SCRAPING BAŞLADI =====');
    console.log('🌐 [SCRAPINGBEE] Hedef URL:', url);
    console.log('📋 [SCRAPINGBEE] İstenen seçenekler:', {
      screenshot: options.screenshot || false,
      jsRendering: options.jsRendering || false,
      premium: options.premium || false
    });
    
    const strategy = this.getOptimalStrategy(url);
    console.log('🎯 [SCRAPINGBEE] Optimal strateji:', strategy);
    
    try {
      if (!this.apiKey) {
        console.error('❌ [SCRAPINGBEE] API key yapılandırılmamış');
        throw new Error('ScrapingBee API key yapılandırılmamış');
      }

      // ScrapingBee API parametreleri
      const params = new URLSearchParams({
        api_key: this.apiKey,
        url: url,
        render_js: options.jsRendering ? 'true' : 'false',
        premium_proxy: options.premium ? 'true' : 'false',
        country_code: 'us'
      });

      // Screenshot parametresi (ayrı endpoint)
      const endpoint = options.screenshot ? 'screenshot' : '';
      const requestUrl = `${this.baseUrl}${endpoint}?${params.toString()}`;

      console.log('📤 [SCRAPINGBEE] İstek URL\'i hazırlandı');
      console.log('🔑 [SCRAPINGBEE] API Key mevcut:', this.apiKey.substring(0, 8) + '...');

      const startTime = Date.now();
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'AI-Food-Pantry/1.0'
        }
      });

      const endTime = Date.now();
      const requestDuration = (endTime - startTime) / 1000;
      
      console.log('📡 [SCRAPINGBEE] Yanıt durumu:', response.status);
      console.log('⏱️ [SCRAPINGBEE] İstek süresi:', requestDuration.toFixed(2) + 's');

      // ScrapingBee cost tracking
      const costHeader = response.headers.get('spb-cost');
      const remainingHeader = response.headers.get('spb-remaining');
      
      if (costHeader) {
        console.log('💰 [SCRAPINGBEE] İşlem maliyeti:', costHeader, 'credits');
      }
      if (remainingHeader) {
        console.log('🔋 [SCRAPINGBEE] Kalan kredi:', remainingHeader);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [SCRAPINGBEE] API Hata Detayları:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorText.substring(0, 500)
        });
        throw new Error(`ScrapingBee API hatası: ${response.status} ${response.statusText}`);
      }

      const htmlContent = await response.text();
      
      // 🔍 DEBUG: Yanıt analizi
      console.log('✅ [SCRAPINGBEE] Başarılı! Yanıt analizi:');
      console.log('📄 [SCRAPINGBEE] HTML uzunluğu:', htmlContent.length);
      
      if (htmlContent) {
        // HTML içeriğinin kalitesi hakkında bilgi
        const hasJsonLd = htmlContent.includes('application/ld+json');
        const hasOpenGraph = htmlContent.includes('og:');
        const hasImages = htmlContent.includes('<img');
        const hasRecipeSchema = htmlContent.includes('"@type":"Recipe"') || htmlContent.includes("'@type':'Recipe'");
        
        console.log('🔍 [SCRAPINGBEE] İçerik kalite analizi:');
        console.log('  📊 JSON-LD mevcut:', hasJsonLd);
        console.log('  🖼️ Open Graph meta:', hasOpenGraph);
        console.log('  📷 Görseller bulundu:', hasImages);
        console.log('  🍳 Recipe şeması:', hasRecipeSchema);
        
        // İlk 300 karakteri göster (debug için)
        const htmlPreview = htmlContent.substring(0, 300).replace(/\s+/g, ' ');
        console.log('👀 [SCRAPINGBEE] HTML önizleme:', htmlPreview + '...');
      }
      
      console.log('🐝 [SCRAPINGBEE] ===== SCRAPING TAMAMLANDI =====\n');
      
      return {
        html: htmlContent,
        screenshot: options.screenshot ? `data:image/png;base64,${htmlContent}` : undefined,
        success: true,
        cost: costHeader ? parseFloat(costHeader) : undefined
      };

    } catch (error) {
      console.error('\n❌ [SCRAPINGBEE] ===== SCRAPING BAŞARISIZ =====');
      console.error('💥 [SCRAPINGBEE] Hata detayları:', error);
      
      if (error instanceof Error) {
        console.error('🔍 [SCRAPINGBEE] Hata mesajı:', error.message);
      }
      
      // Hata türüne göre özel mesajlar
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 [SCRAPINGBEE] Ağ hatası tespit edildi - internet bağlantınızı kontrol edin');
      } else if (error instanceof Error && error.message.includes('API key')) {
        console.error('🔑 [SCRAPINGBEE] API key hatası - yapılandırmanızı kontrol edin');
      }
      
      console.error('❌ [SCRAPINGBEE] ===== SCRAPING BAŞARISIZ SON =====\n');
      
      return {
        html: '',
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  // Platform-specific optimization strategy
  getOptimalStrategy(url: string): {
    screenshot: boolean;
    jsRendering: boolean;
    premium: boolean;
    priority: 'speed' | 'quality';
    reasoning: string;
    estimatedCost: number;
  } {
    const domain = url.toLowerCase();
    
    // YouTube: JS rendering + premium proxy
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      return { 
        screenshot: false, 
        jsRendering: true, 
        premium: true,
        priority: 'quality',
        reasoning: 'YouTube: Premium proxy + JS rendering for video metadata',
        estimatedCost: 10 // credits
      };
    }
    
    // TikTok, Instagram: Full premium treatment
    if (domain.includes('tiktok.com') || domain.includes('instagram.com')) {
      return { 
        screenshot: true, 
        jsRendering: true, 
        premium: true,
        priority: 'quality',
        reasoning: 'Social media: Premium proxy + JS + screenshot for full content',
        estimatedCost: 25 // credits
      };
    }
    
    // AllRecipes ve recipe blogs: Standard scraping yeterli
    if (domain.includes('allrecipes.com') || domain.includes('food.com') || 
        domain.includes('foodnetwork.com') || domain.includes('tasty.co') ||
        domain.includes('seriouseats.com') || domain.includes('epicurious.com')) {
      return { 
        screenshot: false, 
        jsRendering: true, 
        premium: false,
        priority: 'speed',
        reasoning: 'Recipe blog: Standard scraping, likely has JSON-LD',
        estimatedCost: 5 // credits
      };
    }
    
    // Pinterest: Screenshot gerekli
    if (domain.includes('pinterest.com')) {
      return { 
        screenshot: true, 
        jsRendering: true, 
        premium: false,
        priority: 'quality',
        reasoning: 'Pinterest: Screenshot for visual content',
        estimatedCost: 15 // credits
      };
    }
    
    // Genel durumlar için orta yol
    return { 
      screenshot: false, 
      jsRendering: true, 
      premium: false,
      priority: 'speed',
      reasoning: 'General website: Standard JS rendering',
      estimatedCost: 5 // credits
    };
  }

  // 🔍 DEBUG: API durumu kontrolü
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

  // 🔍 DEBUG: Test bağlantısı
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    console.log('\n🔧 [SCRAPINGBEE] API bağlantısı test ediliyor...');
    
    if (!this.apiKey) {
      return {
        success: false,
        message: 'API key yapılandırılmamış'
      };
    }

    try {
      // Basit bir test URL'si ile bağlantı testi
      const testUrl = 'https://httpbin.org/html';
      const result = await this.scrapeUrl(testUrl, { screenshot: false, jsRendering: false });
      
      if (result.success) {
        console.log('✅ [SCRAPINGBEE] Bağlantı testi başarılı');
        return {
          success: true,
          message: 'API bağlantısı başarılı',
          details: {
            htmlLength: result.html.length,
            cost: result.cost
          }
        };
      } else {
        console.error('❌ [SCRAPINGBEE] Bağlantı testi başarısız:', result.error);
        return {
          success: false,
          message: result.error || 'Bağlantı testi başarısız'
        };
      }
    } catch (error) {
      console.error('❌ [SCRAPINGBEE] Bağlantı testi hatası:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }
}

// 🔍 DEBUG: Global debug fonksiyonları
export const debugScrapingBeeService = {
  // ScrapingBee servisinin durumunu kontrol et
  checkStatus: () => {
    const service = new ScrapingBeeService();
    const status = service.getApiStatus();
    
    console.log('\n🔍 [DEBUG] ScrapingBee Servis Durumu:');
    console.log('✅ Yapılandırılmış:', status.configured);
    console.log('🔑 API Key:', status.keyPreview);
    console.log('🌐 Base URL:', status.baseUrl);
    
    return status;
  },

  // Test bağlantısını kontrol et
  testConnection: async () => {
    const service = new ScrapingBeeService();
    return await service.testConnection();
  },

  // Belirli bir URL için optimal stratejiyi göster
  getStrategy: (url: string) => {
    const service = new ScrapingBeeService();
    const strategy = service.getOptimalStrategy(url);
    
    console.log('\n🎯 [DEBUG] ScrapingBee Optimal Strateji:', url);
    console.log('📸 Screenshot:', strategy.screenshot);
    console.log('🔄 JS Rendering:', strategy.jsRendering);
    console.log('💎 Premium Proxy:', strategy.premium);
    console.log('⚡ Öncelik:', strategy.priority);
    console.log('💰 Tahmini Maliyet:', strategy.estimatedCost, 'credits');
    console.log('💭 Açıklama:', strategy.reasoning);
    
    return strategy;
  }
};
