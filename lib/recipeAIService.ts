import { Platform } from 'react-native';

// Platform-aware OpenAI import
let openai: any = null;

// Initialize OpenAI only on supported platforms
const initializeOpenAI = async () => {
  if (Platform.OS === 'web') {
    // For web platform, use dangerouslyAllowBrowser (development only)
    const OpenAI = (await import('openai')).default;
    const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY is not set. OpenAI features may not work.");
      return null;
    }
    
    return new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true, // Only for development/testing
    });
  } else {
    // For native platforms (iOS/Android)
    const OpenAI = (await import('openai')).default;
    const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY is not set. OpenAI features may not work.");
      return null;
    }
    
    return new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
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
  ingredients: Array<{ 
    name: string; 
    quantity?: string; 
    unit?: string; 
    notes?: string 
  }>;
  instructions: Array<{ 
    step: number; 
    instruction: string; 
    duration_mins?: number 
  }>;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  tags?: string[];
  category?: string;
}

// Rate limiting storage (simple in-memory for now)
const rateLimitStore = new Map<string, { count: number; lastRequest: number; dailyCount: number; dailyReset: number }>();

// Smart URL analysis for model selection
function analyzeUrlContentType(url: string): 'text' | 'media' {
  const mediaPatterns = /instagram|tiktok|youtube|facebook.*video|pinterest.*pin/i;
  return mediaPatterns.test(url) ? 'media' : 'text';
}

// Rate limiting check
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

  // Check daily limit
  if (now > userLimit.dailyReset) {
    userLimit.dailyCount = 0;
    userLimit.dailyReset = now + 24 * 60 * 60 * 1000;
  }

  if (userLimit.dailyCount >= 10) {
    return { allowed: false, waitTime: userLimit.dailyReset - now };
  }

  // Check per-minute limit
  const timeSinceLastRequest = now - userLimit.lastRequest;
  if (timeSinceLastRequest < 30000) { // 30 seconds
    return { allowed: false, waitTime: 30000 - timeSinceLastRequest };
  }

  // Update counters
  userLimit.count++;
  userLimit.dailyCount++;
  userLimit.lastRequest = now;
  
  return { allowed: true };
}

// Main extraction function with platform-aware initialization
export async function extractRecipeFromUrl(url: string, userId: string): Promise<ExtractedRecipeData | null> {
  try {
    // Initialize OpenAI client if not already done
    if (!openai) {
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

    // Platform-specific handling
    if (Platform.OS === 'web') {
      console.warn('⚠️ Running OpenAI in browser environment. This is for development only.');
      console.warn('⚠️ In production, implement a backend proxy for security.');
    }

    // Determine optimal model based on URL content type
    const contentType = analyzeUrlContentType(url);
    let selectedModel = contentType === 'text' ? 'gpt-4o-mini' : 'gpt-4o-mini'; // Using 4o-mini for both for now
    
    // System prompt for recipe extraction
    const systemPrompt = `You are an expert culinary assistant. Extract comprehensive recipe information from the provided URL.

Parse the webpage content and identify:
- Recipe title and brief description
- Image URL (if prominent)
- Prep time and cook time (in minutes)
- Number of servings
- Difficulty level ('Easy', 'Medium', or 'Hard')
- Detailed ingredients list with quantities
- Step-by-step instructions
- Nutritional information (if available)
- Relevant tags (vegetarian, quick, healthy, etc.)
- Primary category (Breakfast, Lunch, Dinner, Snacks, Desserts)

**CRITICAL:** Respond ONLY with valid JSON. No markdown, no explanations, just pure JSON.

JSON Schema:
{
  "title": "string",
  "description": "string (optional)",
  "image_url": "string (optional)",
  "prep_time": "number (optional, minutes)",
  "cook_time": "number (optional, minutes)",
  "servings": "number (optional)",
  "difficulty": "string (optional, 'Easy'|'Medium'|'Hard')",
  "ingredients": [{"name": "string", "quantity": "string", "unit": "string", "notes": "string"}],
  "instructions": [{"step": "number", "instruction": "string", "duration_mins": "number"}],
  "nutrition": {"calories": "number", "protein": "number", "carbs": "number", "fat": "number", "fiber": "number"},
  "tags": ["string"],
  "category": "string"
}`;

    // Make OpenAI API call
    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extract recipe details from this URL: ${url}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2000,
    });

    const rawJson = response.choices[0].message.content;
    
    if (!rawJson) {
      console.error("OpenAI returned no content for URL:", url);
      return null;
    }

    try {
      const parsedData: ExtractedRecipeData = JSON.parse(rawJson);

      // Validate critical fields
      if (!parsedData.title || !parsedData.ingredients || parsedData.ingredients.length === 0) {
        console.warn("Extracted recipe missing critical fields for URL:", url);
        return null;
      }

      // Ensure arrays are properly initialized
      parsedData.ingredients = parsedData.ingredients || [];
      parsedData.instructions = parsedData.instructions || [];
      parsedData.tags = parsedData.tags || [];

      return parsedData;

    } catch (jsonError) {
      console.error("Failed to parse JSON from OpenAI for URL:", url, "Error:", jsonError);
      throw new Error("Invalid response format. Please try again with a different URL.");
    }

  } catch (error: any) {
    console.error("Error extracting recipe from URL:", url, error);
    
    // User-friendly error messages
    if (error.message?.includes('Rate limit')) {
      throw error; // Re-throw rate limit errors as-is
    } else if (error.message?.includes('Invalid URL')) {
      throw new Error("Invalid URL format. Please check the link and try again.");
    } else if (error.message?.includes('timeout')) {
      throw new Error("Request timeout. Please try again.");
    } else if (error.message?.includes('OpenAI client could not be initialized')) {
      throw new Error("AI service is currently unavailable. Please try again later.");
    } else {
      throw new Error("Could not extract recipe from this URL. Please try a different link or add manually.");
    }
  }
}

// Development helper function
export function getOpenAIStatus(): string {
  if (Platform.OS === 'web') {
    return 'Running in browser mode (development only)';
  } else {
    return 'Running in native mode';
  }
}
