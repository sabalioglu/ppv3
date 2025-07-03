import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
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
  Calendar,
  BookOpen,
  PlusCircle,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

// **Device-Specific Responsive Configuration**
const getDeviceConfig = () => {
  const isSmallDevice = width < 380;
  const isMediumDevice = width >= 380 && width < 430;
  const isLargeDevice = width >= 430;

  if (isSmallDevice) {
    return {
      iconSize: 18,
      fontSize: 11,
      padding: spacing.sm,
      gap: spacing.xs,
      useShortLabels: true,
      minHeight: 60,
    };
  } else if (isMediumDevice) {
    return {
      iconSize: 20,
      fontSize: 12,
      padding: spacing.md,
      gap: spacing.sm,
      useShortLabels: false,
      minHeight: 70,
    };
  } else {
    return {
      iconSize: 22,
      fontSize: 13,
      padding: spacing.md,
      gap: spacing.sm,
      useShortLabels: false,
      minHeight: 75,
    };
  }
};

// **Real Recipe Type (Supabase Schema Aligned)**
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
  ai_match_score?: number;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

// **Smart Quick Actions Configuration**
const quickActions = [
  {
    id: 'ai_suggest',
    icon: ChefHat,
    label: 'AI Suggest',
    shortLabel: 'AI',
    color: colors.secondary[500],
  },
  {
    id: 'meal_plan',
    icon: Calendar,
    label: 'Meal Plan',
    shortLabel: 'Plan',
    color: colors.accent[500],
  },
  {
    id: 'favorites',
    icon: Heart,
    label: 'Favorites',
    shortLabel: 'Fav',
    color: colors.error[500],
  },
  {
    id: 'library',
    icon: BookOpen,
    label: 'My Library',
    shortLabel: 'Library',
    color: colors.primary[500],
  }
];

// **Enhanced Quick Actions Handler**
const handleQuickAction = (actionId: string, setFilterMode: (mode: string) => void) => {
  switch (actionId) {
    case 'ai_suggest':
      console.log('🤖 AI Suggest activated - smart pantry matching');
      // Future: AI-powered recipe recommendations
      Alert.alert('AI Suggest', 'Smart recipe recommendations coming soon!');
      break;
    case 'meal_plan':
      console.log('📅 Meal Plan opened - weekly planning');
      Alert.alert('Meal Plan', 'Meal planning feature coming soon!');
      break;
    case 'favorites':
      console.log('❤️ Favorites filtered - show favorite recipes');
      setFilterMode('favorites');
      break;
    case 'library':
      console.log('📚 My Library opened - personal collection');
      router.push('/library');
      break;
    default:
      console.log('Unknown action:', actionId);
  }
};

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onFavorite: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onPress, onFavorite }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return colors.success[500];
      case 'Medium': return colors.warning[500];
      case 'Hard': return colors.error[500];
      default: return colors.neutral[500];
    }
  };

  // **Smart Pantry Availability (Future: Real Calculation)**
  const availableCount = recipe.ai_match_score ? Math.floor((recipe.ai_match_score / 100) * recipe.ingredients.length) : 0;
  const totalCount = recipe.ingredients.length;

  const getAvailabilityColor = (available: number, total: number) => {
    if (total === 0) return colors.neutral[500];
    const percentage = (available / total) * 100;
    if (percentage === 100) return colors.success[500];
    if (percentage >= 75) return colors.warning[500];
    return colors.error[500];
  };

  return (
    <TouchableOpacity style={styles.recipeCard} onPress={onPress}>
      <View style={styles.recipeImageContainer}>
        {recipe.image_url ? (
          <Image source={{ uri: recipe.image_url }} style={styles.recipeImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <ChefHat size={32} color={colors.neutral[400]} />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        
        {/* Favorite Button */}
        <TouchableOpacity style={styles.favoriteButton} onPress={onFavorite}>
          <Heart
            size={20}
            color={recipe.is_favorite ? colors.error[500] : colors.neutral[0]}
            fill={recipe.is_favorite ? colors.error[500] : 'transparent'}
          />
        </TouchableOpacity>
        
        {/* Difficulty Badge */}
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
          <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
        </View>
        
        {/* AI Badge */}
        {recipe.is_ai_generated && (
          <View style={styles.aiBadge}>
            <Text style={styles.aiText}>AI</Text>
          </View>
        )}
        
        {/* Match Score */}
        {recipe.ai_match_score !== undefined && (
          <View style={styles.matchScore}>
            <Text style={styles.matchScoreText}>{recipe.ai_match_score}%</Text>
          </View>
        )}
      </View>

      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
        <Text style={styles.recipeDescription} numberOfLines={2}>{recipe.description}</Text>

        {/* Recipe Meta */}
        <View style={styles.recipeMeta}>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.neutral[500]} />
            <Text style={styles.metaText}>{recipe.prep_time + recipe.cook_time}m</Text>
          </View>
          <View style={styles.metaItem}>
            <Users size={14} color={colors.neutral[500]} />
            <Text style={styles.metaText}>{recipe.servings}</Text>
          </View>
          {recipe.nutrition?.calories && (
            <View style={styles.metaItem}>
              <Flame size={14} color={colors.neutral[500]} />
              <Text style={styles.metaText}>{recipe.nutrition.calories} cal</Text>
            </View>
          )}
        </View>

        {/* Nutrition Info */}
        {recipe.nutrition && (
          <View style={styles.nutritionInfo}>
            {recipe.nutrition.protein !== undefined && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(recipe.nutrition.protein)}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
            )}
            {recipe.nutrition.carbs !== undefined && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(recipe.nutrition.carbs)}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
            )}
            {recipe.nutrition.fat !== undefined && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(recipe.nutrition.fat)}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            )}
          </View>
        )}

        {/* Ingredient Availability */}
        <View style={styles.ingredientAvailability}>
          <View style={styles.availabilityIndicator}>
            <View
              style={[
                styles.availabilityBar,
                { backgroundColor: getAvailabilityColor(availableCount, totalCount) }
              ]}
            />
            <Text style={styles.availabilityText}>
              {availableCount}/{totalCount} ingredients available
            </Text>
          </View>
        </View>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.recipeTags}>
            {recipe.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.recipeTag}>
                <Text style={styles.recipeTagText}>{tag}</Text>
              </View>
            ))}
            {recipe.tags.length > 2 && (
              <Text style={styles.moreTagsText}>+{recipe.tags.length - 2}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// **Smart Empty State Component**
const EmptyState = ({ filterMode, onAddRecipe }: { filterMode: string; onAddRecipe: () => void }) => {
  const getEmptyStateContent = () => {
    switch (filterMode) {
      case 'favorites':
        return {
          title: 'No Favorite Recipes',
          subtitle: 'Heart recipes you love to see them here',
          icon: Heart,
          color: colors.error[500],
        };
      default:
        return {
          title: 'No Recipes Found',
          subtitle: 'Start building your recipe collection',
          icon: ChefHat,
          color: colors.primary[500],
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <View style={styles.emptyStateContainer}>
      <content.icon size={64} color={content.color} />
      <Text style={styles.emptyStateTitle}>{content.title}</Text>
      <Text style={styles.emptyStateSubtitle}>{content.subtitle}</Text>
      
      <View style={styles.emptyStateActions}>
        <TouchableOpacity style={styles.emptyActionButton} onPress={onAddRecipe}>
          <PlusCircle size={20} color={colors.primary[500]} />
          <Text style={styles.emptyActionText}>Add Recipe</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.emptyActionButton, styles.secondaryButton]} 
          onPress={() => router.push('/library')}
        >
          <BookOpen size={20} color={colors.neutral[600]} />
          <Text style={[styles.emptyActionText, styles.secondaryText]}>My Library</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function Recipes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiet, setSelectedDiet] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'favorites'

  const deviceConfig = getDeviceConfig();

  const dietTags = ['All', 'Vegetarian', 'Vegan', 'Keto', 'Low-Carb', 'High-Protein', 'Gluten-Free'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  // **Load Recipes from Supabase**
  const loadRecipes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recipes:', error);
        Alert.alert('Error', 'Failed to load recipes');
        setRecipes([]);
      } else {
        const formattedRecipes: Recipe[] = (data || []).map(dbRecipe => ({
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
          ai_match_score: dbRecipe.ai_match_score,
          source_url: dbRecipe.source_url,
          created_at: dbRecipe.created_at,
          updated_at: dbRecipe.updated_at,
        }));
        setRecipes(formattedRecipes);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      Alert.alert('Error', 'Failed to load recipes');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  // **Filter Recipes**
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiet = selectedDiet === 'All' || recipe.tags.includes(selectedDiet);
    const matchesDifficulty = selectedDifficulty === 'All' || recipe.difficulty === selectedDifficulty;
    const matchesFilter = filterMode === 'all' || (filterMode === 'favorites' && recipe.is_favorite);

    return matchesSearch && matchesDiet && matchesDifficulty && matchesFilter;
  });

  // **Toggle Favorite**
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

      // Update local state
      setRecipes(prev => prev.map(r => 
        r.id === recipeId ? { ...r, is_favorite: newFavoriteStatus } : r
      ));
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  // **Add Recipe Handler**
  const handleAddRecipe = () => {
    router.push('/library');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipe Discovery</Text>
        <Text style={styles.headerSubtitle}>
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} 
          {filterMode === 'favorites' ? ' in favorites' : ' match your pantry'}
        </Text>
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
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Diet:</Text>
            <View style={styles.filterChips}>
              {dietTags.map(diet => (
                <TouchableOpacity
                  key={diet}
                  style={[
                    styles.filterChip,
                    selectedDiet === diet && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedDiet(diet)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedDiet === diet && styles.filterChipTextActive
                    ]}
                  >
                    {diet}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Difficulty:</Text>
            <View style={styles.filterChips}>
              {difficulties.map(difficulty => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.filterChip,
                    selectedDifficulty === difficulty && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedDifficulty(difficulty)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedDifficulty === difficulty && styles.filterChipTextActive
                    ]}
                  >
                    {difficulty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Quick Actions */}
      <View style={[styles.quickActions, { gap: deviceConfig.gap }]}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.quickAction,
              {
                padding: deviceConfig.padding,
                minHeight: deviceConfig.minHeight,
              },
              filterMode === action.id && styles.quickActionActive
            ]}
            onPress={() => handleQuickAction(action.id, setFilterMode)}
            activeOpacity={0.7}
          >
            <action.icon size={deviceConfig.iconSize} color={action.color} />
            <Text
              style={[
                styles.quickActionText,
                {
                  fontSize: deviceConfig.fontSize,
                  lineHeight: deviceConfig.fontSize * 1.3,
                }
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.75}
            >
              {deviceConfig.useShortLabels ? action.shortLabel : action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recipes List or Empty State */}
      <ScrollView
        style={styles.recipesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.recipesContent}
      >
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onPress={() => console.log('Recipe pressed:', recipe.title)}
              onFavorite={() => handleFavorite(recipe.id)}
            />
          ))
        ) : (
          <EmptyState filterMode={filterMode} onAddRecipe={handleAddRecipe} />
        )}
      </ScrollView>

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
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
    marginTop: spacing.md,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitle: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
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
    fontFamily: 'Inter-Regular',
    color: colors.neutral[800],
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  filtersContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  filterSection: {
    marginRight: spacing.xl,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.neutral[100],
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
  },
  filterChipTextActive: {
    color: colors.neutral[0],
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    marginHorizontal: 2,
  },
  quickActionActive: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  quickActionText: {
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
    textAlign: 'center',
    marginTop: 4,
  },
  recipesContainer: {
    flex: 1,
  },
  recipesContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  recipeCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.md,
  },
  recipeImageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: colors.neutral[100],
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
  },
  placeholderText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[400],
    marginTop: spacing.xs,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  difficultyText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Bold',
    color: colors.neutral[0],
  },
  aiBadge: {
    position: 'absolute',
    top: spacing.md + 32,
    left: spacing.md,
    backgroundColor: colors.secondary[500],
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  aiText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: colors.neutral[0],
  },
  matchScore: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: colors.success[500],
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchScoreText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Bold',
    color: colors.neutral[0],
  },
  recipeContent: {
    padding: spacing.lg,
  },
  recipeTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Poppins-SemiBold',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  recipeDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[800],
  },
  nutritionLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
  },
  ingredientAvailability: {
    marginBottom: spacing.md,
  },
  availabilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  availabilityBar: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  availabilityText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
  },
  recipeTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  recipeTag: {
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  recipeTagText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    color: colors.primary[600],
  },
  moreTagsText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[500],
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Poppins-SemiBold',
    color: colors.neutral[700],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
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
  secondaryButton: {
    backgroundColor: colors.neutral[100],
  },
  emptyActionText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary[600],
  },
  secondaryText: {
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