declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Firebase Configuration
      EXPO_PUBLIC_FIREBASE_API_KEY: string;
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
      EXPO_PUBLIC_FIREBASE_APP_ID: string;
      EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: string;

      // Supabase Configuration
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;

      // AI Services
      EXPO_PUBLIC_OPENAI_API_KEY: string;
      EXPO_PUBLIC_GOOGLE_VISION_API_KEY: string;

      // External APIs
      EXPO_PUBLIC_RAPIDAPI_KEY: string;
    }
  }
}

// Ensure this file is treated as a module
export {};