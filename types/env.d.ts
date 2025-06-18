declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Supabase Configuration
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;

      // AI Services
      EXPO_PUBLIC_OPENAI_API_KEY: string;
      EXPO_PUBLIC_GOOGLE_VISION_API_KEY: string;

      // External APIs
      EXPO_PUBLIC_RAPIDAPI_KEY: string;
      
      // OAuth
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
    }
  }
}

// Ensure this file is treated as a module
export {};