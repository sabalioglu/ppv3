// types/cookbook.ts
export interface Cookbook {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  emoji: string;
  color: string;
  created_at: string;
  updated_at: string;
  recipe_count?: number;
}