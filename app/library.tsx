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
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Link,
  Camera,
  Heart,
  Clock,
  Users,
  ChefHat,
  Trash2,
  Edit3,
  ExternalLink,
  BookOpen,
  Tag,
  X,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

// **Recipe Interface (Supabase Schema Aligned)**
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
  created_at: string;
  updated_at: string;
}

// **Category Interface**
interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  count: number;
}

// **Recipe Categories (Database + User Defined)**
const systemCategories = [
  { name: 'All', color: colors.neutral[500], icon: 'grid' },
  { name: 'Meat', color: colors.error[500], icon: 'beef' },
  { name: 'Fish', color: colors.primary[500], icon: 'fish' },
  { name: 'Veggies', color: colors.success[500], icon: 'carrot' },
  { name: 'Breakfast', color: colors.warning[500], icon: 'coffee' },
  { name: 'Lunch', color: colors.accent[500], icon: 'sandwich' },
  { name: 'Dinner', color: colors.secondary[500], icon: 'utensils' },
  { name: 'Desserts', color: colors.error[400], icon: 'cake' },
  { name: 'Quick Meals', color: colors.primary[400], icon: 'zap' },
];

// **Recipe Card Component**
interface RecipeCardProps {
  recipe: Recipe;
  viewMode: 'grid' | 'list';
  onPress: () => void;
  onFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  viewMode, 
  onPress, 
  onFavorite, 
  onEdit, 
  onDelete 
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return colors.success[500];
      case 'Medium': return colors.warning[500];
      case 'Hard': return colors.error[500];
      default: return colors.neutral[500];
    }
  };

  if (viewMode === 'list') {
    return (
      <TouchableOpacity style={styles.listCard} onPress={onPress}>
        <View style={styles.listImageContainer}>
          {recipe.image_url ? (
            <Image source={{ uri: recipe.image_url }} style={styles.listImage} />
          ) : (
            <View style={styles.listPlaceholder}>
              <ChefHat size={24} color={colors.neutral[400]} />
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle} numberOfLines={1}>{recipe.title}</Text>
            <View style={styles.listActions}>
              <TouchableOpacity onPress={onFavorite} style={styles.listActionButton}>
                <Heart 
                  size={16} 
                  color={recipe.is_favorite ? colors.error[500] : colors.neutral[400]}
                  fill={recipe.is_favorite ? colors.error[500] : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onEdit} style={styles.listActionButton}>
                <Edit3 size={16} color={colors.neutral[400]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onDelete} style={styles.listActionButton}>
                <Trash2 size={16} color={colors.error[400]} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.listDescription} numberOfLines={2}>
            {recipe.description}
          </Text>

          <View style={styles.listMeta}>
            <View style={styles.listMetaItem}>
              <Clock size={12} color={colors.neutral[500]} />
              <Text style={styles.listMetaText}>
                {recipe.prep_time + recipe.cook_time}m
              </Text>
            </View>
            <View style={styles.listMetaItem}>
              <Users size={12} color={colors.neutral[500]} />
              <Text style={styles.listMetaText}>{recipe.servings}</Text>
            </View>
            <View style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
              <Text style={styles.difficultyChipText}>{recipe.difficulty}</Text>
            </View>
            {recipe.is_ai_generated && (
              <View style={styles.aiChip}>
                <Text style={styles.aiChipText}>AI</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress}>
      <View style={styles.gridImageContainer}>
        {recipe.image_url ? (
          <Image source={{ uri: recipe.image_url }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridPlaceholder}>
            <ChefHat size={32} color={colors.neutral[400]} />
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity style={styles.favoriteButton} onPress={onFavorite}>
          <Heart
            size={18}
            color={recipe.is_favorite ? colors.error[500] : colors.neutral[0]}
            fill={recipe.is_favorite ? colors.error[500] : 'transparent'}
          />
        </TouchableOpacity>

        {/* Badges */}
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
          <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
        </View>

        {recipe.is_ai_generated && (
          <View style={styles.aiBadge}>
            <Text style={styles.aiText}>AI</Text>
          </View>
        )}

        {recipe.source_url && (
          <View style={styles.sourceBadge}>
            <ExternalLink size={12} color={colors.neutral[0]} />
          </View>
        )}
      </View>

      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={2}>{recipe.title}</Text>
        <Text style={styles.gridDescription} numberOfLines={2}>
          {recipe.description}
        </Text>

        <View style={styles.gridMeta}>
          <View style={styles.gridMetaItem}>
            <Clock size={12} color={colors.neutral[500]} />
            <Text style={styles.gridMetaText}>
              {recipe.prep_time + recipe.cook_time}m
            </Text>
          </View>
          <View style={styles.gridMetaItem}>
            <Users size={12} color={colors.neutral[500]} />
            <Text style={styles.gridMetaText}>{recipe.servings}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.gridActions}>
          <TouchableOpacity onPress={onEdit} style={styles.gridActionButton}>
            <Edit3 size={14} color={colors.primary[500]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.gridActionButton}>
            <Trash2 size={14} color={colors.error[500]} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// **URL Import Modal Component**
const URLImportModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onImport: (url: string) => void;
}> = ({ visible, onClose, onImport }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setLoading(true);
    try {
      await onImport(url.trim());
      setUrl('');
      onClose();
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Import Recipe from URL</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Paste a link from TikTok, Instagram, Facebook, or any recipe website. 
            Our AI will extract the recipe details automatically.
          </Text>

          <View style={styles.urlInputContainer}>
            <Link size={20} color={colors.neutral[400]} />
            <TextInput
              style={styles.urlInput}
              placeholder="https://www.example.com/recipe"
              value={url}
              onChangeText={setUrl}
              placeholderTextColor={colors.neutral[400]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.importButton, loading && styles.importButtonDisabled]} 
              onPress={handleImport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.neutral[0]} />
              ) : (
                <Text style={styles.importButtonText}>Import Recipe</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// **Empty State Component**
const EmptyState: React.FC<{
  selectedCategory: string;
  onAddRecipe: () => void;
  onImportURL: () => void;
}> = ({ selectedCategory, onAddRecipe, onImportURL }) => {
  const getEmptyContent = () => {
    if (selectedCategory === 'All') {
      return {
        title: 'Build Your Recipe Library',
        subtitle: 'Start collecting your favorite recipes in one place',
        icon: BookOpen,
      };
    } else {
      return {
        title: `No ${selectedCategory} Recipes`,
        subtitle: `Add recipes to your ${selectedCategory.toLowerCase()} collection`,
        icon: ChefHat,
      };
    }
  };

  const content = getEmptyContent();

  return (
    <View style={styles.emptyStateContainer}>
      <content.icon size={64} color={colors.primary[500]} />
      <Text style={styles.emptyStateTitle}>{content.title}</Text>
      <Text style={styles.emptyStateSubtitle}>{content.subtitle}</Text>

      <View style={styles.emptyStateActions}>
        <TouchableOpacity style={styles.emptyActionButton} onPress={onAddRecipe}>
          <Plus size={20} color={colors.primary[500]} />
          <Text style={styles.emptyActionText}>Add Recipe</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.emptyActionButtonSecondary} onPress={onImportURL}>
          <Link size={20} color={colors.neutral[600]} />
          <Text style={styles.emptyActionTextSecondary}>Import from URL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// **Main Library Component**
export default function Library() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showURLImport, setShowURLImport] = useState(false);

  // **Load Data from Supabase**
  const loadLibraryData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/auth');
        return;
      }

      // Load recipes
      const { data: recipesData, error: recipesError } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (recipesError) {
        console.error('Error loading recipes:', recipesError);
        Alert.alert('Error', 'Failed to load recipes');
        return;
      }

      // Format recipes
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
        created_at: dbRecipe.created_at,
        updated_at: dbRecipe.updated_at,
      }));

      setRecipes(formattedRecipes);

      // Generate categories with counts
      const categoryMap = new Map();
      systemCategories.forEach(cat => {
        categoryMap.set(cat.name, { ...cat, count: 0 });
      });

      formattedRecipes.forEach(recipe => {
        const category = recipe.category || 'General';
        if (categoryMap.has(category)) {
          categoryMap.get(category).count++;
        } else {
          categoryMap.set(category, {
            name: category,
            color: colors.neutral[500],
            icon: 'tag',
            count: 1
          });
        }
      });

      // Set "All" count
      categoryMap.get('All').count = formattedRecipes.length;

      setCategories(Array.from(categoryMap.values()));

    } catch (error) {
      console.error('Error loading library data:', error);
      Alert.alert('Error', 'Failed to load library data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryData();
  }, []);

  // **Filter Recipes**
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

      setRecipes(prev => prev.map(r => 
        r.id === recipeId ? { ...r, is_favorite: newFavoriteStatus } : r
      ));
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  // **Delete Recipe**
  const handleDelete = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('user_recipes')
                .delete()
                .eq('id', recipeId);

              if (error) {
                Alert.alert('Error', 'Failed to delete recipe');
                return;
              }

              setRecipes(prev => prev.filter(r => r.id !== recipeId));
              await loadLibraryData(); // Refresh categories
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Alert.alert('Error', 'Failed to delete recipe');
            }
          }
        }
      ]
    );
  };

  // **URL Import Handler (OpenAI Integration)**
  const handleURLImport = async (url: string) => {
    try {
      // TODO: Implement OpenAI URL import
      // This is a placeholder for the OpenAI integration
      Alert.alert(
        'Import Feature',
        'URL import with AI extraction will be implemented in the next update. For now, please add recipes manually.',
        [{ text: 'OK' }]
      );
      
      console.log('URL Import requested:', url);
      // Future implementation:
      // 1. Call OpenAI API with URL
      // 2. Extract recipe data
      // 3. Show preview modal
      // 4. Save to database
    } catch (error) {
      console.error('URL import error:', error);
      Alert.alert('Error', 'Failed to import recipe from URL');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading your recipe library...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Recipe Library</Text>
          <Text style={styles.headerSubtitle}>
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in your collection
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton} 
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List size={20} color={colors.neutral[600]} />
            ) : (
              <Grid size={20} color={colors.neutral[600]} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Controls */}
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your recipes..."
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

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.name}
            style={[
              styles.categoryChip,
              selectedCategory === category.name && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category.name)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.name && styles.categoryChipTextActive
              ]}
            >
              {category.name} ({category.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Recipe Actions */}
      <View style={styles.addActions}>
        <TouchableOpacity 
          style={styles.addActionButton}
          onPress={() => router.push('/recipe-form')}
        >
          <Plus size={18} color={colors.primary[500]} />
          <Text style={styles.addActionText}>Add Recipe</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.addActionButtonSecondary}
          onPress={() => setShowURLImport(true)}
        >
          <Link size={18} color={colors.neutral[600]} />
          <Text style={styles.addActionTextSecondary}>Import URL</Text>
        </TouchableOpacity>
      </View>

      {/* Recipes List */}
      <ScrollView
        style={styles.recipesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.recipesContent,
          viewMode === 'grid' && styles.recipesGridContent
        ]}
      >
        {filteredRecipes.length > 0 ? (
          viewMode === 'grid' ? (
            <View style={styles.recipesGrid}>
              {filteredRecipes.map(recipe => (
                <View key={recipe.id} style={styles.gridCardContainer}>
                  <RecipeCard
                    recipe={recipe}
                    viewMode="grid"
                    onPress={() => console.log('Recipe pressed:', recipe.title)}
                    onFavorite={() => handleFavorite(recipe.id)}
                    onEdit={() => console.log('Edit recipe:', recipe.id)}
                    onDelete={() => handleDelete(recipe.id)}
                  />
                </View>
              ))}
            </View>
          ) : (
            filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                viewMode="list"
                onPress={() => console.log('Recipe pressed:', recipe.title)}
                onFavorite={() => handleFavorite(recipe.id)}
                onEdit={() => console.log('Edit recipe:', recipe.id)}
                onDelete={() => handleDelete(recipe.id)}
              />
            ))
          )
        ) : (
          <EmptyState
            selectedCategory={selectedCategory}
            onAddRecipe={() => router.push('/recipe-form')}
            onImportURL={() => setShowURLImport(true)}
          />
        )}
      </ScrollView>

      {/* URL Import Modal */}
      <URLImportModal
        visible={showURLImport}
        onClose={() => setShowURLImport(false)}
        onImport={handleURLImport}
      />

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.floatingAddButton}
        onPress={() => router.push('/recipe-form')}
      >
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
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
  categoriesContainer: {
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  categoriesContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.neutral[100],
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[500],
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
  },
  categoryChipTextActive: {
    color: colors.neutral[0],
  },
  addActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    gap: spacing.sm,
  },
  addActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  addActionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  addActionText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary[600],
  },
  addActionTextSecondary: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[600],
  },
  recipesContainer: {
    flex: 1,
  },
  recipesContent: {
    padding: spacing.lg,
  },
  recipesGridContent: {
    paddingBottom: 100, // Space for floating button
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  gridCardContainer: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
  },
  // Grid Card Styles
  gridCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.md,
  },
  gridImageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: colors.neutral[100],
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  difficultyText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: colors.neutral[0],
  },
  aiBadge: {
    position: 'absolute',
    top: spacing.sm + 24,
    left: spacing.sm,
    backgroundColor: colors.secondary[500],
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  aiText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    color: colors.neutral[0],
  },
  sourceBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    padding: spacing.md,
  },
  gridTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  gridDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
    marginBottom: spacing.sm,
  },
  gridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  gridMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gridMetaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[500],
  },
  gridActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  gridActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  // List Card Styles
  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  listImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.neutral[100],
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
  },
  listContent: {
    flex: 1,
    padding: spacing.md,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  listTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[800],
    marginRight: spacing.sm,
  },
  listActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  listActionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  listDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
    marginBottom: spacing.sm,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  listMetaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[500],
  },
  difficultyChip: {
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  difficultyChipText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: colors.neutral[0],
  },
  aiChip: {
    backgroundColor: colors.secondary[500],
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  aiChipText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    color: colors.neutral[0],
  },
  // Empty State Styles
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
    textAlign: 'center',
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
    fontFamily: 'Inter-SemiBold',
    color: colors.primary[600],
  },
  emptyActionTextSecondary: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[600],
  },
  // URL Import Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: 20,
    padding: spacing.lg,
    margin: spacing.lg,
    width: width - (spacing.lg * 2),
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Poppins-SemiBold',
    color: colors.neutral[800],
  },
  modalDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  urlInput: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[800],
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[600],
  },
  importButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  importButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  importButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[0],
  },
  floatingAddButton: {
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