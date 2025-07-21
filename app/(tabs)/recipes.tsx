import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import {
  Search,
  Filter,
  Clock,
  Users,
  Star,
  ChefHat,
  Flame,
  Heart,
  Plus,
  Share2,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  Grid3X3,
  List,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { RecipeGrid } from '@/components/recipe/RecipeGrid';

const { width } = Dimensions.get('window');

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

// Filter Categories
interface FilterCategory {
  id: string;
  title: string;
  options: Array<{ id: string; label: string }>;
}

const filterCategories: FilterCategory[] = [
  {
    id: 'meal_type',
    title: 'Meal Type',
    options: [
      { id: 'all', label: 'All' },
      { id: 'breakfast', label: 'Breakfast' },
      { id: 'lunch', label: 'Lunch' },
      { id: 'dinner', label: 'Dinner' },
      { id: 'snacks', label: 'Snacks' },
      { id: 'desserts', label: 'Desserts' },
    ]
  },
  {
    id: 'diet',
    title: 'Diet',
    options: [
      { id: 'all', label: 'All' },
      { id: 'vegetarian', label: 'Vegetarian' },
      { id: 'vegan', label: 'Vegan' },
      { id: 'keto', label: 'Keto' },
      { id: 'low-carb', label: 'Low Carb' },
      { id: 'high-protein', label: 'High Protein' },
      { id: 'gluten-free', label: 'Gluten Free' },
    ]
  },
  {
    id: 'difficulty',
    title: 'Difficulty',
    options: [
      { id: 'all', label: 'All' },
      { id: 'easy', label: 'Easy' },
      { id: 'medium', label: 'Medium' },
      { id: 'hard', label: 'Hard' },
    ]
  },
  {
    id: 'cook_time',
    title: 'Cook Time',
    options: [
      { id: 'all', label: 'All' },
      { id: 'under_15', label: 'Under 15 min' },
      { id: 'under_30', label: 'Under 30 min' },
      { id: 'under_60', label: 'Under 60 min' },
      { id: 'over_60', label: 'Over 60 min' },
    ]
  }
];

// YENİ: Quick Actions Dropdown Component
const QuickActionsDropdown: React.FC<{
  onSocialPress: () => void;
  onAIRecipesPress: () => void;
  onLibraryPress: () => void;
  onFavoritesPress: () => void;
}> = ({ onSocialPress, onAIRecipesPress, onLibraryPress, onFavoritesPress }) => {
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
      outputRange: [0, 300], // Max height for dropdown content
    }),
    opacity: animatedHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  };

  return (
    <View style={styles.quickActionsDropdown}>
      <TouchableOpacity 
        style={styles.dropdownHeader}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownHeaderLeft}>
          {isOpen ? (
            <ChevronUp size={20} color={colors.neutral[600]} />
          ) : (
            <ChevronDown size={20} color={colors.neutral[600]} />
          )}
          <Text style={styles.dropdownTitle}>Quick Actions</Text>
        </View>
        <Text style={styles.dropdownSubtitle}>
          Discover • Import • Save
        </Text>
      </TouchableOpacity>

      <Animated.View style={[styles.dropdownContent, animatedStyle]}>
        <TouchableOpacity style={styles.dropdownItem} onPress={onSocialPress}>
          <View style={[styles.dropdownIcon, { backgroundColor: '#E8F5E9' }]}>
            <Share2 size={20} color="#4CAF50" />
          </View>
          <View style={styles.dropdownItemText}>
            <Text style={styles.dropdownItemTitle}>Social Media Import</Text>
            <Text style={styles.dropdownItemSubtitle}>
              Import from TikTok, Instagram
            </Text>
          </View>
          <ChevronRight size={20} color={colors.neutral[300]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dropdownItem} onPress={onAIRecipesPress}>
          <View style={[styles.dropdownIcon, { backgroundColor: '#FFF3E0' }]}>
            <ChefHat size={20} color="#FF9800" />
          </View>
          <View style={styles.dropdownItemText}>
            <Text style={styles.dropdownItemTitle}>AI Recipe Ideas</Text>
            <Text style={styles.dropdownItemSubtitle}>
              Get personalized suggestions
            </Text>
          </View>
          <ChevronRight size={20} color={colors.neutral[300]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dropdownItem} onPress={onLibraryPress}>
          <View style={[styles.dropdownIcon, { backgroundColor: '#E3F2FD' }]}>
            <Calendar size={20} color="#2196F3" />
          </View>
          <View style={styles.dropdownItemText}>
            <Text style={styles.dropdownItemTitle}>My Recipe Library</Text>
            <Text style={styles.dropdownItemSubtitle}>
              View your saved recipes
            </Text>
          </View>
          <ChevronRight size={20} color={colors.neutral[300]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.dropdownItem, styles.dropdownItemLast]} 
          onPress={onFavoritesPress}
        >
          <View style={[styles.dropdownIcon, { backgroundColor: '#FFEBEE' }]}>
            <Heart size={20} color="#F44336" />
          </View>
          <View style={styles.dropdownItemText}>
            <Text style={styles.dropdownItemTitle}>Favorite Recipes</Text>
            <Text style={styles.dropdownItemSubtitle}>
              Quick access to favorites
            </Text>
          </View>
          <ChevronRight size={20} color={colors.neutral[300]} />
        </TouchableOpacity>
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
}> = ({ visible, onClose, filters, onFiltersChange, recipeCount, userCookbooks, selectedCookbook, onCookbookChange }) => {
  const [localFilters, setLocalFilters] = React.useState(filters);
  const [expandedCategories, setExpandedCategories] = React.useState<{ [key: string]: boolean }>({
    cookbook: true,
    meal_type: true,
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const updateFilter = (categoryId: string, optionId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [categoryId]: optionId
    }));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const clearAllFilters = () => {
    const clearedFilters = Object.keys(localFilters).reduce((acc, key) => {
      acc[key] = 'all';
      return acc;
    }, {} as { [key: string]: string });
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onCookbookChange('all');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.filterModalContainer}>
        <View style={styles.filterModalHeader}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.neutral[600]} />
          </TouchableOpacity>
          <Text style={styles.filterModalTitle}>Filter Recipes</Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.filterModalContent} showsVerticalScrollIndicator={false}>
          {/* Cookbook Filter */}
          <View style={styles.filterCategoryContainer}>
            <TouchableOpacity
              style={styles.filterCategoryHeader}
              onPress={() => toggleCategory('cookbook')}
            >
              <Text style={styles.filterCategoryTitle}>Cookbook</Text>
              <ChevronDown
                size={20}
                color={colors.neutral[600]}
                style={[
                  styles.chevronIcon,
                  expandedCategories.cookbook && styles.chevronIconExpanded
                ]}
              />
            </TouchableOpacity>
            {expandedCategories.cookbook && (
              <View style={styles.filterOptionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    selectedCookbook === 'all' && styles.filterOptionSelected
                  ]}
                  onPress={() => onCookbookChange('all')}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedCookbook === 'all' && styles.filterOptionTextSelected
                    ]}
                  >
                    All Recipes
                  </Text>
                  {selectedCookbook === 'all' && (
                    <Check size={16} color={colors.primary[500]} />
                  )}
                </TouchableOpacity>
                {userCookbooks.map((cookbook) => (
                  <TouchableOpacity
                    key={cookbook.id}
                    style={[
                      styles.filterOption,
                      selectedCookbook === cookbook.id && styles.filterOptionSelected
                    ]}
                    onPress={() => onCookbookChange(cookbook.id)}
                  >
                    <View style={styles.filterOptionWithEmoji}>
                      <Text style={styles.cookbookEmoji}>{cookbook.emoji}</Text>
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedCookbook === cookbook.id && styles.filterOptionTextSelected
                        ]}
                      >
                        {cookbook.name}
                      </Text>
                    </View>
                    {selectedCookbook === cookbook.id && (
                      <Check size={16} color={colors.primary[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Existing Filter Categories */}
          {filterCategories.map((category, categoryIndex) => (
            <View key={`filter-category-${category.id}-${categoryIndex}`} style={styles.filterCategoryContainer}>
              <TouchableOpacity
                style={styles.filterCategoryHeader}
                onPress={() => toggleCategory(category.id)}
              >
                <Text style={styles.filterCategoryTitle}>{category.title}</Text>
                <ChevronDown
                  size={20}
                  color={colors.neutral[600]}
                  style={[
                    styles.chevronIcon,
                    expandedCategories[category.id] && styles.chevronIconExpanded
                  ]}
                />
              </TouchableOpacity>
              {expandedCategories[category.id] && (
                <View style={styles.filterOptionsContainer}>
                  {category.options.map((option, optionIndex) => {
                    const isSelected = localFilters[category.id] === option.id;
                    return (
                      <TouchableOpacity
                        key={`${category.id}-${option.id}-${optionIndex}`}
                        style={[
                          styles.filterOption,
                          isSelected && styles.filterOptionSelected
                        ]}
                        onPress={() => updateFilter(category.id, option.id)}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            isSelected && styles.filterOptionTextSelected
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isSelected && (
                          <Check size={16} color={colors.primary[500]} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        <View style={styles.filterModalFooter}>
          <TouchableOpacity style={styles.applyFiltersButton} onPress={applyFilters}>
            <Text style={styles.applyFiltersText}>
              Show {recipeCount} Recipe{recipeCount !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Empty State Component
const EmptyState: React.FC<{
  hasFilters: boolean;
  onAddRecipe: () => void;
  onClearFilters: () => void;
}> = ({ hasFilters, onAddRecipe, onClearFilters }) => {
  if (hasFilters) {
    return (
      <View style={styles.emptyStateContainer}>
        <Filter size={64} color={colors.neutral[400]} />
        <Text style={styles.emptyStateTitle}>No Recipes Found</Text>
        <Text style={styles.emptyStateSubtitle}>
          Try adjusting your filters or add new recipes to your collection
        </Text>
        <View style={styles.emptyStateActions}>
          <TouchableOpacity style={styles.emptyActionButton} onPress={onClearFilters}>
            <Text style={styles.emptyActionText}>Clear Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.emptyActionButtonSecondary} onPress={onAddRecipe}>
            <Plus size={20} color={colors.neutral[600]} />
            <Text style={styles.emptyActionTextSecondary}>Add Recipe</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.emptyStateContainer}>
      <ChefHat size={64} color={colors.primary[500]} />
      <Text style={styles.emptyStateTitle}>Start Your Recipe Collection</Text>
      <Text style={styles.emptyStateSubtitle}>
        Discover and save recipes that match your taste and pantry
      </Text>
      <View style={styles.emptyStateActions}>
        <TouchableOpacity style={styles.emptyActionButton} onPress={onAddRecipe}>
          <Plus size={20} color={colors.primary[500]} />
          <Text style={styles.emptyActionText}>Browse Library</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function Recipes() {
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  
  // VIEW MODE STATE
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  
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
      const { data: { user } } = await supabase.auth.getUser();
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to view recipes.');
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
        Alert.alert('Error', 'Failed to load recipes');
        return;
      }

      // Format recipes (aligned with Supabase schema)
      const formattedRecipes: Recipe[] = (recipesData || []).map(dbRecipe => ({
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
      }));

      setRecipes(formattedRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
      Alert.alert('Error', 'Failed to load recipes');
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
      // Cookbook'taki recipe ID'lerini al
      const { data: cookbookRecipes } = await supabase
        .from('recipe_cookbooks')
        .select('recipe_id')
        .eq('cookbook_id', selectedCookbook);

      const recipeIds = cookbookRecipes?.map(cr => cr.recipe_id) || [];
      filtered = filtered.filter(recipe => recipeIds.includes(recipe.id));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query)
      );
    }

    // Meal type filter
    if (filters.meal_type !== 'all') {
      filtered = filtered.filter(recipe => 
        recipe.category.toLowerCase() === filters.meal_type.toLowerCase()
      );
    }

    // Diet filter
    if (filters.diet !== 'all') {
      filtered = filtered.filter(recipe => 
        recipe.tags.some(tag => tag.toLowerCase().includes(filters.diet.toLowerCase()))
      );
    }

    // Cook time filter
    if (filters.cook_time !== 'all') {
      const totalTime = (recipe: Recipe) => recipe.prep_time + recipe.cook_time;
      filtered = filtered.filter(recipe => {
        const time = totalTime(recipe);
        switch (filters.cook_time) {
          case 'under_15': return time < 15;
          case 'under_30': return time < 30;
          case 'under_60': return time < 60;
          case 'over_60': return time >= 60;
          default: return true;
        }
      });
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(recipe => 
        recipe.difficulty.toLowerCase() === filters.difficulty.toLowerCase()
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
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;

      const newFavoriteStatus = !recipe.is_favorite;

      const { error } = await supabase
        .from('user_recipes')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', recipeId);

      if (error) {
        Alert.alert('Error', 'Failed to update favorite status');
        return;
      }

      setRecipes(prev => prev.map(r =>
        r.id === recipeId ? { ...r, is_favorite: newFavoriteStatus } : r
      ));
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  // Handle add recipe (navigate to library)
  const handleAddRecipe = () => {
    router.push('/library');
  };

  // Handle more options
  const handleMorePress = (recipe: Recipe) => {
    Alert.alert(
      recipe.title,
      'Recipe options',
      [
        { text: 'View Details', onPress: () => router.push(`/recipe/${recipe.id}`) },
        { text: 'Share', onPress: () => console.log('Share recipe') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // YENİ: Quick Action handlers
  const handleSocialPress = () => {
    Alert.alert('Coming Soon', 'Social recipes feature is coming soon!');
  };

  const handleAIRecipesPress = () => {
    // Show only AI generated recipes
    const aiRecipes = recipes.filter(r => r.is_ai_generated);
    setRecipes(aiRecipes);
  };

  const handleLibraryPress = () => {
    router.push('/library');
  };

  const handleFavoritesPress = () => {
    // Show only favorites
    const favoriteRecipes = recipes.filter(r => r.is_favorite);
    if (favoriteRecipes.length === 0) {
      Alert.alert('No Favorites', 'You haven\'t favorited any recipes yet!');
    } else {
      setFilteredRecipes(favoriteRecipes);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading your recipes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with View Toggle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>AI Recipe Discovery</Text>
          <Text style={styles.headerSubtitle}>
            {filteredRecipes.length} AI-generated recipes
          </Text>
        </View>
        
        {/* VIEW MODE TOGGLE */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'grid' && styles.activeToggle
            ]}
            onPress={() => setViewMode('grid')}
          >
            <Grid3X3 
              size={20} 
              color={viewMode === 'grid' ? colors.primary[500] : colors.neutral[400]} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && styles.activeToggle
            ]}
            onPress={() => setViewMode('list')}
          >
            <List 
              size={20} 
              color={viewMode === 'list' ? colors.primary[500] : colors.neutral[400]} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Controls */}
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.neutral[400]}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={20} color={hasActiveFilters ? colors.primary[500] : colors.neutral[600]} />
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* YENİ: Quick Actions Dropdown */}
      <QuickActionsDropdown
        onSocialPress={handleSocialPress}
        onAIRecipesPress={handleAIRecipesPress}
        onLibraryPress={handleLibraryPress}
        onFavoritesPress={handleFavoritesPress}
      />

      {/* Recipes List/Grid */}
      <ScrollView
        style={styles.recipesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.recipesContent}
      >
        {filteredRecipes.length > 0 ? (
          <RecipeGrid
            recipes={filteredRecipes}
            viewMode={viewMode}
            onRecipePress={handleRecipePress}
            onFavoritePress={handleFavorite}
            onMorePress={handleMorePress}
          />
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
      <TouchableOpacity style={styles.addButton} onPress={handleAddRecipe}>
        <Plus size={28} color={colors.neutral[0]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[600],
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-Bold',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[600],
  },
  
  // VIEW TOGGLE STYLES
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: 8,
    padding: 2,
    marginLeft: spacing.md,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: colors.neutral[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[0],
    gap: spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[800],
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: colors.primary[50],
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.neutral[0],
  },

  // YENİ: Quick Actions Dropdown Styles
  quickActionsDropdown: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  dropdownSubtitle: {
    fontSize: 13,
    color: colors.neutral[500],
  },
  dropdownContent: {
    backgroundColor: colors.neutral[50],
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dropdownItemText: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  dropdownItemSubtitle: {
    fontSize: 13,
    color: colors.neutral[500],
  },
  
  // Filter Modal Styles
  filterModalContainer: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  filterModalTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-SemiBold',
    fontWeight: '600',
    color: colors.neutral[800],
  },
  clearAllText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.primary[500],
  },
  filterModalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  filterCategoryContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  filterCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  filterCategoryTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[800],
  },
  chevronIcon: {
    transform: [{ rotate: '0deg' }],
  },
  chevronIconExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  filterOptionsContainer: {
    paddingTop: spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginVertical: 2,
    borderRadius: 8,
  },
  filterOptionSelected: {
    backgroundColor: colors.primary[50],
  },
  filterOptionText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[700],
  },
  filterOptionTextSelected: {
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.primary[600],
  },
  filterOptionWithEmoji: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cookbookEmoji: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  filterModalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  applyFiltersButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[0],
  },

  recipesContainer: {
    flex: 1,
  },
  recipesContent: {
    paddingBottom: spacing.xl * 2, // Extra space for floating button
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-SemiBold',
    color: colors.neutral[700],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyStateActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  emptyActionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  emptyActionText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    color: colors.primary[600],
  },
  emptyActionTextSecondary: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    color: colors.neutral[600],
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});