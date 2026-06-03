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
    },
  },

  openAI: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY!,
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
  },
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
}
