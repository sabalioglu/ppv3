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
 * Extract recipe from video URL using AI
 * Manifesto: Tek sorumluluk - video extraction
 */
export async function extractVideoRecipe(videoUrl: string, userId: string) {
  const { data, error } = await supabase.functions.invoke('extract-video-recipe', {
    body: { 
      url: videoUrl,
      userId: userId 
    }
  });
  
  if (error) throw error;
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