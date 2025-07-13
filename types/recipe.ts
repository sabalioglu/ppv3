// types/recipe.ts (eğer yoksa)
export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image: string;
  thumbnail_url?: string;
  ingredients: any[];
  instructions: any[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  calories?: number;
  nutrition?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  source_url?: string;
  source_platform?: string;
  created_at: string;
  updated_at?: string;
}

// types/cookbook.ts (yeni oluştur)
export interface Cookbook {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_image?: string;
  emoji?: string;
  color?: string;
  recipe_count?: number;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeCookbook {
  recipe_id: string;
  cookbook_id: string;
  added_at: string;
  position?: number;
  notes?: string;
}
