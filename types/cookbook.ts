// types/cookbook.ts
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

export interface CookbookWithRecipes extends Cookbook {
  recipes?: Recipe[];
}

// Default cookbook templates
export const DEFAULT_COOKBOOKS = [
  { name: 'All Recipes', emoji: '📖', color: '#F97316', is_default: true },
  { name: 'Breakfast', emoji: '🌅', color: '#F59E0B' },
  { name: 'Lunch', emoji: '☀️', color: '#10B981' },
  { name: 'Dinner', emoji: '🌙', color: '#6366F1' },
  { name: 'Desserts', emoji: '🍰', color: '#EC4899' },
  { name: 'Quick & Easy', emoji: '⚡', color: '#14B8A6' },
  { name: 'Healthy', emoji: '🥗', color: '#22C55E' }
];

// Color options for custom cookbooks
export const COOKBOOK_COLORS = [
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#22C55E', // Green
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
];

// Emoji options for custom cookbooks
export const COOKBOOK_EMOJIS = [
  '📚', '📖', '📕', '📗', '📘', '📙',
  '🍳', '🥘', '🍲', '🥗', '🍜', '🍝',
  '🌮', '🍕', '🍔', '🥪', '🍱', '🍛',
  '🥐', '🍰', '🧁', '🍪', '🍩', '🎂',
  '🌅', '☀️', '🌙', '⭐', '✨', '💫',
  '❤️', '🧡', '💛', '💚', '💙', '💜'
];
