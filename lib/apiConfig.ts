// lib/apiConfig.ts
export const API_CONFIG = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  },
  
  googleVision: {
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY!,
    baseUrl: 'https://vision.googleapis.com/v1/images:annotate',
    features: {
      textDetection: 'TEXT_DETECTION',
      documentTextDetection: 'DOCUMENT_TEXT_DETECTION',
      labelDetection: 'LABEL_DETECTION',
      objectLocalization: 'OBJECT_LOCALIZATION',
    }
  },
  
  openAI: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY!,
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o'
  },
  
  rapidAPI: {
    apiKey: process.env.EXPO_PUBLIC_RAPIDAPI_KEY!,
    barcodeAPI: {
      host: 'barcodes-lookup.p.rapidapi.com',
      endpoint: '/v1/products'
    }
  }
};

// Universal API Client
export class APIClient {
  static async makeRequest(url: string, options: RequestInit) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  static async makeRapidAPIRequest(host: string, endpoint: string, params?: Record<string, string>) {
    const url = new URL(`https://${host}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return this.makeRequest(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_CONFIG.rapidAPI.apiKey,
        'X-RapidAPI-Host': host,
      },
    });
  }
}