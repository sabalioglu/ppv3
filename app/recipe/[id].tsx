//app > recipe > [id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { ArrowLeft, Clock, Users, Flame, Heart, ExternalLink, Play, ShoppingCart, CreditCard as Edit3, Share } from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { StyledText, H1, H2, H3, BodyRegular, BodySmall, Caption } from '@/components/common/StyledText';
import { AppHeader } from '@/components/common/AppHeader';

// Recipe interface (same as library.tsx)
interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: Array<{ name: string; quantity?: string; unit?: string; notes?: string }>;
  instructions: Array<{ step: number; instruction: string; duration_mins?: number }>;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  tags: string[];
  category: string;
  is_favorite: boolean;
  is_ai_generated: boolean;
  source_url?: string;
  ai_match_score?: number;
  created_at: string;
  updated_at: string;
}

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  // Load recipe data
  const loadRecipe = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to view recipe details.');
        router.back();
        return;
      }

      const { data: recipeData, error } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading recipe:', error);
        Alert.alert('Error', 'Failed to load recipe details');
        router.back();
        return;
      }

      if (recipeData) {
        const formattedRecipe: Recipe = {
          id: recipeData.id,
          title: recipeData.title,
          description: recipeData.description || '',
          image_url: recipeData.image_url,
          prep_time: recipeData.prep_time || 0,
          cook_time: recipeData.cook_time || 0,
          servings: recipeData.servings || 1,
          difficulty: recipeData.difficulty || 'Easy',
          ingredients: recipeData.ingredients || [],
          instructions: recipeData.instructions || [],
          nutrition: recipeData.nutrition,
          tags: recipeData.tags || [],
          category: recipeData.category || 'General',
          is_favorite: recipeData.is_favorite || false,
          is_ai_generated: recipeData.is_ai_generated || false,
          source_url: recipeData.source_url,
          ai_match_score: recipeData.ai_match_score,
          created_at: recipeData.created_at,
          updated_at: recipeData.updated_at,
        };
        setRecipe(formattedRecipe);
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert('Error', 'Failed to load recipe details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipe();
  }, [id]);

  // Toggle favorite
  const handleFavorite = async () => {
    if (!recipe) return;
    
    try {
      const newFavoriteStatus = !recipe.is_favorite;
      const { error } = await supabase
        .from('user_recipes')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', recipe.id);

      if (error) {
        Alert.alert('Error', 'Failed to update favorite status');
        return;
      }

      setRecipe(prev => prev ? { ...prev, is_favorite: newFavoriteStatus } : null);
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  // Open source URL
  const handleOpenSource = async () => {
    if (recipe?.source_url) {
      try {
        await Linking.openURL(recipe.source_url);
      } catch (error) {
        Alert.alert('Error', 'Could not open source URL');
      }
    }
  };

  // Placeholder functions for future features
  const handleCookNow = () => {
    Alert.alert('Coming Soon! 👨‍🍳', 'Interactive Cooking Mode will be implemented in the next update.');
  };

  const handleAddMissingToCart = () => {
    Alert.alert('Coming Soon! 🛒', 'Smart Pantry Integration with shopping cart will be implemented soon.');
  };

  const handleShare = () => {
    Alert.alert('Coming Soon! 📤', 'Recipe sharing feature will be implemented soon.');
  };

  const handleEdit = () => {
    Alert.alert('Coming Soon! ✏️', 'Recipe editing feature will be implemented soon.');
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
        <BodyRegular color={colors.neutral[600]} style={styles.loadingText}>Loading recipe details...</BodyRegular>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <H5 color={colors.neutral[600]}>Recipe not found</H5>
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
        title={recipe.title}
        leftComponent={
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <ArrowLeft size={24} color={colors.neutral[800]} />
          </TouchableOpacity>
        }
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleFavorite} style={styles.headerActionButton}>
              <Heart
                size={24}
                color={recipe.is_favorite ? colors.error[500] : colors.neutral[600]}
                fill={recipe.is_favorite ? colors.error[500] : 'transparent'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.headerActionButton}>
              <Share size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEdit} style={styles.headerActionButton}>
              <Edit3 size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {recipe.image_url && recipe.image_url.trim() !== '' ? (
            <Image 
              source={{ uri: recipe.image_url }} 
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => {
                console.log('Image failed to load:', recipe.image_url);
              }}
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <BodyRegular color={colors.neutral[500]}>No Image</BodyRegular>
            </View>
          )}
          
          {/* Badges */}
          <View style={styles.badges}>
            {recipe.is_ai_generated && (
              <View style={styles.aiBadge}>
                <Caption weight="bold" color={colors.neutral[0]}>AI</Caption>
              </View>
            )}
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
              <Caption weight="bold" color={colors.neutral[0]}>{recipe.difficulty}</Caption>
            </View>
          </View>
        </View>

        {/* Title and Description */}
        <View style={styles.titleSection}>
          <H2 weight="bold" color={colors.neutral[800]} style={styles.title}>{recipe.title}</H2>
          <BodyRegular color={colors.neutral[600]} style={styles.description}>{recipe.description}</BodyRegular>
          
          {/* Meta Info */}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Clock size={16} color={colors.neutral[500]} />
              <BodySmall weight="medium" color={colors.neutral[600]}>{recipe.prep_time + recipe.cook_time}m</BodySmall>
            </View>
            <View style={styles.metaItem}>
              <Users size={16} color={colors.neutral[500]} />
              <BodySmall weight="medium" color={colors.neutral[600]}>{recipe.servings} servings</BodySmall>
            </View>
            {recipe.nutrition?.calories && (
              <View style={styles.metaItem}>
                <Flame size={16} color={colors.neutral[500]} />
                <BodySmall weight="medium" color={colors.neutral[600]}>{recipe.nutrition.calories} cal</BodySmall>
              </View>
            )}
          </View>

          {/* Source URL */}
          {recipe.source_url && (
            <TouchableOpacity style={styles.sourceButton} onPress={handleOpenSource}>
              <ExternalLink size={16} color={colors.primary[500]} />
              <BodySmall weight="semibold" color={colors.primary[500]}>View Original Source</BodySmall>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleCookNow}>
            <Play size={20} color={colors.neutral[0]} />
            <BodyRegular weight="semibold" color={colors.neutral[0]}>Cook Now</BodyRegular>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleAddMissingToCart}>
            <ShoppingCart size={20} color={colors.primary[500]} />
            <BodyRegular weight="semibold" color={colors.primary[500]}>Add Missing to Cart</BodyRegular>
          </TouchableOpacity>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <H5 weight="semibold" color={colors.neutral[800]}>Ingredients</H5>
          {recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <View style={styles.ingredientBullet} />
              <BodyRegular color={colors.neutral[700]} style={styles.ingredientText}>
                {ingredient.quantity && ingredient.unit 
                  ? `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`
                  : ingredient.name
                }
                {ingredient.notes && (
                  <BodyRegular color={colors.neutral[500]} style={styles.ingredientNotes}> ({ingredient.notes})</BodyRegular>
                )}
              </BodyRegular>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <H5 weight="semibold" color={colors.neutral[800]}>Instructions</H5>
          {recipe.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <BodySmall weight="bold" color={colors.neutral[0]}>{instruction.step}</BodySmall>
              </View>
              <View style={styles.instructionContent}>
                <BodyRegular color={colors.neutral[700]} style={styles.instructionText}>{instruction.instruction}</BodyRegular>
                {instruction.duration_mins && (
                  <BodySmall color={colors.neutral[500]}>
                    ⏱️ {instruction.duration_mins} minutes
                  </BodySmall>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Nutrition Info */}
        {recipe.nutrition && (
          <View style={styles.section}>
            <H5 weight="semibold" color={colors.neutral[800]}>Nutrition Information</H5>
            <View style={styles.nutritionGrid}>
              {recipe.nutrition.calories && (
                <View style={styles.nutritionItem}>
                  <H5 weight="bold" color={colors.neutral[800]}>{recipe.nutrition.calories}</H5>
                  <Caption color={colors.neutral[500]}>Calories</Caption>
                </View>
              )}
              {recipe.nutrition.protein && (
                <View style={styles.nutritionItem}>
                  <H5 weight="bold" color={colors.neutral[800]}>{recipe.nutrition.protein}g</H5>
                  <Caption color={colors.neutral[500]}>Protein</Caption>
                </View>
              )}
              {recipe.nutrition.carbs && (
                <View style={styles.nutritionItem}>
                  <H5 weight="bold" color={colors.neutral[800]}>{recipe.nutrition.carbs}g</H5>
                  <Caption color={colors.neutral[500]}>Carbs</Caption>
                </View>
              )}
              {recipe.nutrition.fat && (
                <View style={styles.nutritionItem}>
                  <H5 weight="bold" color={colors.neutral[800]}>{recipe.nutrition.fat}g</H5>
                  <Caption color={colors.neutral[500]}>Fat</Caption>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <View style={styles.section}>
            <H5 weight="semibold" color={colors.neutral[800]}>Tags</H5>
            <View style={styles.tagsContainer}>
              {recipe.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <BodySmall weight="medium" color={colors.primary[600]}>{tag}</BodySmall>
                </View>
              ))}
            </View>
          </View>
        )}
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
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
  heroContainer: {
    position: 'relative',
    height: 250,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  badges: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  aiBadge: {
    backgroundColor: colors.secondary[500],
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  difficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  titleSection: {
    padding: spacing.lg,
  },
  title: {
  },
  metaInfo: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  section: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[500],
    marginTop: 8,
    marginRight: spacing.md,
  },
  ingredientText: {
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  instructionContent: {
    flex: 1,
  },
  instructionText: {
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  nutritionItem: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 80,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primary[50],
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});