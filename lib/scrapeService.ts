// lib/scrapeService.ts - DEBUG LOGGING İLE TAM KOD
export interface ScrapedContent {
  html: string;
  screenshot?: string;
  title?: string;
  success: boolean;
  error?: string;
}

export class ScrapeDoService {
  private apiKey: string;
  private baseUrl = 'https://api.scrape.do';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_SCRAPE_DO_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ SCRAPE_DO_API_KEY is not set');
    }
  }

  async scrapeUrl(url: string, options: {
    screenshot?: boolean;
    jsRendering?: boolean;
  } = {}): Promise<ScrapedContent> {
    // 🔍 DEBUG: Başlangıç logu
    console.log('\n🔍 [SCRAPE.DO] ===== SCRAPING STARTED =====');
    console.log('🌐 [SCRAPE.DO] Target URL:', url);
    console.log('📋 [SCRAPE.DO] Options:', {
      screenshot: options.screenshot || false,
      jsRendering: options.jsRendering || false
    });
    
    const strategy = this.getOptimalStrategy(url);
    console.log('🎯 [SCRAPE.DO] Optimal Strategy:', strategy);
    
    try {
      if (!this.apiKey) {
        console.error('❌ [SCRAPE.DO] API key is not configured');
        throw new Error('Scrape.do API key is not configured');
      }

      const requestBody = {
        url: url,
        render: options.jsRendering ? 'true' : 'false',
        screenshot: options.screenshot ? 'true' : 'false',
        format: 'json'
      };

      console.log('📤 [SCRAPE.DO] Request body:', requestBody);
      console.log('🔑 [SCRAPE.DO] API Key present:', this.apiKey.substring(0, 8) + '...');

      const startTime = Date.now();
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      const endTime = Date.now();
      const requestDuration = (endTime - startTime) / 1000;
      
      console.log('📡 [SCRAPE.DO] Response status:', response.status);
      console.log('⏱️ [SCRAPE.DO] Request duration:', requestDuration.toFixed(2) + 's');

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [SCRAPE.DO] API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorText
        });
        throw new Error(`Scrape.do API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // 🔍 DEBUG: Response analizi
      console.log('✅ [SCRAPE.DO] Success! Response analysis:');
      console.log('📄 [SCRAPE.DO] HTML length:', data.html?.length || 0);
      console.log('📸 [SCRAPE.DO] Screenshot available:', !!data.screenshot);
      console.log('🏷️ [SCRAPE.DO] Page title:', data.title || 'Not available');
      
      if (data.html) {
        // HTML içeriğinin kalitesi hakkında bilgi
        const hasJsonLd = data.html.includes('application/ld+json');
        const hasOpenGraph = data.html.includes('og:');
        const hasImages = data.html.includes('<img');
        
        console.log('🔍 [SCRAPE.DO] Content quality analysis:');
        console.log('  📊 JSON-LD present:', hasJsonLd);
        console.log('  🖼️ Open Graph meta:', hasOpenGraph);
        console.log('  📷 Images found:', hasImages);
        
        // İlk 500 karakteri göster (debug için)
        const htmlPreview = data.html.substring(0, 500).replace(/\s+/g, ' ');
        console.log('👀 [SCRAPE.DO] HTML preview:', htmlPreview + '...');
      }
      
      console.log('🔍 [SCRAPE.DO] ===== SCRAPING COMPLETED =====\n');
      
      return {
        html: data.html || '',
        screenshot: data.screenshot || undefined,
        title: data.title || undefined,
        success: true
      };

    } catch (error) {
      console.error('\n❌ [SCRAPE.DO] ===== SCRAPING FAILED =====');
      console.error('💥 [SCRAPE.DO] Error details:', error);
      
      if (error instanceof Error) {
        console.error('🔍 [SCRAPE.DO] Error message:', error.message);
        console.error('📚 [SCRAPE.DO] Error stack:', error.stack);
      }
      
      // Hata türüne göre özel mesajlar
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 [SCRAPE.DO] Network error detected - check internet connection');
      } else if (error instanceof Error && error.message.includes('API key')) {
        console.error('🔑 [SCRAPE.DO] API key error - check configuration');
      }
      
      console.error('❌ [SCRAPE.DO] ===== SCRAPING FAILED END =====\n');
      
      return {
        html: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Platform-specific optimization strategy
  getOptimalStrategy(url: string): {
    screenshot: boolean;
    jsRendering: boolean;
    priority: 'speed' | 'quality';
    reasoning: string;
  } {
    const domain = url.toLowerCase();
    
    // YouTube: JS rendering yeterli, screenshot gerekli değil
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      return { 
        screenshot: false, 
        jsRendering: true, 
        priority: 'speed',
        reasoning: 'YouTube: JS rendering for video metadata, no screenshot needed'
      };
    }
    
    // TikTok, Instagram: Hem JS hem screenshot gerekli
    if (domain.includes('tiktok.com') || domain.includes('instagram.com')) {
      return { 
        screenshot: true, 
        jsRendering: true, 
        priority: 'quality',
        reasoning: 'Social media: Both JS and screenshot needed for full content'
      };
    }
    
    // Recipe blogs: Genellikle static content, JSON-LD olasılığı yüksek
    if (domain.includes('allrecipes.com') || domain.includes('food.com') || 
        domain.includes('foodnetwork.com') || domain.includes('tasty.co') ||
        domain.includes('seriouseats.com') || domain.includes('epicurious.com')) {
      return { 
        screenshot: false, 
        jsRendering: false, 
        priority: 'speed',
        reasoning: 'Recipe blog: Likely has JSON-LD, static content sufficient'
      };
    }
    
    // Pinterest: Görsel odaklı, screenshot gerekli
    if (domain.includes('pinterest.com')) {
      return { 
        screenshot: true, 
        jsRendering: true, 
        priority: 'quality',
        reasoning: 'Pinterest: Visual content, screenshot essential'
      };
    }
    
    // Genel durumlar için orta yol
    return { 
      screenshot: false, 
      jsRendering: true, 
      priority: 'speed',
      reasoning: 'General website: JS rendering for dynamic content, no screenshot to save cost'
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
      keyPreview: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'Not set',
      baseUrl: this.baseUrl
    };
  }

  // 🔍 DEBUG: Test bağlantısı
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    console.log('\n🔧 [SCRAPE.DO] Testing API connection...');
    
    if (!this.apiKey) {
      return {
        success: false,
        message: 'API key not configured'
      };
    }

    try {
      // Basit bir test URL'si ile bağlantı testi
      const testUrl = 'https://httpbin.org/html';
      const result = await this.scrapeUrl(testUrl, { screenshot: false, jsRendering: false });
      
      if (result.success) {
        console.log('✅ [SCRAPE.DO] Connection test successful');
        return {
          success: true,
          message: 'API connection successful',
          details: {
            htmlLength: result.html.length,
            title: result.title
          }
        };
      } else {
        console.error('❌ [SCRAPE.DO] Connection test failed:', result.error);
        return {
          success: false,
          message: result.error || 'Connection test failed'
        };
      }
    } catch (error) {
      console.error('❌ [SCRAPE.DO] Connection test error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// 🔍 DEBUG: Global debug fonksiyonları
export const debugScrapeService = {
  // Scrape.do servisinin durumunu kontrol et
  checkStatus: () => {
    const service = new ScrapeDoService();
    const status = service.getApiStatus();
    
    console.log('\n🔍 [DEBUG] Scrape.do Service Status:');
    console.log('✅ Configured:', status.configured);
    console.log('🔑 API Key:', status.keyPreview);
    console.log('🌐 Base URL:', status.baseUrl);
    
    return status;
  },

  // Test bağlantısını kontrol et
  testConnection: async () => {
    const service = new ScrapeDoService();
    return await service.testConnection();
  },

  // Belirli bir URL için optimal stratejiyi göster
  getStrategy: (url: string) => {
    const service = new ScrapeDoService();
    const strategy = service.getOptimalStrategy(url);
    
    console.log('\n🎯 [DEBUG] Optimal Strategy for:', url);
    console.log('📸 Screenshot:', strategy.screenshot);
    console.log('🔄 JS Rendering:', strategy.jsRendering);
    console.log('⚡ Priority:', strategy.priority);
    console.log('💭 Reasoning:', strategy.reasoning);
    
    return strategy;
  }
};
