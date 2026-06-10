// hooks/useCookbookManager.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Cookbook {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  emoji: string;
  color: string;
  cover_image_url?: string;
  is_public: boolean;
  recipe_count: number;
  created_at: string;
  updated_at: string;
  last_recipe_added?: string;
}

export const useCookbookManager = () => {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCookbooks = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      // cookbooks tablosu + embedded recipe sayısı (cookbook_with_stats view'ı
      // prod'da yok — tablo doğrudan sorgulanır)
      const { data, error } = await supabase
        .from('cookbooks')
        .select('*, recipe_cookbooks(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const withCounts = (data || []).map((cookbook: any) => ({
        ...cookbook,
        recipe_count: cookbook.recipe_cookbooks?.[0]?.count ?? 0,
      }));

      console.log('📚 Loaded cookbooks:', withCounts.length);
      setCookbooks(withCounts);
    } catch (err: any) {
      console.error('❌ Error loading cookbooks:', err);
      setError(err.message);
      setCookbooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const manageRecipeCookbooks = useCallback(
    async (
      recipeId: string,
      cookbookIds: string[],
      operation: 'replace' | 'add' | 'remove' = 'replace',
    ) => {
      try {
        setError(null);

        const { data, error } = await supabase.rpc('manage_recipe_cookbooks', {
          p_recipe_id: recipeId,
          p_cookbook_ids: cookbookIds,
          p_operation: operation,
        });

        if (error) throw error;

        await loadCookbooks();
        return data;
      } catch (err: any) {
        console.error('❌ Error managing recipe cookbooks:', err);
        setError(err.message);
        throw err;
      }
    },
    [loadCookbooks],
  );

  const getRecipeCookbooks = useCallback(
    async (recipeId: string): Promise<string[]> => {
      try {
        const { data, error } = await supabase
          .from('recipe_cookbooks')
          .select('cookbook_id')
          .eq('recipe_id', recipeId);

        if (error) throw error;

        return data?.map((item) => item.cookbook_id) || [];
      } catch (err: any) {
        console.error('❌ Error getting recipe cookbooks:', err);
        setError(err.message);
        return [];
      }
    },
    [],
  );

  const createCookbook = useCallback(
    async (cookbookData: {
      name: string;
      description?: string;
      emoji?: string;
      color?: string;
    }): Promise<Cookbook | null> => {
      try {
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Authentication required');
        }

        const { data, error } = await supabase
          .from('cookbooks')
          .insert({
            user_id: user.id,
            name: cookbookData.name.trim(),
            description: cookbookData.description?.trim() || null,
            emoji: cookbookData.emoji || '📚',
            color: cookbookData.color || '#F97316',
          })
          .select()
          .single();

        if (error) throw error;

        await loadCookbooks();

        return { ...data, recipe_count: 0 } as Cookbook;
      } catch (err: any) {
        console.error('❌ Error creating cookbook:', err);
        setError(err.message);
        return null;
      }
    },
    [loadCookbooks],
  );

  useEffect(() => {
    loadCookbooks();
  }, [loadCookbooks]);

  return {
    cookbooks,
    loading,
    error,
    loadCookbooks,
    manageRecipeCookbooks,
    getRecipeCookbooks,
    createCookbook,
    // Convenience methods
    addRecipeToCookbooks: (recipeId: string, cookbookIds: string[]) =>
      manageRecipeCookbooks(recipeId, cookbookIds, 'add'),
    removeRecipeFromCookbooks: (recipeId: string, cookbookIds: string[]) =>
      manageRecipeCookbooks(recipeId, cookbookIds, 'remove'),
    replaceRecipeCookbooks: (recipeId: string, cookbookIds: string[]) =>
      manageRecipeCookbooks(recipeId, cookbookIds, 'replace'),
  };
};
