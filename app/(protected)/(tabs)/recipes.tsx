// app/(protected)/(tabs)/recipes.tsx — Stovd recipe library (Warm Kitchen).
// AI-generated recipe collection presented in the editorial cookbook language:
// cream paper, serif titles, FeatureCard hero + RecipeListCard rows. All data
// hooks, filters, cookbook logic and navigation are preserved from the original.
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Heart,
  Plus,
  Share2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  BookOpen,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { spacing, radius, fonts } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Display, Eyebrow } from '@/components/UI/Display';
import { SectionHeader } from '@/components/UI/SectionHeader';
import { FeatureCard, RecipeListCard } from '@/components/UI/RecipeCard';

// Recipe interface (aligned with Supabase schema)
interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
    notes?: string;
  }>;
  instructions: Array<{
    step: number;
    instruction: string;
    duration_mins?: number;
  }>;
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

// Filter Categories
interface FilterCategory {
  id: string;
  title: string;
  options: Array<{ id: string; label: string }>;
}

// Built per-render so labels follow the active locale.
function buildFilterCategories(): FilterCategory[] {
  return [
    {
      id: 'meal_type',
      title: t('recipes.filterMealType'),
      options: [
        { id: 'all', label: t('common.all') },
        { id: 'breakfast', label: t('recipes.mealBreakfast') },
        { id: 'lunch', label: t('recipes.mealLunch') },
        { id: 'dinner', label: t('recipes.mealDinner') },
        { id: 'snacks', label: t('recipes.mealSnacks') },
        { id: 'desserts', label: t('recipes.mealDesserts') },
      ],
    },
    {
      id: 'diet',
      title: t('recipes.filterDiet'),
      options: [
        { id: 'all', label: t('common.all') },
        { id: 'vegetarian', label: t('recipes.dietVegetarian') },
        { id: 'vegan', label: t('recipes.dietVegan') },
        { id: 'keto', label: t('recipes.dietKeto') },
        { id: 'low-carb', label: t('recipes.dietLowCarb') },
        { id: 'high-protein', label: t('recipes.dietHighProtein') },
        { id: 'gluten-free', label: t('recipes.dietGlutenFree') },
      ],
    },
    {
      id: 'difficulty',
      title: t('recipes.filterDifficulty'),
      options: [
        { id: 'all', label: t('common.all') },
        { id: 'easy', label: t('recipes.difficultyEasy') },
        { id: 'medium', label: t('recipes.difficultyMedium') },
        { id: 'hard', label: t('recipes.difficultyHard') },
      ],
    },
    {
      id: 'cook_time',
      title: t('recipes.filterCookTime'),
      options: [
        { id: 'all', label: t('common.all') },
        { id: 'under_15', label: t('recipes.timeUnder15') },
        { id: 'under_30', label: t('recipes.timeUnder30') },
        { id: 'under_60', label: t('recipes.timeUnder60') },
        { id: 'over_60', label: t('recipes.timeOver60') },
      ],
    },
  ];
}

function difficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'Easy':
      return t('recipes.difficultyEasy');
    case 'Medium':
      return t('recipes.difficultyMedium');
    case 'Hard':
      return t('recipes.difficultyHard');
    default:
      return difficulty;
  }
}

// Build the editorial kicker (category · difficulty) shown above a recipe title.
function kickerFor(recipe: Recipe) {
  return [recipe.category, difficultyLabel(recipe.difficulty)]
    .filter(Boolean)
    .join(' · ');
}
// Total cook time in minutes (undefined when we have no data).
function timeFor(recipe: Recipe) {
  const t = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  return t > 0 ? t : undefined;
}
// AI match score → whole percentage badge (undefined when unscored).
function matchFor(recipe: Recipe) {
  if (typeof recipe.ai_match_score !== 'number') return undefined;
  const pct =
    recipe.ai_match_score <= 1
      ? recipe.ai_match_score * 100
      : recipe.ai_match_score;
  return Math.round(pct);
}

// Quick Actions Dropdown Component (Warm Kitchen card)
const QuickActionsDropdown: React.FC<{
  onSocialPress: () => void;
  onAIRecipesPress: () => void;
  onLibraryPress: () => void;
  onFavoritesPress: () => void;
}> = ({
  onSocialPress,
  onAIRecipesPress,
  onLibraryPress,
  onFavoritesPress,
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const toggleDropdown = () => {
    const toValue = isOpen ? 0 : 1;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsOpen(!isOpen);
  };

  const animatedStyle = {
    maxHeight: animatedHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 320],
    }),
    opacity: animatedHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  };

  const rows: Array<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
  }> = [
    {
      icon: <Share2 size={18} color={colors.secondary} />,
      title: t('recipes.socialTitle'),
      subtitle: t('recipes.socialSubtitle'),
      onPress: onSocialPress,
    },
    {
      icon: <Sparkles size={18} color={colors.primary} />,
      title: t('recipes.aiRecipesTitle'),
      subtitle: t('recipes.aiRecipesSubtitle'),
      onPress: onAIRecipesPress,
    },
    {
      icon: <BookOpen size={18} color={colors.accent} />,
      title: t('recipes.libraryTitle'),
      subtitle: t('recipes.librarySubtitle'),
      onPress: onLibraryPress,
    },
    {
      icon: <Heart size={18} color={colors.error} />,
      title: t('recipes.favoritesTitle'),
      subtitle: t('recipes.favoritesSubtitle'),
      onPress: onFavoritesPress,
    },
  ];

  return (
    <View
      style={[
        styles.quickActions,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
      ]}
    >
      <TouchableOpacity
        style={styles.quickHeader}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <View style={styles.quickHeaderLeft}>
          <Eyebrow>{t('recipes.quickHeader')}</Eyebrow>
          <Text style={[styles.quickSubtitle, { color: colors.textSecondary }]}>
            {t('recipes.quickSubtitle')}
          </Text>
        </View>
        {isOpen ? (
          <ChevronUp size={20} color={colors.textSecondary} />
        ) : (
          <ChevronDown size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>

      <Animated.View style={[styles.quickContent, animatedStyle]}>
        {rows.map((row, i) => (
          <TouchableOpacity
            key={row.title}
            style={[
              styles.quickRow,
              { borderTopColor: colors.borderLight },
              i === 0 && { borderTopWidth: 0 },
            ]}
            onPress={row.onPress}
          >
            <View
              style={[styles.quickIcon, { backgroundColor: colors.background }]}
            >
              {row.icon}
            </View>
            <View style={styles.quickRowText}>
              <Text
                style={[styles.quickRowTitle, { color: colors.textPrimary }]}
              >
                {row.title}
              </Text>
              <Text
                style={[
                  styles.quickRowSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {row.subtitle}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

// Enhanced Filter Modal Component
const FilterModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  filters: { [key: string]: string };
  onFiltersChange: (filters: { [key: string]: string }) => void;
  recipeCount: number;
  userCookbooks: any[];
  selectedCookbook: string;
  onCookbookChange: (cookbookId: string) => void;
}> = ({
  visible,
  onClose,
  filters,
  onFiltersChange,
  recipeCount,
  userCookbooks,
  selectedCookbook,
  onCookbookChange,
}) => {
  const { colors } = useTheme();
  const [localFilters, setLocalFilters] = React.useState(filters);
  const [expandedCategories, setExpandedCategories] = React.useState<{
    [key: string]: boolean;
  }>({
    cookbook: true,
    meal_type: true,
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const updateFilter = (categoryId: string, optionId: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [categoryId]: optionId,
    }));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const clearAllFilters = () => {
    const clearedFilters = Object.keys(localFilters).reduce(
      (acc, key) => {
        acc[key] = 'all';
        return acc;
      },
      {} as { [key: string]: string },
    );
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onCookbookChange('all');
    onClose();
  };

  const renderOption = (
    label: string,
    selected: boolean,
    onPress: () => void,
    key: string,
    emoji?: string,
  ) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.filterOption,
        selected && { backgroundColor: colors.background },
      ]}
      onPress={onPress}
    >
      <View style={styles.filterOptionRow}>
        {emoji ? <Text style={styles.cookbookEmoji}>{emoji}</Text> : null}
        <Text
          style={[
            styles.filterOptionText,
            { color: selected ? colors.primary : colors.textSecondary },
            selected && { fontFamily: fonts.bodySemibold },
          ]}
        >
          {label}
        </Text>
      </View>
      {selected && <Check size={16} color={colors.primary} />}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView
        style={[
          styles.filterModalContainer,
          { backgroundColor: colors.background },
        ]}
        edges={['top']}
      >
        <View
          style={[
            styles.filterModalHeader,
            { borderBottomColor: colors.borderLight },
          ]}
        >
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Display size="sm" color={colors.textPrimary}>
            {t('recipes.filterTitle')}
          </Display>
          <TouchableOpacity onPress={clearAllFilters} hitSlop={8}>
            <Eyebrow color={colors.primary} style={styles.clearAllText}>
              {t('common.clear')}
            </Eyebrow>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.filterModalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cookbook Filter */}
          <View
            style={[
              styles.filterCategory,
              { borderBottomColor: colors.borderLight },
            ]}
          >
            <TouchableOpacity
              style={styles.filterCategoryHeader}
              onPress={() => toggleCategory('cookbook')}
            >
              <Display size="sm" color={colors.textPrimary}>
                {t('recipes.cookbookSection')}
              </Display>
              <ChevronDown
                size={20}
                color={colors.textSecondary}
                style={
                  expandedCategories.cookbook
                    ? styles.chevronExpanded
                    : undefined
                }
              />
            </TouchableOpacity>
            {expandedCategories.cookbook && (
              <View style={styles.filterOptionsContainer}>
                {renderOption(
                  t('recipes.allRecipes'),
                  selectedCookbook === 'all',
                  () => onCookbookChange('all'),
                  'cookbook-all',
                )}
                {userCookbooks.map((cookbook) =>
                  renderOption(
                    cookbook.name,
                    selectedCookbook === cookbook.id,
                    () => onCookbookChange(cookbook.id),
                    `cookbook-${cookbook.id}`,
                    cookbook.emoji,
                  ),
                )}
              </View>
            )}
          </View>

          {/* Existing Filter Categories */}
          {buildFilterCategories().map((category, categoryIndex) => (
            <View
              key={`filter-category-${category.id}-${categoryIndex}`}
              style={[
                styles.filterCategory,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <TouchableOpacity
                style={styles.filterCategoryHeader}
                onPress={() => toggleCategory(category.id)}
              >
                <Display size="sm" color={colors.textPrimary}>
                  {category.title}
                </Display>
                <ChevronDown
                  size={20}
                  color={colors.textSecondary}
                  style={
                    expandedCategories[category.id]
                      ? styles.chevronExpanded
                      : undefined
                  }
                />
              </TouchableOpacity>
              {expandedCategories[category.id] && (
                <View style={styles.filterOptionsContainer}>
                  {category.options.map((option, optionIndex) =>
                    renderOption(
                      option.label,
                      localFilters[category.id] === option.id,
                      () => updateFilter(category.id, option.id),
                      `${category.id}-${option.id}-${optionIndex}`,
                    ),
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View
          style={[
            styles.filterModalFooter,
            { borderTopColor: colors.borderLight },
          ]}
        >
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={applyFilters}
          >
            <Text style={styles.applyButtonText}>
              {t('recipes.showRecipes', { count: recipeCount })}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Empty State Component
const EmptyState: React.FC<{
  hasFilters: boolean;
  onAddRecipe: () => void;
  onClearFilters: () => void;
}> = ({ hasFilters, onAddRecipe, onClearFilters }) => {
  const { colors } = useTheme();

  if (hasFilters) {
    return (
      <View style={styles.emptyState}>
        <View
          style={[
            styles.emptyIcon,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <SlidersHorizontal size={30} color={colors.textSecondary} />
        </View>
        <Display size="md" color={colors.textPrimary} style={styles.emptyTitle}>
          {t('recipes.emptyFilteredTitle')}
        </Display>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {t('recipes.emptyFilteredSubtitle')}
        </Text>
        <View style={styles.emptyActions}>
          <TouchableOpacity
            style={[styles.emptyPrimary, { backgroundColor: colors.primary }]}
            onPress={onClearFilters}
          >
            <Text style={styles.emptyPrimaryText}>
              {t('recipes.clearFilters')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emptyGhost, { borderColor: colors.border }]}
            onPress={onAddRecipe}
          >
            <Plus size={18} color={colors.textPrimary} />
            <Text
              style={[styles.emptyGhostText, { color: colors.textPrimary }]}
            >
              {t('recipes.addRecipe')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
        <Sparkles size={30} color={colors.primary} />
      </View>
      <Display size="md" color={colors.textPrimary} style={styles.emptyTitle}>
        {t('recipes.emptyStartTitle')}
      </Display>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {t('recipes.emptyStartSubtitle')}
      </Text>
      <View style={styles.emptyActions}>
        <TouchableOpacity
          style={[styles.emptyPrimary, { backgroundColor: colors.primary }]}
          onPress={onAddRecipe}
        >
          <Plus size={18} color="#fff" />
          <Text style={styles.emptyPrimaryText}>
            {t('recipes.browseLibrary')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function Recipes() {
  const { colors } = useTheme();
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);

  // Cookbook filter states
  const [selectedCookbook, setSelectedCookbook] = React.useState('all');
  const [userCookbooks, setUserCookbooks] = React.useState<any[]>([]);

  const [filters, setFilters] = React.useState<{ [key: string]: string }>({
    meal_type: 'all',
    diet: 'all',
    cook_time: 'all',
    difficulty: 'all',
  });

  // Load user cookbooks
  const loadUserCookbooks = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cookbooks')
        .select('*, recipe_cookbooks(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserCookbooks(data || []);
    } catch (error) {
      console.error('Error loading cookbooks:', error);
    }
  };

  // Load recipes from Supabase
  const loadRecipes = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          t('recipes.loginRequiredTitle'),
          t('recipes.loginRequiredMessage'),
        );
        return;
      }

      const { data: recipesData, error } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_ai_generated', true) // SADECE AI RECIPES
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading recipes:', error);
        Alert.alert(t('recipes.loadErrorTitle'), t('recipes.loadErrorMessage'));
        return;
      }

      // Format recipes (aligned with Supabase schema)
      const formattedRecipes: Recipe[] = (recipesData || []).map(
        (dbRecipe) => ({
          id: dbRecipe.id,
          title: dbRecipe.title,
          description: dbRecipe.description || '',
          image_url: dbRecipe.image_url,
          prep_time: dbRecipe.prep_time || 0,
          cook_time: dbRecipe.cook_time || 0,
          servings: dbRecipe.servings || 1,
          difficulty: dbRecipe.difficulty || 'Easy',
          ingredients: dbRecipe.ingredients || [],
          instructions: dbRecipe.instructions || [],
          nutrition: dbRecipe.nutrition,
          tags: dbRecipe.tags || [],
          category: dbRecipe.category || 'General',
          is_favorite: dbRecipe.is_favorite || false,
          is_ai_generated: dbRecipe.is_ai_generated || false,
          source_url: dbRecipe.source_url,
          ai_match_score: dbRecipe.ai_match_score,
          created_at: dbRecipe.created_at,
          updated_at: dbRecipe.updated_at,
        }),
      );

      setRecipes(formattedRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
      Alert.alert(t('common.error'), t('recipes.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadRecipes();
    loadUserCookbooks();
  }, []);

  const applyFilters = async (recipesToFilter: Recipe[]) => {
    let filtered = [...recipesToFilter];

    // Cookbook filter
    if (selectedCookbook !== 'all') {
      const { data: cookbookRecipes } = await supabase
        .from('recipe_cookbooks')
        .select('recipe_id')
        .eq('cookbook_id', selectedCookbook);

      const recipeIds = cookbookRecipes?.map((cr) => cr.recipe_id) || [];
      filtered = filtered.filter((recipe) => recipeIds.includes(recipe.id));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(query) ||
          recipe.description?.toLowerCase().includes(query),
      );
    }

    // Meal type filter
    if (filters.meal_type !== 'all') {
      filtered = filtered.filter(
        (recipe) =>
          recipe.category.toLowerCase() === filters.meal_type.toLowerCase(),
      );
    }

    // Diet filter
    if (filters.diet !== 'all') {
      filtered = filtered.filter((recipe) =>
        recipe.tags.some((tag) =>
          tag.toLowerCase().includes(filters.diet.toLowerCase()),
        ),
      );
    }

    // Cook time filter
    if (filters.cook_time !== 'all') {
      const totalTime = (recipe: Recipe) => recipe.prep_time + recipe.cook_time;
      filtered = filtered.filter((recipe) => {
        const time = totalTime(recipe);
        switch (filters.cook_time) {
          case 'under_15':
            return time < 15;
          case 'under_30':
            return time < 30;
          case 'under_60':
            return time < 60;
          case 'over_60':
            return time >= 60;
          default:
            return true;
        }
      });
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(
        (recipe) =>
          recipe.difficulty.toLowerCase() === filters.difficulty.toLowerCase(),
      );
    }

    return filtered;
  };

  const [filteredRecipes, setFilteredRecipes] = React.useState<Recipe[]>([]);

  React.useEffect(() => {
    const filterRecipes = async () => {
      const filtered = await applyFilters(recipes);
      setFilteredRecipes(filtered);
    };
    filterRecipes();
  }, [recipes, searchQuery, filters, selectedCookbook]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.meal_type !== 'all') count++;
    if (filters.diet !== 'all') count++;
    if (filters.cook_time !== 'all') count++;
    if (filters.difficulty !== 'all') count++;
    if (selectedCookbook !== 'all') count++;
    return count;
  };

  const hasActiveFilters = getActiveFilterCount() > 0;

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      meal_type: 'all',
      diet: 'all',
      cook_time: 'all',
      difficulty: 'all',
    });
    setSelectedCookbook('all');
  };

  // Handle recipe press
  const handleRecipePress = (recipe: Recipe) => {
    console.log('Recipe pressed:', recipe.id);
    router.push(`/recipe/${recipe.id}`);
  };

  // Handle favorite toggle
  const handleFavorite = async (recipeId: string) => {
    try {
      const recipe = recipes.find((r) => r.id === recipeId);
      if (!recipe) return;

      const newFavoriteStatus = !recipe.is_favorite;

      const { error } = await supabase
        .from('user_recipes')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', recipeId);

      if (error) {
        Alert.alert(
          t('recipes.loadErrorTitle'),
          t('recipes.favoriteErrorMessage'),
        );
        return;
      }

      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId ? { ...r, is_favorite: newFavoriteStatus } : r,
        ),
      );
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert(t('common.error'), t('recipes.favoriteFailed'));
    }
  };

  // Handle add recipe (navigate to library)
  const handleAddRecipe = () => {
    router.push('/library');
  };

  // Quick Action handlers
  const handleSocialPress = () => {
    Alert.alert(t('recipes.comingSoonTitle'), t('recipes.comingSoonMessage'));
  };

  const handleAIRecipesPress = () => {
    router.push('/ai-meal-plan');
  };

  const handleLibraryPress = () => {
    router.push('/library');
  };

  const handleFavoritesPress = () => {
    const favoriteRecipes = recipes.filter((r) => r.is_favorite);
    if (favoriteRecipes.length === 0) {
      Alert.alert(
        t('recipes.noFavoritesTitle'),
        t('recipes.noFavoritesMessage'),
      );
    } else {
      setFilteredRecipes(favoriteRecipes);
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
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('recipes.loading')}
        </Text>
      </View>
    );
  }

  const [hero, ...rest] = filteredRecipes;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <Eyebrow>{t('recipes.eyebrow')}</Eyebrow>
        <Display size="xl" style={styles.title}>
          {t('recipes.title')}
        </Display>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {t('recipes.subtitle', { count: filteredRecipes.length })}
        </Text>

        {/* Search and Controls */}
        <View style={styles.controls}>
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder={t('recipes.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
              hasActiveFilters && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setShowFilters(true)}
          >
            <SlidersHorizontal
              size={18}
              color={hasActiveFilters ? '#fff' : colors.textSecondary}
            />
            {getActiveFilterCount() > 0 && (
              <View
                style={[styles.filterBadge, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.filterBadgeText}>
                  {getActiveFilterCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Actions Dropdown */}
        <QuickActionsDropdown
          onSocialPress={handleSocialPress}
          onAIRecipesPress={handleAIRecipesPress}
          onLibraryPress={handleLibraryPress}
          onFavoritesPress={handleFavoritesPress}
        />

        {/* Recipes */}
        {filteredRecipes.length > 0 ? (
          <View style={styles.list}>
            {hero ? (
              <View style={styles.heroWrap}>
                <FeatureCard
                  title={hero.title}
                  kicker={kickerFor(hero)}
                  chip={
                    hero.is_ai_generated
                      ? t('recipes.chipAi')
                      : t('recipes.chipRecipe')
                  }
                  imageUrl={hero.image_url ?? null}
                  matchPct={matchFor(hero)}
                  timeMin={timeFor(hero)}
                  saved={hero.is_favorite}
                  onPress={() => handleRecipePress(hero)}
                  onToggleSave={() => handleFavorite(hero.id)}
                />
              </View>
            ) : null}

            {rest.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title={t('recipes.sectionAll')} />
                {rest.map((recipe) => (
                  <RecipeListCard
                    key={recipe.id}
                    title={recipe.title}
                    kicker={kickerFor(recipe)}
                    imageUrl={recipe.image_url ?? null}
                    matchPct={matchFor(recipe)}
                    timeMin={timeFor(recipe)}
                    onPress={() => handleRecipePress(recipe)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <EmptyState
            hasFilters={hasActiveFilters}
            onAddRecipe={handleAddRecipe}
            onClearFilters={clearAllFilters}
          />
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        recipeCount={filteredRecipes.length}
        userCookbooks={userCookbooks}
        selectedCookbook={selectedCookbook}
        onCookbookChange={setSelectedCookbook}
      />

      {/* Add Recipe Button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
        ]}
        onPress={handleAddRecipe}
      >
        <Plus size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    paddingTop: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 15,
    marginTop: spacing.md,
  },
  title: { marginTop: 6, marginBottom: 6 },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    marginBottom: spacing.lg,
  },

  // Search + filter controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: '#fff',
  },

  // Quick actions
  quickActions: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#3C2814',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  quickHeaderLeft: { gap: 3 },
  quickSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12.5,
  },
  quickContent: { overflow: 'hidden' },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRowText: { flex: 1, paddingRight: spacing.xs, gap: 2 },
  quickRowTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: 14.5,
  },
  quickRowSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 17,
  },

  // Recipe list
  list: { marginTop: spacing.xs },
  heroWrap: { marginBottom: spacing.lg },
  section: { marginTop: spacing.md },

  // Filter modal
  filterModalContainer: { flex: 1 },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  clearAllText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    letterSpacing: 0,
    textTransform: 'none',
  },
  filterModalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  filterCategory: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  chevronExpanded: { transform: [{ rotate: '180deg' }] },
  filterOptionsContainer: { paddingTop: spacing.sm },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginVertical: 2,
    borderRadius: radius.sm,
  },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterOptionText: {
    fontFamily: fonts.body,
    fontSize: 15,
  },
  cookbookEmoji: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  filterModalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  applyButton: {
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: '#fff',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  emptyPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  emptyPrimaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: '#fff',
  },
  emptyGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  emptyGhostText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 15,
  },

  // FAB
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
