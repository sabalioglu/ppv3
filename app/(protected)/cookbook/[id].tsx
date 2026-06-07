// app/cookbook/[id].tsx — Cookbook detail (Warm Kitchen restyle).
// Visual restyle only: all data loading, mutations, modals, long-press management
// and navigation are preserved exactly.

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Clock,
  Users,
  Flame,
  ChefHat,
  Info,
  ChevronRight,
} from 'lucide-react-native';
import { spacing, radius, colors as palette, fonts } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedText from '@/components/UI/ThemedText';
import { Display, Eyebrow } from '@/components/UI/Display';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { EditCookbookBottomSheet } from '@/components/library/modals/EditCookbookBottomSheet';
import { RecipeSelectionBottomSheet } from '@/components/library/modals/RecipeSelectionBottomSheet';
import { t, i18n } from '@/lib/i18n';
import { confirmDestructive } from '@/lib/ui/confirm';

// Locale is fixed at startup (device-driven), so compute label formats once.
const TR = i18n.locale === 'tr';
const minLabel = (m: number) => (TR ? `${m} dk` : `${m} min`);

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

const DIFFICULTY_KEY: Record<string, string> = {
  Easy: 'cookbook.difficultyEasy',
  Medium: 'cookbook.difficultyMedium',
  Hard: 'cookbook.difficultyHard',
};
const difficultyLabel = (level: string) =>
  DIFFICULTY_KEY[level] ? t(DIFFICULTY_KEY[level]) : level;

export default function CookbookDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [recipes, setRecipes] = useState<CookbookRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRecipeSelection, setShowRecipeSelection] = useState(false);

  const loadCookbookDetails = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          t('cookbook.authRequiredTitle'),
          t('cookbook.authRequiredMessage'),
        );
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
        Alert.alert(t('common.error'), t('cookbook.loadError'));
        router.back();
        return;
      }

      // Load cookbook recipes
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipe_cookbooks')
        .select(
          `
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
        `,
        )
        .eq('cookbook_id', id);

      if (recipesError) {
        console.error('Error loading cookbook recipes:', recipesError);
        setRecipes([]);
      } else {
        const formattedRecipes =
          recipesData
            ?.filter((item) => item.user_recipes)
            .map((item) => item.user_recipes as any) || [];
        setRecipes(formattedRecipes);
      }

      // Recipe count'u güncelle
      const { count } = await supabase
        .from('recipe_cookbooks')
        .select('*', { count: 'exact', head: true })
        .eq('cookbook_id', id);

      setCookbook({
        ...cookbookData,
        recipe_count: count || 0,
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
    confirmDestructive({
      title: t('cookbook.deleteTitle'),
      message: t('cookbook.deleteMessage', { name: cookbook?.name }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('cookbooks')
            .delete()
            .eq('id', cookbook?.id);

          if (error) throw error;

          router.back();
        } catch (error) {
          console.error('Error deleting cookbook:', error);
          Alert.alert(t('common.error'), t('cookbook.deleteError'));
        }
      },
    });
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
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));

      // Update cookbook recipe count
      setCookbook((prev) =>
        prev ? { ...prev, recipe_count: prev.recipe_count - 1 } : null,
      );

      Alert.alert(t('common.success'), t('cookbook.recipeRemovedMessage'));
    } catch (error) {
      console.error('Error removing recipe:', error);
      Alert.alert(t('common.error'), t('cookbook.removeRecipeError'));
    }
  };

  const handleRecipeLongPress = (recipe: CookbookRecipe) => {
    Alert.alert(recipe.title, t('cookbook.longPressMessage'), [
      {
        text: t('cookbook.viewRecipe'),
        onPress: () => router.push(`/recipe/${recipe.id}`),
      },
      {
        text: t('cookbook.removeFromCookbook'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            t('cookbook.removeRecipeTitle'),
            t('cookbook.removeRecipeConfirm'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('cookbook.remove'),
                style: 'destructive',
                onPress: () => handleRemoveRecipe(recipe.id),
              },
            ],
          );
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return colors.success;
      case 'Medium':
        return colors.warning;
      case 'Hard':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText
          style={[styles.loadingText, { color: colors.textSecondary }]}
        >
          {t('cookbook.loading')}
        </ThemedText>
      </View>
    );
  }

  if (!cookbook) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
          {t('cookbook.notFound')}
        </ThemedText>
        <TouchableOpacity
          style={[styles.backCta, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backCtaText}>
            {t('cookbook.goBack')}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover hero */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[`${cookbook.color}E6`, `${cookbook.color}99`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <ThemedText style={styles.heroEmoji}>{cookbook.emoji}</ThemedText>
          </LinearGradient>
          <LinearGradient
            colors={['rgba(18,11,7,0)', 'rgba(18,11,7,0.20)']}
            style={styles.heroScrim}
          />

          {/* circular controls */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.heroBtn}
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroRightBtns}>
            <TouchableOpacity
              onPress={() => setShowEditModal(true)}
              style={styles.heroBtnRight}
              hitSlop={8}
            >
              <Edit3 size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteCookbook}
              style={styles.heroBtnRight}
              hitSlop={8}
            >
              <Trash2 size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Overlapping cream sheet */}
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <Eyebrow style={styles.kicker}>
            {t('cookbook.recipeCount', { count: cookbook.recipe_count })}
          </Eyebrow>
          <Display size="xl" style={styles.title}>
            {cookbook.name}
          </Display>
          {cookbook.description ? (
            <ThemedText
              style={[styles.description, { color: colors.textSecondary }]}
            >
              {cookbook.description}
            </ThemedText>
          ) : null}

          {/* Add Recipe Button */}
          <TouchableOpacity
            style={[styles.addRecipeButton, { borderColor: colors.primary }]}
            onPress={handleAddRecipes}
            activeOpacity={0.85}
          >
            <Plus size={18} color={colors.primary} />
            <ThemedText
              style={[styles.addRecipeButtonText, { color: colors.primary }]}
            >
              {t('cookbook.addRecipe')}
            </ThemedText>
          </TouchableOpacity>

          {/* Recipes List */}
          <View style={styles.sectionHeader}>
            <Display size="md" color={colors.textPrimary}>
              {t('cookbook.recipesTitle')}
            </Display>
            {recipes.length > 0 ? (
              <View
                style={[
                  styles.infoContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <Info size={13} color={colors.textSecondary} />
                <ThemedText
                  style={[styles.infoText, { color: colors.textSecondary }]}
                >
                  {t('cookbook.longPressHint')}
                </ThemedText>
              </View>
            ) : null}
          </View>

          {recipes.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyMark,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <ChefHat size={28} color={colors.textSecondary} />
              </View>
              <Display
                size="sm"
                color={colors.textPrimary}
                style={styles.emptyTitle}
              >
                {t('cookbook.emptyTitle')}
              </Display>
              <ThemedText
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                {t('cookbook.emptySubtitle')}
              </ThemedText>
            </View>
          ) : (
            recipes.map((recipe) => {
              const totalTime =
                (recipe.prep_time || 0) + (recipe.cook_time || 0);
              const difficultyTr = difficultyLabel(recipe.difficulty);
              return (
                <Pressable
                  key={recipe.id}
                  style={[
                    styles.recipeCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderLight,
                    },
                  ]}
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
                        resizeMode="cover"
                        onError={(error) =>
                          console.log('Recipe image load error:', error)
                        }
                      />
                    ) : (
                      <LinearGradient
                        colors={['#D56A4F', '#C8472B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.recipeImagePlaceholder}
                      >
                        <ChefHat size={26} color="rgba(255,255,255,0.55)" />
                      </LinearGradient>
                    )}
                  </View>

                  {/* Recipe Info */}
                  <View style={styles.recipeInfoContainer}>
                    {recipe.category && recipe.category !== 'General' ? (
                      <Eyebrow
                        color={colors.textSecondary}
                        style={styles.recipeKicker}
                      >
                        {recipe.category.toUpperCase()}
                      </Eyebrow>
                    ) : null}
                    <Display
                      size="sm"
                      color={colors.textPrimary}
                      numberOfLines={2}
                    >
                      {recipe.title}
                    </Display>

                    <View style={styles.recipeMeta}>
                      {totalTime > 0 ? (
                        <View style={styles.metaItem}>
                          <Clock size={12} color={colors.textSecondary} />
                          <ThemedText
                            style={[
                              styles.metaText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {minLabel(totalTime)}
                          </ThemedText>
                        </View>
                      ) : null}
                      <View style={styles.metaItem}>
                        <Users size={12} color={colors.textSecondary} />
                        <ThemedText
                          style={[
                            styles.metaText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {recipe.servings}
                        </ThemedText>
                      </View>
                      {recipe.nutrition?.calories ? (
                        <View style={styles.metaItem}>
                          <Flame size={12} color={colors.textSecondary} />
                          <ThemedText
                            style={[
                              styles.metaText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {recipe.nutrition.calories} kcal
                          </ThemedText>
                        </View>
                      ) : null}
                      <ThemedText
                        style={[
                          styles.difficultyText,
                          { color: getDifficultyColor(recipe.difficulty) },
                        ]}
                      >
                        {difficultyTr}
                      </ThemedText>
                    </View>
                  </View>

                  <ChevronRight size={18} color={colors.textSecondary} />
                </Pressable>
              );
            })
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

const WARM_SHADOW = {
  shadowColor: '#3C2814',
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  backCta: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 18,
  },
  backCtaText: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' },

  // Hero
  hero: { position: 'relative', height: 220, width: '100%' },
  heroGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 64 },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  heroBtn: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(18,11,7,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRightBtns: {
    position: 'absolute',
    top: 56,
    right: spacing.lg,
    flexDirection: 'row',
    gap: 10,
  },
  heroBtnRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(18,11,7,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sheet
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 110,
  },
  kicker: { marginBottom: 8 },
  title: { marginBottom: 10 },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 4,
  },

  // Add recipe
  addRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 14,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  addRecipeButtonText: { fontFamily: fonts.bodySemibold, fontSize: 14 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  infoText: { fontFamily: fonts.bodyMedium, fontSize: 11 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl * 1.5 },
  emptyMark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { marginBottom: 6 },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Recipe row
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 11,
    ...WARM_SHADOW,
  },
  recipeImageContainer: {
    width: 74,
    height: 74,
    borderRadius: 14,
    overflow: 'hidden',
  },
  recipeImage: { width: '100%', height: '100%' },
  recipeImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfoContainer: { flex: 1, minWidth: 0, gap: 5 },
  recipeKicker: { fontSize: 9, letterSpacing: 1 },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 1,
    flexWrap: 'wrap',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.bodyMedium, fontSize: 11.5 },
  difficultyText: { fontFamily: fonts.bodySemibold, fontSize: 11.5 },
});

void palette;
