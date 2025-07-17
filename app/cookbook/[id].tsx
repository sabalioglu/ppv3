// app/cookbook/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { ArrowLeft, Plus, Edit3, Trash2, Clock, Users, Flame, ChefHat } from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface CookbookRecipe {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  is_favorite: boolean;
  is_ai_generated: boolean;
  source_url?: string;
  nutrition?: {
    calories?: number;
  };
  created_at: string;
}

interface Cookbook {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  color: string;
  recipe_count: number;
  created_at: string;
}

export default function CookbookDetail() {
  const { id } = useLocalSearchParams();
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [recipes, setRecipes] = useState<CookbookRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCookbookDetails = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to view cookbook details.');
        router.back();
        return;
      }

      // Load cookbook info
      const { data: cookbookData, error: cookbookError } = await supabase
        .from('cookbooks')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (cookbookError) {
        console.error('Error loading cookbook:', cookbookError);
        Alert.alert('Error', 'Failed to load cookbook details');
        router.back();
        return;
      }

      // Load cookbook recipes
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipe_cookbooks')
        .select(`
          recipe_id,
          user_recipes (
            id,
            title,
            description,
            image_url,
            prep_time,
            cook_time,
            servings,
            difficulty,
            category,
            is_favorite,
            is_ai_generated,
            source_url,
            nutrition,
            created_at
          )
        `)
        .eq('cookbook_id', id);

      if (recipesError) {
        console.error('Error loading cookbook recipes:', recipesError);
        setRecipes([]);
      } else {
        const formattedRecipes = recipesData
          ?.filter(item => item.user_recipes)
          .map(item => item.user_recipes as any) || [];
        setRecipes(formattedRecipes);
      }

      setCookbook({
        ...cookbookData,
        recipe_count: recipesData?.length || 0
      });

    } catch (error) {
      console.error('Error loading cookbook:', error);
      Alert.alert('Error', 'Failed to load cookbook details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCookbookDetails();
  }, [id]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return colors.success[500];
      case 'Medium': return colors.warning[500];
      case 'Hard': return colors.error[500];
      default: return colors.neutral[500];
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading cookbook...</Text>
      </View>
    );
  }

  if (!cookbook) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Cookbook not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => {
              // Edit cookbook modal açılacak
              Alert.alert('Edit Cookbook', `Edit "${cookbook.name}" functionality coming soon!`);
            }}
          >
            <Edit3 size={20} color={colors.neutral[600]} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => {
              // Delete confirmation
              Alert.alert(
                'Delete Cookbook',
                `Are you sure you want to delete "${cookbook.name}"? This action cannot be undone.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => {
                      // Delete cookbook logic buraya
                      Alert.alert('Coming Soon!', 'Delete cookbook functionality will be implemented.');
                    }
                  }
                ]
              );
            }}
          >
            <Trash2 size={20} color={colors.error[500]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cookbook Header */}
        <View style={styles.cookbookHeader}>
          <View style={[styles.cookbookIcon, { backgroundColor: `${cookbook.color}15` }]}>
            <Text style={styles.cookbookEmoji}>{cookbook.emoji}</Text>
          </View>
          <Text style={styles.cookbookName}>{cookbook.name}</Text>
          {cookbook.description && (
            <Text style={styles.cookbookDescription}>{cookbook.description}</Text>
          )}
          <Text style={styles.recipeCount}>
            {cookbook.recipe_count} recipe{cookbook.recipe_count !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Add Recipe Button */}
        <View style={styles.addRecipeSection}>
          <TouchableOpacity 
            style={styles.addRecipeButton}
            onPress={() => {
              // Navigate to library with this cookbook pre-selected
              Alert.alert('Coming Soon!', 'Add recipes from library will be implemented soon.');
            }}
          >
            <Plus size={20} color={colors.primary[500]} />
            <Text style={styles.addRecipeButtonText}>Add Recipes</Text>
          </TouchableOpacity>
        </View>

        {/* Recipes List */}
        <View style={styles.recipesSection}>
          <Text style={styles.sectionTitle}>Recipes</Text>
          
          {recipes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No recipes yet</Text>
              <Text style={styles.emptySubtitle}>
                Add some recipes to this cookbook to get started
              </Text>
            </View>
          ) : (
            recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
              >
                {/* Recipe Image */}
                <View style={styles.recipeImageContainer}>
                  {recipe.image_url ? (
                    <Image
                      source={{ 
                        uri: recipe.source_url?.includes('instagram.com') 
                          ? `https://images.weserv.nl/?url=${encodeURIComponent(recipe.image_url)}&w=120&h=80&fit=cover&maxage=7d`
                          : recipe.image_url 
                      }}
                      style={styles.recipeImage}
                      onError={(error) => console.log('Recipe image load error:', error)}
                    />
                  ) : (
                    <View style={styles.recipeImagePlaceholder}>
                      <ChefHat size={24} color={colors.neutral[400]} />
                    </View>
                  )}
                </View>

                {/* Recipe Info */}
                <View style={styles.recipeInfoContainer}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <Text style={styles.recipeDescription} numberOfLines={2}>
                    {recipe.description}
                  </Text>
                  
                  <View style={styles.recipeMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={12} color={colors.neutral[500]} />
                      <Text style={styles.metaText}>
                        {recipe.prep_time + recipe.cook_time}m
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Users size={12} color={colors.neutral[500]} />
                      <Text style={styles.metaText}>{recipe.servings}</Text>
                    </View>
                    {recipe.nutrition?.calories && (
                      <View style={styles.metaItem}>
                        <Flame size={12} color={colors.neutral[500]} />
                        <Text style={styles.metaText}>{recipe.nutrition.calories} cal</Text>
                      </View>
                    )}
                    <View style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
                      <Text style={styles.difficultyChipText}>{recipe.difficulty}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[0],
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  cookbookHeader: {
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  cookbookIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cookbookEmoji: {
    fontSize: 40,
  },
  cookbookName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cookbookDescription: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  recipeCount: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  addRecipeSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  addRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
  },
  addRecipeButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary[600],
  },
  recipesSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[600],
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  recipeImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  recipeImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfoContainer: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  recipeDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  difficultyChip: {
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  difficultyChipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.neutral[0],
  },
});
