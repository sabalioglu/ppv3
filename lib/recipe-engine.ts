// lib/recipe-engine.ts — client SDK for the Stovd recipe engine (RAG).
// Talks to the `recipe-recommend` edge function (auth via the user's Supabase session)
// and logs interaction signals to `recipe_feedback` so the taste profile learns.
import { supabase } from './supabase';

export interface RecommendedRecipe {
  candidate_id: string | null;
  title: string;
  cuisine: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  uses_from_pantry: string[];
  missing_ingredients: string[];
  total_time_min: number;
  servings: number;
  ingredients: Array<{ name: string; amount: string }>;
  steps: string[];
  why: string;
}

export interface RecommendResult {
  recommendations: RecommendedRecipe[];
  candidates_considered: number;
  pantry_size?: number;
  note?: string;
}

export interface RecommendOptions {
  /** Override pantry; if omitted the engine reads the user's pantry_items. */
  pantry?: string[];
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'any';
  count?: number;
}

/**
 * Get recipes the user can cook from their pantry, personalized by taste profile.
 * Returns [] (with a `note`) when the corpus has no matches yet.
 */
export async function recommendRecipes(
  opts: RecommendOptions = {},
): Promise<RecommendResult> {
  const { data, error } = await supabase.functions.invoke('recipe-recommend', {
    body: {
      pantry: opts.pantry,
      mealType: opts.mealType ?? 'any',
      count: opts.count ?? 5,
    },
  });
  if (error) throw error;
  return data as RecommendResult;
}

export type FeedbackAction =
  | 'saved'
  | 'liked'
  | 'disliked'
  | 'cooked'
  | 'skipped';

/**
 * Record an interaction. Feeds the taste profile + ranking.
 * Call alongside existing favorite/save toggles so personalization improves over time.
 */
export async function logRecipeFeedback(
  action: FeedbackAction,
  recipe: { id?: string | null; title: string; cuisine?: string | null },
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('recipe_feedback').insert({
    user_id: user.id,
    recipe_id: recipe.id ?? null,
    recipe_title: recipe.title,
    cuisine: recipe.cuisine ?? null,
    action,
  });
}
