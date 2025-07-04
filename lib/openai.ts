import { Platform } from 'react-native';

// Platform-aware OpenAI configuration
let openaiClient: any = null;

// Initialize OpenAI client based on platform
const initializeOpenAI = async () => {
  try {
    const OpenAI = (await import('openai')).default;
    const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY is not set. OpenAI features may not work.");
      return null;
    }

    if (Platform.OS === 'web') {
      // Web platform - use dangerouslyAllowBrowser for development
      console.warn('🌐 OpenAI: Running in web mode (development only)');
      return new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });
    } else {
      // Native platforms (iOS/Android)
      console.log('📱 OpenAI: Running in native mode');
      return new OpenAI({
        apiKey: OPENAI_API_KEY,
      });
    }
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    return null;
  }
};

// Get or create OpenAI client
export const getOpenAIClient = async () => {
  if (!openaiClient) {
    openaiClient = await initializeOpenAI();
  }
  return openaiClient;
};

// Default export for backward compatibility
export default {
  getClient: getOpenAIClient,
  isInitialized: () => !!openaiClient,
};
