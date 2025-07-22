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
import { ArrowLeft, Plus, CreditCard as Edit3, Trash2, Clock, Users, Flame, ChefHat, Info } from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { EditCookbookBottomSheet } from '@/components/library/modals/EditCookbookBottomSheet';
import { RecipeSelectionBottomSheet } from '@/components/library/modals/RecipeSelectionBottomSheet';
import { StyledText, H1, H2, H3, BodyRegular, BodySmall, Caption } from '@/components/common/StyledText';
import { AppHeader } from '@/components/common/AppHeader';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRecipeSelection, setShowRecipeSelection] = useState(false);

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

      // Recipe count'u güncelle
      const { count } = await supabase
        .from('recipe_cookbooks')
        .select('*', { count: 'exact', head: true })
        .eq('cookbook_id', id);

      setCookbook({
        ...cookbookData,
        recipe_count: count || 0
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

  const handleDeleteCookbook = async () => {
    Alert.alert(
      'Delete Cookbook',
      `Are you sure you want to delete "${cookbook?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('cookbooks')
                .delete()
                .eq('id', cookbook?.id);

              if (error) throw error;

              Alert.alert('Success', 'Cookbook deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error deleting cookbook:', error);
              Alert.alert('Error', 'Failed to delete cookbook');
            }
          }
        }
      ]
    );
  };

  const handleAddRecipes = () => {
    setShowRecipeSelection(true);
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('recipe_cookbooks')
        .delete()
        .eq('cookbook_id', id)
        .eq('recipe_id', recipeId);

      if (error) throw error;

      // Update local state
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
      
      // Update cookbook recipe count
      setCookbook(prev => prev ? { ...prev, recipe_count: prev.recipe_count - 1 } : null);
      
      Alert.alert('Success', 'Recipe removed from cookbook');
    } catch (error) {
      console.error('Error removing recipe:', error);
      Alert.alert('Error', 'Failed to remove recipe');
    }
  };

  const handleRecipeLongPress = (recipe: CookbookRecipe) => {
    Alert.alert(
      recipe.title,
      'What would you like to do?',
      [
        { 
          text: 'View Recipe', 
          onPress: () => router.push(`/recipe/${recipe.id}`) 
        },
        { 
          text: 'Remove from Cookbook', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Remove Recipe',
              'Are you sure you want to remove this recipe from the cookbook?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => handleRemoveRecipe(recipe.id)
                }
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

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
        <BodyRegular color={colors.neutral[600]} style={styles.loadingText}>Loading cookbook...</BodyRegular>
      </View>
    );
  }

  if (!cookbook) {
    return (
      <View style={styles.errorContainer}>
        <H5 color={colors.neutral[600]}>Cookbook not found</H5>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <BodyRegular weight="semibold" color={colors.neutral[0]}>Go Back</BodyRegular>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader
        title={cookbook.name}
        leftComponent={
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <ArrowLeft size={24} color={colors.neutral[800]} />
          </TouchableOpacity>
        }
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={() => setShowEditModal(true)}
            >
              <Edit3 size={20} color={colors.neutral[600]} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={handleDeleteCookbook}
            >
              <Trash2 size={20} color={colors.error[500]} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cookbook Header */}
        <View style={styles.cookbookHeader}>
          <View style={[styles.cookbookIcon, { backgroundColor: `${cookbook.color}15` }]}>
            <StyledText variant="h1">{cookbook.emoji}</StyledText>
          </View>
          <H2 weight="bold" color={colors.neutral[800]} style={styles.cookbookName}>{cookbook.name}</H2>
          {cookbook.description && (
            <BodyRegular color={colors.neutral[600]} style={styles.cookbookDescription}>{cookbook.description}</BodyRegular>
          )}
          <BodySmall weight="medium" color={colors.neutral[500]}>
            {cookbook.recipe_count} recipe{cookbook.recipe_count !== 1 ? 's' : ''}
          </BodySmall>
        </View>

        {/* Add Recipe Button */}
        <View style={styles.addRecipeSection}>
          <TouchableOpacity 
            style={styles.addRecipeButton}
            onPress={handleAddRecipes}
          >
            <Plus size={20} color={colors.primary[500]} />
            <BodyRegular weight="semibold" color={colors.primary[600]}>Add Recipes</BodyRegular>
          </TouchableOpacity>
        </View>

        {/* Recipes List */}
        <View style={styles.recipesSection}>
          <View style={styles.sectionHeader}>
            <H5 weight="semibold" color={colors.neutral[800]}>Recipes</H5>
            {recipes.length > 0 && (
              <View style={styles.infoContainer}>
                <Info size={14} color={colors.neutral[400]} />
                <Caption color={colors.neutral[500]}>Hold recipe to manage</Caption>
              </View>
            )}
          </View>
          
          {recipes.length === 0 ? (
            <View style={styles.emptyState}>
              <H5 weight="semibold" color={colors.neutral[600]}>No recipes yet</H5>
              <BodyRegular color={colors.neutral[500]} style={styles.emptySubtitle}>
                Add some recipes to this cookbook to get started
              </BodyRegular>
            </View>
          ) : (
            recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
                onLongPress={() => handleRecipeLongPress(recipe)}
                delayLongPress={500}
              >
                {/* Recipe Image */}
                <View style={styles.recipeImageContainer}>
                  {recipe.image_url ? (
                    <Image
                      source={{ uri: recipe.image_url }}
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
                  <H6 weight="semibold" color={colors.neutral[800]}>{recipe.title}</H6>
                  <BodySmall color={colors.neutral[600]} numberOfLines={2} style={styles.recipeDescription}>
                    {recipe.description}
                  </BodySmall>
                  
                  <View style={styles.recipeMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={12} color={colors.neutral[500]} />
                      <Caption color={colors.neutral[500]}>
                        {recipe.prep_time + recipe.cook_time}m
                      </Caption>
                    </View>
                    <View style={styles.metaItem}>
                      <Users size={12} color={colors.neutral[500]} />
                      <Caption color={colors.neutral[500]}>{recipe.servings}</Caption>
                    </View>
                    {recipe.nutrition?.calories && (
                      <View style={styles.metaItem}>
                        <Flame size={12} color={colors.neutral[500]} />
                        <Caption color={colors.neutral[500]}>{recipe.nutrition.calories} cal</Caption>
                      </View>
                    )}
                    <View style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
                      <Caption weight="bold" color={colors.neutral[0]}>{recipe.difficulty}</Caption>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Cookbook Modal */}
      {cookbook && (
        <EditCookbookBottomSheet
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          cookbook={cookbook}
          onUpdate={loadCookbookDetails}
        />
      )}

      {/* Recipe Selection Modal */}
      {cookbook && (
        <RecipeSelectionBottomSheet
          visible={showRecipeSelection}
          onClose={() => setShowRecipeSelection(false)}
          cookbookId={cookbook.id}
          cookbookName={cookbook.name}
          onRecipesAdded={() => {
            setShowRecipeSelection(false);
            loadCookbookDetails(); // Refresh the cookbook details
          }}
        />
      )}
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
  cookbookName: {
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
  recipesSection: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptySubtitle: {
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
  recipeDescription: {
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
  difficultyChip: {
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
});
