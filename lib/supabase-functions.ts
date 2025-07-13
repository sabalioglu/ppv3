import { supabase } from './supabase';

/**
 * Extract recipe from web URL using AI
 * Manifesto: Tek sorumluluk - web extraction
 */
export async function extractRecipeFromUrl(url: string, userId: string) {
  const { data, error } = await supabase.functions.invoke('website-recipe-extractor', {
    body: { url, userId }
  });
  
  if (error) throw error;
  return data;
}

/**
 * Extract recipe from video URL using AI with nutrition calculation
 * Manifesto: Tek sorumluluk - video extraction
 * Edge Function: extract-video-recipe
 */
export async function extractVideoRecipe(videoUrl: string, userId: string) {
  const { data, error } = await supabase.functions.invoke('video-intelligence', {
    body: { 
      url: videoUrl,
      userId: userId 
    }
  });
  
  if (error) throw error;
  
  // Instructions format transformation - fix for frontend display
  if (data?.recipe?.instructions && Array.isArray(data.recipe.instructions)) {
    // Convert string array to instruction object array
    data.recipe.instructions = data.recipe.instructions.map((instruction, index) => {
      if (typeof instruction === 'string') {
        return {
          step: index + 1,
          instruction: instruction,
          duration_mins: null
        };
      }
      return instruction;
    });
  }
  
  return data;
}

/**
 * Get recipe processing job status
 * Manifesto: Async job tracking
 */
export async function getProcessingJobStatus(jobId: string) {
  const { data, error } = await supabase
    .from('recipe_processing_jobs')
    .select('*')
    .eq('job_id', jobId)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Simple platform detection for UI feedback
 * Manifesto: Client-side validation sadece UX için
 */
export function detectVideoPlatform(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('tiktok.com') || url.includes('vt.tiktok.com')) return 'TikTok';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
  return 'Unknown';
}

// Video extraction response type (opsiyonel ama önerilen)
export interface VideoExtractionResponse {
  success: boolean;
  recipe?: {
    id: string;
    title: string;
    ingredients: Array<{
      name: string;
      amount: string;
      notes?: string;
    }>;
    instructions: string[];
    nutrition: {
      calories: number;
      fat: number;
      carbs: number;
      protein: number;
      fiber: number;
      sugar: number;
      sodium: number;
    };
    servings?: number;
    prep_time?: number;
    cook_time?: number;
  };
  processingTime?: string;
  platform?: string;
  confidence_score?: number;
  extraction_notes?: string;
  nutrition_summary?: {
    calories: number;
    protein: number;
    calculated_by_ai: boolean;
  };
  error?: string;
}
