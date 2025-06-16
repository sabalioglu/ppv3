import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
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
  TrendingUp,
  Calendar,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';

const { width } = Dimensions.get('window');

// Mock recipe data
const mockRecipes = [
  {
    id: '1',
    title: 'Mediterranean Quinoa Bowl',
    description: 'A nutritious bowl packed with protein and fresh vegetables',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: 'Easy',
    calories: 420,
    protein: 18,
    carbs: 52,
    fat: 14,
    nutritionScore: 92,
    healthScore: 88,
    tags: ['Vegetarian', 'Gluten-Free', 'High-Protein'],
    cuisine: 'Mediterranean',
    isFavorite: true,
    rating: 4.8,
    reviews: 124,
    ingredients: ['Quinoa', 'Chickpeas', 'Cucumber', 'Tomatoes', 'Feta', 'Olive Oil'],
    availableIngredients: 5,
    totalIngredients: 6,
  },
  {
    id: '2',
    title: 'Grilled Salmon with Asparagus',
    description: 'Omega-3 rich salmon with perfectly grilled asparagus',
    image: 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg',
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'Medium',
    calories: 380,
    protein: 35,
    carbs: 8,
    fat: 22,
    nutritionScore: 95,
    healthScore: 94,
    tags: ['Keto', 'Low-Carb', 'High-Protein'],
    cuisine: 'American',
    isFavorite: false,
    rating: 4.6,
    reviews: 89,
    ingredients: ['Salmon', 'Asparagus', 'Lemon', 'Garlic', 'Olive Oil'],
    availableIngredients: 4,
    totalIngredients: 5,
  },
  {
    id: '3',
    title: 'Overnight Oats with Berries',
    description: 'Make-ahead breakfast loaded with fiber and antioxidants',
    image: 'https://images.pexels.com/photos/704971/pexels-photo-704971.jpeg',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'Easy',
    calories: 320,
    protein: 12,
    carbs: 58,
    fat: 8,
    nutritionScore: 85,
    healthScore: 82,
    tags: ['Vegetarian', 'Make-Ahead', 'High-Fiber'],
    cuisine: 'American',
    isFavorite: true,
    rating: 4.9,
    reviews: 256,
    ingredients: ['Oats', 'Greek Yogurt', 'Berries', 'Honey', 'Chia Seeds'],
    availableIngredients: 5,
    totalIngredients: 5,
  },
  {
    id: '4',
    title: 'Thai Green Curry',
    description: 'Aromatic and spicy curry with coconut milk and vegetables',
    image: 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg',
    prepTime: 20,
    cookTime: 25,
    servings: 4,
    difficulty: 'Hard',
    calories: 450,
    protein: 25,
    carbs: 35,
    fat: 28,
    nutritionScore: 78,
    healthScore: 75,
    tags: ['Spicy', 'Dairy-Free', 'Gluten-Free'],
    cuisine: 'Thai',
    isFavorite: false,
    rating: 4.7,
    reviews: 167,
    ingredients: ['Chicken', 'Coconut Milk', 'Green Curry Paste', 'Vegetables'],
    availableIngredients: 2,
    totalIngredients: 4,
  },
];

const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts'];
const dietTags = ['All', 'Vegetarian', 'Vegan', 'Keto', 'Low-Carb', 'High-Protein', 'Gluten-Free'];
const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

interface RecipeCardProps {
  recipe: typeof mockRecipes[0];
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

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage === 100) return colors.success[500];
    if (percentage >= 75) return colors.warning[500];
    return colors.error[500];
  };

  return (
    <TouchableOpacity style={styles.recipeCard} onPress={onPress}>
      <View style={styles.recipeImageContainer}>
        <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
        
        {/* Favorite Button */}
        <TouchableOpacity style={styles.favoriteButton} onPress={onFavorite}>
          <Heart
            size={20}
            color={recipe.isFavorite ? colors.error[500] : colors.neutral[0]}
            fill={recipe.isFavorite ? colors.error[500] : 'transparent'}
          />
        </TouchableOpacity>
        
        {/* Difficulty Badge */}
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
          <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
        </View>
        
        {/* Nutrition Score */}
        <View style={styles.nutritionScore}>
          <Text style={styles.nutritionScoreText}>{recipe.nutritionScore}</Text>
        </View>
      </View>
      
      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
        <Text style={styles.recipeDescription} numberOfLines={2}>{recipe.description}</Text>
        
        {/* Recipe Meta */}
        <View style={styles.recipeMeta}>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.neutral[500]} />
            <Text style={styles.metaText}>{recipe.prepTime + recipe.cookTime}m</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Users size={14} color={colors.neutral[500]} />
            <Text style={styles.metaText}>{recipe.servings}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Flame size={14} color={colors.neutral[500]} />
            <Text style={styles.metaText}>{recipe.calories} cal</Text>
          </View>
        </View>
        
        {/* Nutrition Info */}
        <View style={styles.nutritionInfo}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.protein}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.carbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.fat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>
        
        {/* Ingredient Availability */}
        <View style={styles.ingredientAvailability}>
          <View style={styles.availabilityIndicator}>
            <View
              style={[
                styles.availabilityBar,
                { backgroundColor: getAvailabilityColor(recipe.availableIngredients, recipe.totalIngredients) }
              ]}
            />
            <Text style={styles.availabilityText}>
              {recipe.availableIngredients}/{recipe.totalIngredients} ingredients available
            </Text>
          </View>
        </View>
        
        {/* Tags */}
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
        
        {/* Rating */}
        <View style={styles.recipeRating}>
          <Star size={14} color={colors.secondary[500]} fill={colors.secondary[500]} />
          <Text style={styles.ratingText}>{recipe.rating}</Text>
          <Text style={styles.reviewsText}>({recipe.reviews})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function Recipes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDiet, setSelectedDiet] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const filteredRecipes = mockRecipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiet = selectedDiet === 'All' || recipe.tags.includes(selectedDiet);
    const matchesDifficulty = selectedDifficulty === 'All' || recipe.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesDiet && matchesDifficulty;
  });

  const handleFavorite = (recipeId: string) => {
    console.log('Toggle favorite for recipe:', recipeId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipe Discovery</Text>
        <Text style={styles.headerSubtitle}>
          {filteredRecipes.length} recipes match your pantry
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
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <TrendingUp size={20} color={colors.primary[500]} />
          <Text style={styles.quickActionText}>Trending</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction}>
          <ChefHat size={20} color={colors.secondary[500]} />
          <Text style={styles.quickActionText}>AI Suggest</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction}>
          <Calendar size={20} color={colors.accent[500]} />
          <Text style={styles.quickActionText}>Meal Plan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction}>
          <Heart size={20} color={colors.error[500]} />
          <Text style={styles.quickActionText}>Favorites</Text>
        </TouchableOpacity>
      </View>

      {/* Recipes List */}
      <ScrollView
        style={styles.recipesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.recipesContent}
      >
        {filteredRecipes.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onPress={() => console.log('Recipe pressed:', recipe.title)}
            onFavorite={() => handleFavorite(recipe.id)}
          />
        ))}
      </ScrollView>

      {/* Add Recipe Button */}
      <TouchableOpacity style={styles.addButton}>
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
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  quickActionText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
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
  },
  recipeImage: {
    width: '100%',
    height: '100%',
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
  nutritionScore: {
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
  nutritionScoreText: {
    fontSize: typography.fontSize.sm,
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
  recipeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[700],
  },
  reviewsText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
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