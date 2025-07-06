/**
 * ScrapingBee Service for AI Food Pantry
 * Implements "Recime Plus" universal content acquisition strategy
 * Enhanced version with comprehensive testing and debugging capabilities
 */

export interface ScrapingResult {
  html: string;
  screenshot?: string;
  url: string;
  success: boolean;
  error?: string;
  metadata?: {
    title?: string;
    description?: string;
    structuredData?: any[];
  };
  executionTime?: number;
  creditsUsed?: number;
  platform?: string;
  statusCode?: number;
}

export interface ScrapingOptions {
  renderJs?: boolean;
  screenshot?: boolean;
  screenshotFullPage?: boolean;
  waitFor?: number;
  customHeaders?: Record<string, string>;
  premium_proxy?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  creditsRemaining?: number;
  error?: string;
}

export interface ApiStatus {
  configured: boolean;
  keyPreview: string;
  lastTestTime?: Date;
  lastTestResult?: boolean;
}

class ScrapingBeeService {
  private apiKey: string;
  private baseUrl = 'https://app.scrapingbee.com/api/v1';
  private lastTestTime?: Date;
  private lastTestResult?: boolean;

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_SCRAPINGBEE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ ScrapingBee API key not found. Please add EXPO_PUBLIC_SCRAPINGBEE_API_KEY to your .env file');
    }
  }

  /**
   * Check API status and configuration
   */
  checkStatus(): ApiStatus {
    return {
      configured: !!this.apiKey,
      keyPreview: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'Yapılandırılmamış',
      lastTestTime: this.lastTestTime,
      lastTestResult: this.lastTestResult
    };
  }

  /**
   * Test ScrapingBee connection and API key validity
   */
  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.apiKey) {
      return {
        success: false,
        message: 'ScrapingBee API key yapılandırılmamış. .env dosyasını kontrol edin.'
      };
    }

    const startTime = Date.now();

    try {
      console.log('🔧 [SCRAPINGBEE] Bağlantı testi başlatılıyor...');
      
      // Simple test with a lightweight request
      const testUrl = 'https://httpbin.org/html';
      const params = new URLSearchParams({
        api_key: this.apiKey,
        url: testUrl,
        render_js: 'false',
        premium_proxy: 'false'
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET'
      });

      const responseTime = Date.now() - startTime;
      this.lastTestTime = new Date();

      if (!response.ok) {
        this.lastTestResult = false;
        
        if (response.status === 401) {
          return {
            success: false,
            message: 'API key geçersiz. ScrapingBee hesabınızı kontrol edin.',
            responseTime,
            error: 'Unauthorized'
          };
        } else if (response.status === 429) {
          return {
            success: false,
            message: 'API limit aşıldı. Daha sonra tekrar deneyin.',
            responseTime,
            error: 'Rate limit exceeded'
          };
        } else {
          return {
            success: false,
            message: `API hatası: ${response.status} - ${response.statusText}`,
            responseTime,
            error: response.statusText
          };
        }
      }

      const html = await response.text();
      this.lastTestResult = true;

      // Try to extract credits info from response headers
      const creditsRemaining = response.headers.get('spb-credits-remaining');

      console.log('✅ [SCRAPINGBEE] Bağlantı testi başarılı!');
      console.log('📊 [SCRAPINGBEE] Yanıt süresi:', responseTime + 'ms');
      console.log('💳 [SCRAPINGBEE] Kalan kredi:', creditsRemaining || 'Bilinmiyor');

      return {
        success: true,
        message: `Bağlantı başarılı! Yanıt süresi: ${responseTime}ms${creditsRemaining ? `, Kalan kredi: ${creditsRemaining}` : ''}`,
        responseTime,
        creditsRemaining: creditsRemaining ? parseInt(creditsRemaining) : undefined
      };

    } catch (error) {
      this.lastTestResult = false;
      const responseTime = Date.now() - startTime;
      
      console.error('❌ [SCRAPINGBEE] Bağlantı testi hatası:', error);
      
      return {
        success: false,
        message: `Bağlantı hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        responseTime,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Universal content scraping with intelligent strategy selection
   * Implements "Recime Plus" layered processing approach
   */
  async scrapeUrl(url: string, options: ScrapingOptions = {}): Promise<ScrapingResult> {
    if (!this.apiKey) {
      return {
        html: '',
        url,
        success: false,
        error: 'ScrapingBee API key not configured'
      };
    }

    const startTime = Date.now();
    const platform = this.detectPlatform(url);

    try {
      console.log(`🔍 [SCRAPINGBEE] Scraping başlatılıyor: ${url}`);
      console.log(`📱 [SCRAPINGBEE] Platform: ${platform}`);

      // Step 1: Quick check for structured data (low cost)
      const quickResult = await this.performQuickScrape(url);
      
      if (quickResult.metadata?.structuredData?.length) {
        console.log('✅ [SCRAPINGBEE] Structured data bulundu, düşük maliyetli çıkarım kullanılıyor');
        return {
          ...quickResult,
          executionTime: (Date.now() - startTime) / 1000,
          platform
        };
      }

      // Step 2: Full scraping with platform-specific optimization
      console.log('🔄 [SCRAPINGBEE] Structured data bulunamadı, tam scraping yapılıyor');
      const fullResult = await this.performFullScrape(url, options);
      
      return {
        ...fullResult,
        executionTime: (Date.now() - startTime) / 1000,
        platform
      };
      
    } catch (error) {
      console.error('❌ [SCRAPINGBEE] Scraping hatası:', error);
      return {
        html: '',
        url,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error',
        executionTime: (Date.now() - startTime) / 1000,
        platform
      };
    }
  }

  /**
   * Detect platform from URL for optimized scraping
   */
  private detectPlatform(url: string): string {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'YouTube';
      if (domain.includes('tiktok.com')) return 'TikTok';
      if (domain.includes('instagram.com')) return 'Instagram';
      if (domain.includes('facebook.com') || domain.includes('fb.com')) return 'Facebook';
      if (domain.includes('pinterest.com')) return 'Pinterest';
      if (domain.includes('allrecipes.com')) return 'AllRecipes';
      if (domain.includes('food.com')) return 'Food.com';
      if (domain.includes('epicurious.com')) return 'Epicurious';
      if (domain.includes('foodnetwork.com')) return 'Food Network';
      
      return 'General Web';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Quick scrape for structured data detection (1 credit)
   */
  private async performQuickScrape(url: string): Promise<ScrapingResult> {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      url: url
    });

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`ScrapingBee API error: ${response.status} - ${response.statusText}`);
    }

    const html = await response.text();
    const metadata = this.extractMetadata(html);
    const creditsUsed = response.headers.get('spb-credits-used');

    return {
      html,
      url,
      success: true,
      metadata,
      creditsUsed: creditsUsed ? parseInt(creditsUsed) : 1,
      statusCode: response.status
    };
  }

  /**
   * Full scraping with platform-specific optimization
   */
  private async performFullScrape(url: string, options: ScrapingOptions): Promise<ScrapingResult> {
    const platformConfig = this.getPlatformConfig(url);
    const mergedOptions = { ...platformConfig, ...options };

    console.log('⚙️ [SCRAPINGBEE] Platform config:', mergedOptions);

    const params = new URLSearchParams({
      api_key: this.apiKey,
      url: url,
      render_js: mergedOptions.renderJs ? 'true' : 'false',
      screenshot: mergedOptions.screenshot ? 'true' : 'false',
      screenshot_full_page: mergedOptions.screenshotFullPage ? 'true' : 'false',
      premium_proxy: mergedOptions.premium_proxy ? 'true' : 'false'
    });

    // Add wait time if specified
    if (mergedOptions.waitFor) {
      params.append('wait_for', mergedOptions.waitFor.toString());
    }

    const response = await fetch(`${this.baseUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`ScrapingBee API error: ${response.status} - ${response.statusText}`);
    }

    let html = '';
    let screenshot: string | undefined;
    const creditsUsed = response.headers.get('spb-credits-used');

    if (mergedOptions.screenshot) {
      // When screenshot is requested, response is JSON
      const jsonResponse = await response.json();
      html = jsonResponse.html || '';
      screenshot = jsonResponse.screenshot_url;
    } else {
      // When no screenshot, response is plain HTML
      html = await response.text();
    }

    const metadata = this.extractMetadata(html);

    console.log('📊 [SCRAPINGBEE] Scraping tamamlandı:', {
      htmlLength: html.length,
      hasScreenshot: !!screenshot,
      creditsUsed: creditsUsed || 'Bilinmiyor',
      hasStructuredData: !!metadata.structuredData?.length
    });

    return {
      html,
      screenshot,
      url,
      success: true,
      metadata,
      creditsUsed: creditsUsed ? parseInt(creditsUsed) : undefined,
      statusCode: response.status
    };
  }

  /**
   * Platform-specific configuration for optimal scraping
   */
  private getPlatformConfig(url: string): ScrapingOptions {
    const domain = new URL(url).hostname.toLowerCase();

    // YouTube configuration
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      return {
        renderJs: true,
        waitFor: 3000,
        premium_proxy: true
      };
    }

    // TikTok configuration - requires screenshot for full context
    if (domain.includes('tiktok.com')) {
      return {
        renderJs: true,
        screenshot: true,
        screenshotFullPage: true,
        waitFor: 5000,
        premium_proxy: true
      };
    }

    // Instagram configuration
    if (domain.includes('instagram.com')) {
      return {
        renderJs: true,
        waitFor: 3000,
        premium_proxy: true
      };
    }

    // Facebook configuration
    if (domain.includes('facebook.com') || domain.includes('fb.com')) {
      return {
        renderJs: true,
        waitFor: 4000,
        premium_proxy: true
      };
    }

    // Pinterest configuration
    if (domain.includes('pinterest.com')) {
      return {
        renderJs: true,
        waitFor: 2000,
        premium_proxy: false
      };
    }

    // Recipe websites (AllRecipes, Food.com, etc.)
    if (domain.includes('allrecipes.com') || 
        domain.includes('food.com') || 
        domain.includes('epicurious.com') ||
        domain.includes('foodnetwork.com')) {
      return {
        renderJs: false, // These usually have good structured data
        waitFor: 1000,
        premium_proxy: false
      };
    }

    // Default configuration for general sites
    return {
      renderJs: false, // Keep cost low for general sites
      waitFor: 1000,
      premium_proxy: false
    };
  }

  /**
   * Enhanced error handling with platform-specific messages
   */
  private handleScrapingError(error: any, url: string): string {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      if (error.message?.includes('400')) {
        return 'Invalid request parameters. Please try a different URL.';
      } else if (error.message?.includes('401')) {
        return 'ScrapingBee API key is invalid. Please check your configuration.';
      } else if (error.message?.includes('403') || error.message?.includes('blocked')) {
        if (domain.includes('tiktok.com')) {
          return 'TikTok blocks automated access. Please copy-paste the recipe manually.';
        } else if (domain.includes('instagram.com')) {
          return 'Instagram blocks automated access. Please copy-paste the recipe manually.';
        } else {
          return 'Website blocks automated access. Please try a different URL.';
        }
      } else if (error.message?.includes('CORS')) {
        return 'Cross-origin request blocked. This is a browser limitation.';
      } else {
        return 'Could not access the webpage. Please check the URL and try again.';
      }
    } catch {
      return 'Could not access the webpage. Please check the URL and try again.';
    }
  }

  /**
   * Extract metadata from HTML for structured data detection
   */
  private extractMetadata(html: string): ScrapingResult['metadata'] {
    const metadata: ScrapingResult['metadata'] = {};

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract description
    const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }

    // Extract structured data (JSON-LD)
    const jsonLdMatches = html.match(/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      try {
        const structuredData = jsonLdMatches.map(match => {
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          return JSON.parse(jsonContent);
        });
        metadata.structuredData = structuredData;
      } catch (error) {
        console.warn('⚠️ [SCRAPINGBEE] Structured data parse hatası:', error);
      }
    }
    return metadata;
  }

  /**
   * Debug function for comprehensive testing
   */
  async debugScrape(url: string): Promise<ScrapingResult> {
    console.log(`\n🔍 [SCRAPINGBEE] Debug scraping başlatılıyor: ${url}`);
    
    const result = await this.scrapeUrl(url, {
      renderJs: true,
      screenshot: false // Disable screenshot for debug to save credits
    });

    console.log('\n📊 [SCRAPINGBEE] Debug sonuçları:', {
      success: result.success,
      htmlLength: result.html.length,
      platform: result.platform,
      executionTime: result.executionTime,
      creditsUsed: result.creditsUsed,
      error: result.error
    });

    if (result.metadata?.title) {
      console.log('📝 [SCRAPINGBEE] Başlık:', result.metadata.title);
    }

    if (result.metadata?.structuredData) {
      console.log('🏗️ [SCRAPINGBEE] Structured Data:', result.metadata.structuredData.length, 'öğe bulundu');
    }

    return result;
  }
}

// Export singleton instance
export const scrapingBeeService = new ScrapingBeeService();

// Export functions for compatibility with existing code
export const debugScrapeService = {
  checkStatus: () => scrapingBeeService.checkStatus(),
  testConnection: () => scrapingBeeService.testConnection(),
  debugScrape: (url: string) => scrapingBeeService.debugScrape(url)
};

export const scrapeUrl = async (url: string, options?: ScrapingOptions): Promise<ScrapingResult> => {
  return scrapingBeeService.scrapeUrl(url, options);
};
