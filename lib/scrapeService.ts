// lib/scrapeService.ts - YENİ DOSYA OLUŞTURUN
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
    try {
      if (!this.apiKey) {
        throw new Error('Scrape.do API key is not configured');
      }

      const requestBody = {
        url: url,
        render: options.jsRendering ? 'true' : 'false',
        screenshot: options.screenshot ? 'true' : 'false',
        format: 'json'
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Scrape.do API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        html: data.html || '',
        screenshot: data.screenshot || undefined,
        title: data.title || undefined,
        success: true
      };

    } catch (error) {
      console.error('Scrape.do error:', error);
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
  } {
    const domain = url.toLowerCase();
    
    // YouTube: JS rendering yeterli, screenshot gerekli değil
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      return { screenshot: false, jsRendering: true, priority: 'speed' };
    }
    
    // TikTok, Instagram: Hem JS hem screenshot gerekli
    if (domain.includes('tiktok.com') || domain.includes('instagram.com')) {
      return { screenshot: true, jsRendering: true, priority: 'quality' };
    }
    
    // Recipe blogs: Genellikle static content
    if (domain.includes('allrecipes.com') || domain.includes('food.com') || 
        domain.includes('foodnetwork.com') || domain.includes('tasty.co')) {
      return { screenshot: false, jsRendering: false, priority: 'speed' };
    }
    
    // Genel durumlar için orta yol
    return { screenshot: false, jsRendering: true, priority: 'speed' };
  }
}
