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
  Heart,
  Clock,
  Users,
  ChefHat,
  Trash2,
  Edit3,
  ExternalLink,
  BookOpen,
  X,
  Flame,
  ChevronDown,
  Check,
  Camera,
  Video,
  Globe,
  FileText,
  Book,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '../../lib/theme';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

// **Cookbook Imports**
import { Cookbook } from '../../types/cookbook';
import { CookbookBottomSheet } from './modals/CookbookBottomSheet';
import { EditCookbookBottomSheet } from './modals/EditCookbookBottomSheet';
// **Recipe AI Service Imports**
import { extractRecipeFromUrl, ExtractedRecipeData } from '../../lib/recipeAIService';
import { extractVideoRecipe, detectVideoPlatform } from '../../lib/supabase-functions';

// **Import the hook**
import { useCookbookManager } from '../../hooks/useCookbookManager';

const { width, height } = Dimensions.get('window');

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
    sugar?: number;
    sodium?: number;
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

// **Enhanced Filter Categories**
interface FilterCategory {
  id: string;
  title: string;
  options: Array<{ id: string; label: string; count?: number }>;
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
      { id: 'low_carb', label: 'Low Carb' },
      { id: 'high_protein', label: 'High Protein' },
      { id: 'gluten_free', label: 'Gluten Free' },
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
    id: 'cuisine',
    title: 'Cuisine',
    options: [
      { id: 'all', label: 'All' },
      { id: 'american', label: 'American' },
      { id: 'asian', label: 'Asian' },
      { id: 'mediterranean', label: 'Mediterranean' },
      { id: 'italian', label: 'Italian' },
      { id: 'mexican', label: 'Mexican' },
      { id: 'indian', label: 'Indian' },
    ]
  }
];

// **Updated Import Categories**
interface ImportCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
}

const importCategories: ImportCategory[] = [
  {
    id: 'web',
    name: 'Web',
    icon: Globe,
    color: colors.primary[500],
    description: 'Recipe websites & blogs',
  },
  {
    id: 'socials',
    name: 'Socials',
    icon: Video,
    color: colors.secondary[500],
    description: 'Social media videos',
  },
  {
    id: 'camera',
    name: 'Camera',
    icon: Camera,
    color: colors.accent[500],
    description: 'Scan from cookbook',
  },
  {
    id: 'manual',
    name: 'Manual',
    icon: FileText,
    color: colors.neutral[600],
    description: 'Type it yourself',
  }
];

// **Bulk Actions Bottom Sheet Component**
const BulkActionsBottomSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  selectedRecipeIds: string[];
  onCookbooksUpdated: () => void;
}> = ({ visible, onClose, selectedRecipeIds, onCookbooksUpdated }) => {
  const [cookbooks, setCookbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCookbooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cookbooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCookbooks(data || []);
    } catch (error) {
      console.error('Error loading cookbooks:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCookbooks();
    }
  }, [visible]);

  const handleBulkAdd = async (cookbookId: string) => {
    try {
      setLoading(true);
      
      // Check existing entries to avoid duplicates
      const { data: existing } = await supabase
        .from('recipe_cookbooks')
        .select('recipe_id')
        .eq('cookbook_id', cookbookId)
        .in('recipe_id', selectedRecipeIds);

      const existingIds = existing?.map(e => e.recipe_id) || [];
      const newRecipeIds = selectedRecipeIds.filter(id => !existingIds.includes(id));

      if (newRecipeIds.length === 0) {
        Alert.alert('Info', 'All selected recipes are already in this cookbook');
        return;
      }

      const insertData = newRecipeIds.map(recipeId => ({
        recipe_id: recipeId,
        cookbook_id: cookbookId
      }));

      const { error } = await supabase
        .from('recipe_cookbooks')
        .insert(insertData);

      if (error) throw error;

      Alert.alert('Success', `Added ${newRecipeIds.length} recipes to cookbook`);
      onCookbooksUpdated();
    } catch (error) {
      console.error('Error adding recipes to cookbook:', error);
      Alert.alert('Error', 'Failed to add recipes to cookbook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.bulkModalOverlay}>
        <View style={styles.bulkModalContainer}>
          <View style={styles.bulkModalHeader}>
            <Text style={styles.bulkModalTitle}>
              Add {selectedRecipeIds.length} recipes to cookbook
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.bulkModalContent}>
            {cookbooks.map((cookbook) => (
              <TouchableOpacity
                key={cookbook.id}
                style={styles.bulkCookbookItem}
                onPress={() => handleBulkAdd(cookbook.id)}
                disabled={loading}
              >
                <Text style={styles.bulkCookbookEmoji}>{cookbook.emoji}</Text>
                <View style={styles.bulkCookbookInfo}>
                  <Text style={styles.bulkCookbookName}>{cookbook.name}</Text>
                  <Text style={styles.bulkCookbookDescription}>{cookbook.description}</Text>
                </View>
                {loading && <ActivityIndicator size="small" color={colors.primary[500]} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// **Import Categories Modal Component**
const ImportCategoriesModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelect: (categoryId: string) => void;
}> = ({ visible, onClose, onSelect }) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity 
        style={styles.importModalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.importModalContainer}>
          <View style={styles.importModalHeader}>
            <Text style={styles.importModalTitle}>Add Recipe</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.importModalContent}>
            {importCategories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <TouchableOpacity
                  key={`import-${category.id}-${index}`}
                  style={[
                    styles.importModalItem,
                    index === importCategories.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => {
                    onSelect(category.id);
                    onClose();
                  }}
                >
                  <View style={[styles.importModalIcon, { backgroundColor: `${category.color}15` }]}>
                    <IconComponent size={24} color={category.color} />
                  </View>
                  <View style={styles.importModalTextContainer}>
                    <Text style={styles.importModalItemTitle}>{category.name}</Text>
                    <Text style={styles.importModalItemDescription}>{category.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// **Manual Recipe Form Modal Component**
const ManualRecipeModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSave: (recipe: any) => void;
}> = ({ visible, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prep_time: '',
    cook_time: '',
    servings: '',
    difficulty: 'Easy',
    category: 'Lunch',
    ingredients: '',
    instructions: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      prep_time: '',
      cook_time: '',
      servings: '',
      difficulty: 'Easy',
      category: 'Lunch',
      ingredients: '',
      instructions: '',
      tags: '',
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Recipe title is required');
      return;
    }
    if (!formData.ingredients.trim()) {
      Alert.alert('Error', 'Ingredients are required');
      return;
    }
    if (!formData.instructions.trim()) {
      Alert.alert('Error', 'Instructions are required');
      return;
    }

    setLoading(true);
    try {
      const ingredientsList = formData.ingredients
        .split('\n')
        .filter(line => line.trim())
        .map((line, index) => ({
          name: line.trim(),
          quantity: '',
          unit: '',
          notes: ''
        }));

      const instructionsList = formData.instructions
        .split('\n')
        .filter(line => line.trim())
        .map((line, index) => ({
          step: index + 1,
          instruction: line.trim(),
          duration_mins: undefined
        }));

      const tagsList = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

      const recipeData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        prep_time: parseInt(formData.prep_time) || 0,
        cook_time: parseInt(formData.cook_time) || 0,
        servings: parseInt(formData.servings) || 1,
        difficulty: formData.difficulty,
        category: formData.category,
        ingredients: ingredientsList,
        instructions: instructionsList,
        tags: tagsList,
        is_ai_generated: false,
        is_favorite: false,
      };

      await onSave(recipeData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.manualRecipeContainer}>
        <View style={styles.manualRecipeHeader}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.neutral[600]} />
          </TouchableOpacity>
          <Text style={styles.manualRecipeTitle}>Add Recipe Manually</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.manualRecipeContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Basic Information</Text>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Recipe Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter recipe title..."
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Brief description of the recipe..."
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={styles.formLabel}>Prep Time (min)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="15"
                  value={formData.prep_time}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, prep_time: text }))}
                  placeholderTextColor={colors.neutral[400]}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.formLabel}>Cook Time (min)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="30"
                  value={formData.cook_time}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, cook_time: text }))}
                  placeholderTextColor={colors.neutral[400]}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={styles.formLabel}>Servings</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="4"
                  value={formData.servings}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, servings: text }))}
                  placeholderTextColor={colors.neutral[400]}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.formLabel}>Difficulty</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['Easy', 'Medium', 'Hard'].map((level, levelIndex) => (
                      <TouchableOpacity
                        key={`difficulty-${level}-${levelIndex}`}
                        style={[
                          styles.pickerOption,
                          formData.difficulty === level && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, difficulty: level }))}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            formData.difficulty === level && styles.pickerOptionTextSelected
                          ]}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts'].map((cat, catIndex) => (
                    <TouchableOpacity
                      key={`category-${cat}-${catIndex}`}
                      style={[
                        styles.pickerOption,
                        formData.category === cat && styles.pickerOptionSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, category: cat }))}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          formData.category === cat && styles.pickerOptionTextSelected
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Ingredients *</Text>
            <Text style={styles.formHint}>Enter each ingredient on a new line</Text>
            <TextInput
              style={[styles.formInput, styles.textArea, { height: 120 }]}
              placeholder="1 cup flour&#10;2 eggs&#10;1/2 cup milk&#10;Salt to taste"
              value={formData.ingredients}
              onChangeText={(text) => setFormData(prev => ({ ...prev, ingredients: text }))}
              placeholderTextColor={colors.neutral[400]}
              multiline
              textAlignVertical="top"
            />
          </View>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Instructions *</Text>
            <Text style={styles.formHint}>Enter each step on a new line</Text>
            <TextInput
              style={[styles.formInput, styles.textArea, { height: 150 }]}
              placeholder="Preheat oven to 350F&#10;Mix dry ingredients in a bowl&#10;Add wet ingredients and stir&#10;Bake for 25-30 minutes"
              value={formData.instructions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
              placeholderTextColor={colors.neutral[400]}
              multiline
              textAlignVertical="top"
            />
          </View>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Tags</Text>
            <Text style={styles.formHint}>Separate tags with commas</Text>
            <TextInput
              style={styles.formInput}
              placeholder="vegetarian, quick, healthy, comfort food"
              value={formData.tags}
              onChangeText={(text) => setFormData(prev => ({ ...prev, tags: text }))}
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// **Enhanced Filter Modal Component**
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
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
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

// **Enhanced URL Import Modal with Edge Functions**
const URLImportModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onImport: (url: string) => void;
  selectedSource?: string;
  loading: boolean;
}> = ({ visible, onClose, onImport, selectedSource, loading }) => {
  const [url, setUrl] = useState('');
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState('Our AI chef is cooking up your recipe...');

  const getLoadingMessages = (url: string) => {
    const baseMessages = [
  "AI chef is cooking...",
  "Scanning ingredients...",
  "Teaching robots to cook...",
  "Brewing digital coffee...",
  "Finding recipe image...",
  "Cleaning digital crumbs...",
  "Reading recipe wisdom...",
  "Faster than slow cooking!",
  "Almost ready to serve!",
  "Adding AI magic..."
];

const platformMessages: { [key: string]: string[] } = {
  tiktok: [
    "🎬 Analyzing TikTok...",
    "👨‍🍳 Following chef...",
    "📝 Taking notes...",
    "🔥 Learning techniques..."
  ],
  instagram: [
    "📸 Processing Reel...",
    "✨ Extracting recipe...",
    "🥘 Preparing list...",
    "📱 Reading notes..."
  ],
  youtube: [
    "🎥 Examining video...",
    "📊 Scanning description...",
    "⏱️ Recording steps...",
    "🎯 Analyzing quality..."
  ],
  facebook: [
    "📘 Processing video...",
    "👥 Collecting tips...",
    "📹 Optimizing quality...",
    "🍳 Combining details..."
  ],
  web: [
    "🌐 Scanning website...",
    "📖 Reading ingredients...",
    "👩‍🍳 Extracting steps...",
    "🎨 Finding image..."
  ]
};

    let platform = selectedSource || 'web';
    if (url.includes('tiktok.com') || url.includes('vt.tiktok.com')) platform = 'tiktok';
    else if (url.includes('instagram.com')) platform = 'instagram';
    else if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
    else if (url.includes('facebook.com') || url.includes('fb.watch')) platform = 'facebook';

    const specificMessages = platformMessages[platform] || platformMessages.web;
    return [...specificMessages, ...baseMessages].slice(0, 8);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading && url) {
      const messages = getLoadingMessages(url);
      let messageIndex = 0;
      setCurrentLoadingMessage(messages[0]);
      
      interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setCurrentLoadingMessage(messages[messageIndex]);
      }, 2500);
    } else {
      setCurrentLoadingMessage('Our AI chef is cooking up your recipe...');
    }
    return () => clearInterval(interval);
  }, [loading, url]);

  const getSourceInfo = () => {
    if (selectedSource === 'web') {
      return { name: 'Website', color: colors.primary[500], description: 'Any recipe website' };
    }
    if (selectedSource === 'socials') {
      return { name: 'Social Media', color: colors.secondary[500], description: 'TikTok, Instagram, YouTube, Facebook' };
    }
    return { name: 'Website', color: colors.primary[500], description: 'Any recipe website' };
  };

  const sourceInfo = getSourceInfo();

  const handleImport = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }
    try {
      await onImport(url.trim());
      setUrl('');
      onClose();
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const clearInput = () => {
    setUrl('');
  };

  const getPlaceholderUrl = () => {
    if (selectedSource === 'web') return 'https://example.com/recipe';
    if (selectedSource === 'socials') return 'https://tiktok.com/@user/video/...';
    return 'https://example.com/recipe';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.urlModalOverlay}>
        <View style={styles.urlModalContainer}>
          <View style={styles.urlModalHeader}>
            <View style={styles.urlModalTitleContainer}>
              <View style={[styles.urlModalIconContainer, { backgroundColor: `${sourceInfo.color}15` }]}>
                <Link size={24} color={sourceInfo.color} />
              </View>
              <View>
                <Text style={styles.urlModalTitle}>Import from {sourceInfo.name}</Text>
                <Text style={styles.urlModalSubtitle}>{sourceInfo.description}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.urlModalCloseButton}>
              <X size={20} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.urlModalDescription}>
            Paste a link from {sourceInfo.name} and our AI will automatically extract the recipe details,
            including ingredients, instructions, and nutritional information.
          </Text>

          <View style={styles.urlInputWrapper}>
            <View style={styles.urlInputContainer}>
              <TextInput
                style={styles.urlInput}
                placeholder={getPlaceholderUrl()}
                value={url}
                onChangeText={setUrl}
                placeholderTextColor={colors.neutral[400]}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                multiline={false}
                returnKeyType="done"
              />
              {url.length > 0 && (
                <TouchableOpacity onPress={clearInput} style={styles.clearInputButton}>
                  <X size={16} color={colors.neutral[400]} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.exampleUrlsContainer}>
            <Text style={styles.exampleUrlsTitle}>
              {selectedSource === 'socials' ? 'Supported channels:' : 'Supported formats:'}
            </Text>
            <Text style={styles.exampleUrlsText}>
              {selectedSource === 'web' && '- Recipe posts and articles\n- Food blog recipes\n- Cooking websites\n- Recipe sharing platforms'}
              {selectedSource === 'socials' && '- TikTok video recipes\n- Instagram Reels & posts\n- YouTube cooking videos\n- Facebook recipe videos'}
            </Text>
          </View>

          <View style={styles.urlModalActions}>
            <TouchableOpacity style={styles.urlCancelButton} onPress={onClose}>
              <Text style={styles.urlCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.urlImportButton,
                (!url.trim() || loading) && styles.urlImportButtonDisabled
              ]}
              onPress={handleImport}
              disabled={!url.trim() || loading}
            >
              {loading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color={colors.neutral[0]} />
                  <Text style={styles.urlImportButtonText} numberOfLines={2}>
                    {currentLoadingMessage}
                  </Text>
                </View>
              ) : (
                <>
                  <Link size={16} color={colors.neutral[0]} />
                  <Text style={styles.urlImportButtonText}>Import Recipe</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// **Recipe Card Component**
interface RecipeCardProps {
  recipe: Recipe;
  viewMode: 'grid' | 'list';
  onPress: () => void;
  onFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddToCookbook: () => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  viewMode,
  onPress,
  onFavorite,
  onEdit,
  onDelete,
  onAddToCookbook,
  isEditMode,
  isSelected,
  onSelect,
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return colors.success[500];
      case 'Medium': return colors.warning[500];
      case 'Hard': return colors.error[500];
      default: return colors.neutral[500];
    }
  };

  const handlePress = () => {
    if (isEditMode && onSelect) {
      onSelect();
    } else if (!isEditMode) {
      onPress();
    }
  };

  if (viewMode === 'list') {
    return (
      <TouchableOpacity 
        style={[
          styles.listCard, 
          isEditMode && isSelected && styles.selectedCard
        ]} 
        onPress={handlePress}
      >
        <View style={styles.listCardContent}>
          {/* Edit mode checkbox */}
          {isEditMode && (
            <View style={styles.listCheckbox}>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
            </View>
          )}
          
          {recipe.image_url ? (
            <Image 
              source={{ 
                uri: recipe.source_url?.includes('instagram.com') 
                  ? `https://images.weserv.nl/?url=${encodeURIComponent(recipe.image_url)}&w=300&h=200&fit=cover&maxage=7d`
                  : recipe.image_url 
              }} 
              style={styles.listCardImage}
            />
          ) : (
            <View style={[styles.listCardImage, { backgroundColor: colors.neutral[100], justifyContent: 'center', alignItems: 'center' }]}>
              <ChefHat size={24} color={colors.neutral[400]} />
            </View>
          )}
          
          <View style={styles.listCardInfo}>
            <Text style={styles.listCardTitle} numberOfLines={1}>
              {recipe.title}
            </Text>
            <Text style={styles.listCardDescription} numberOfLines={2}>
              {recipe.description || `Data sources: ${recipe.source_url ? 'video visuals + metadata text' : 'manual entry'}. Nutrition is an estimate.`}
            </Text>
            
            <View style={styles.listCardMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.metaText}>
                  {recipe.prep_time + recipe.cook_time}m
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color="#666" />
                <Text style={styles.metaText}>{recipe.servings}</Text>
              </View>
              <View style={[styles.difficultyBadge, styles[`difficulty${recipe.difficulty}`]]}>
                <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
              </View>
              {recipe.is_ai_generated && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.listCardActions}>
            <TouchableOpacity onPress={onFavorite}>
              <Ionicons 
                name={recipe.is_favorite ? "heart" : "heart-outline"} 
                size={20} 
                color={recipe.is_favorite ? "#FF5252" : "#666"} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onAddToCookbook}>
              <Ionicons name="bookmark-outline" size={20} color="#666" />
            </TouchableOpacity>
            {!isEditMode && (
              <TouchableOpacity onPress={onEdit}>
                <Ionicons name="ellipsis-vertical" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[
        styles.gridCard, 
        isEditMode && isSelected && styles.selectedCard
      ]} 
      onPress={handlePress}
    >
      {/* Edit mode checkbox */}
      {isEditMode && (
        <View style={[styles.checkboxContainer, styles.gridCheckboxContainer]}>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
        </View>
      )}

      <View style={styles.gridImageContainer}>
        {recipe.image_url ? (
  <Image
    source={{ 
      uri: recipe.source_url?.includes('instagram.com') 
        ? `https://images.weserv.nl/?url=${encodeURIComponent(recipe.image_url)}&w=400&h=300&fit=cover&maxage=7d`
        : recipe.image_url 
    }}
    style={styles.gridImage}
    onError={(error) => console.log('Image load error:', error)}
  />
        ) : (
          <View style={styles.gridPlaceholder}>
            <ChefHat size={32} color={colors.neutral[400]} />
          </View>
        )}
        {!isEditMode && (
          <TouchableOpacity style={styles.favoriteButton} onPress={onFavorite}>
            <Heart
              size={18}
              color={recipe.is_favorite ? colors.error[500] : colors.neutral[0]}
              fill={recipe.is_favorite ? colors.error[500] : 'transparent'}
            />
          </TouchableOpacity>
        )}
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
          {recipe.nutrition?.calories && (
            <View style={styles.gridMetaItem}>
              <Flame size={12} color={colors.neutral[500]} />
              <Text style={styles.gridMetaText}>{recipe.nutrition.calories} cal</Text>
            </View>
          )}
        </View>
        {!isEditMode && (
          <View style={styles.gridActions}>
            <TouchableOpacity onPress={onAddToCookbook} style={styles.gridActionButton}>
              <Book size={14} color={colors.secondary[500]} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onEdit} style={styles.gridActionButton}>
              <Edit3 size={14} color={colors.primary[500]} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.gridActionButton}>
              <Trash2 size={14} color={colors.error[500]} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// **Empty State Component**
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
            <X size={20} color={colors.primary[500]} />
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
      <BookOpen size={64} color={colors.primary[500]} />
      <Text style={styles.emptyStateTitle}>Build Your Recipe Library</Text>
      <Text style={styles.emptyStateSubtitle}>
        Start collecting your favorite recipes in one place
      </Text>
      <View style={styles.emptyStateActions}>
        <TouchableOpacity style={styles.emptyActionButton} onPress={onAddRecipe}>
          <Plus size={20} color={colors.primary[500]} />
          <Text style={styles.emptyActionText}>Add Recipe</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// **Main Library Component**
export default function Library() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showURLImport, setShowURLImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showManualRecipe, setShowManualRecipe] = useState(false);
  const [showAddToCookbook, setShowAddToCookbook] = useState(false);
  const [selectedRecipeForCookbook, setSelectedRecipeForCookbook] = useState<{id: string, title: string} | null>(null);
  const [selectedImportSource, setSelectedImportSource] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [showCreateCookbook, setShowCreateCookbook] = useState(false);
  
  // Bulk operations states
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Cookbook filter states
  const [selectedCookbook, setSelectedCookbook] = useState('all');
  const [userCookbooks, setUserCookbooks] = useState<any[]>([]);

  // Use the cookbook manager hook
  const { 
    cookbooks, 
    loading: cookbooksLoading,
    createCookbook,
    loadCookbooks 
  } = useCookbookManager();

  const [filters, setFilters] = useState<{ [key: string]: string }>({
    meal_type: 'all',
    diet: 'all',
    cook_time: 'all',
    difficulty: 'all',
    cuisine: 'all',
  });

  // Load user cookbooks
  useEffect(() => {
    loadUserCookbooks();
  }, []);

  const loadUserCookbooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cookbooksData, error: cookbooksError } = await supabase
        .from('cookbooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cookbooksError) throw cookbooksError;

      // Recipe count'ları ekle
      const cookbooksWithCount = await Promise.all(
        cookbooksData.map(async (cookbook) => {
          const { count, error } = await supabase
            .from('recipe_cookbooks')
            .select('*', { count: 'exact', head: true })
            .eq('cookbook_id', cookbook.id);

          return {
            ...cookbook,
            recipe_count: count || 0
          };
        })
      );

      setUserCookbooks(cookbooksWithCount);
    } catch (error) {
      console.error('Error loading cookbooks:', error);
    }
  };

  const loadLibraryData = async () => {
    try {
      setRecipesLoading(true);
      console.log('🔄 Loading library data...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to view your recipe library.');
        return;
      }

      console.log('👤 User ID:', user.id);

      // Load recipes only - cookbooks are handled by the hook
      const { data: recipesData, error: recipesError } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (recipesError) {
        console.error('❌ Error loading recipes:', recipesError);
        Alert.alert('Error', 'Failed to load recipes');
        return;
      }

      console.log('📝 Recipes loaded:', recipesData?.length || 0);

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
      console.log('✅ Library data loaded successfully');
    } catch (error) {
      console.error('Error loading library data:', error);
      Alert.alert('Error', 'Failed to load library data');
    } finally {
      setRecipesLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryData();
  }, []);

  const handleAddToCookbook = (recipe: Recipe) => {
    setSelectedRecipeForCookbook({ id: recipe.id, title: recipe.title });
    setShowAddToCookbook(true);
  };

  const toggleRecipeSelection = (recipeId: string) => {
    setSelectedRecipes(prev => {
      if (prev.includes(recipeId)) {
        return prev.filter(id => id !== recipeId);
      }
      return [...prev, recipeId];
    });
  };

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

    // Favorites filter
    if (filterMode === 'favorites') {
      filtered = filtered.filter(recipe => recipe.is_favorite);
    }

    return filtered;
  };

  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const filterRecipes = async () => {
      const filtered = await applyFilters(recipes);
      setFilteredRecipes(filtered);
    };
    filterRecipes();
  }, [recipes, searchQuery, filters, filterMode, selectedCookbook]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.meal_type !== 'all') count++;
    if (filters.diet !== 'all') count++;
    if (filters.cook_time !== 'all') count++;
    if (filters.difficulty !== 'all') count++;
    if (filters.cuisine !== 'all') count++;
    if (selectedCookbook !== 'all') count++;
    if (filterMode === 'favorites') count++;
    return count;
  };

  const hasActiveFilters = getActiveFilterCount() > 0;

  const clearAllFilters = () => {
    setFilters({
      meal_type: 'all',
      diet: 'all',
      cook_time: 'all',
      difficulty: 'all',
      cuisine: 'all',
    });
    setFilterMode('all');
    setSelectedCookbook('all');
  };

  // Bulk operations functions
  const handleBulkFavorite = async () => {
    try {
      const { error } = await supabase
        .from('user_recipes')
        .update({ is_favorite: true })
        .in('id', selectedRecipes);

      if (error) throw error;

      Alert.alert('Success', `${selectedRecipes.length} recipes added to favorites`);
      setIsEditMode(false);
      setSelectedRecipes([]);
      loadLibraryData();
    } catch (error) {
      console.error('Error favoriting recipes:', error);
      Alert.alert('Error', 'Failed to favorite recipes');
    }
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Recipes',
      `Are you sure you want to delete ${selectedRecipes.length} recipes?`,
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
                .in('id', selectedRecipes);

              if (error) throw error;

              Alert.alert('Success', `${selectedRecipes.length} recipes deleted`);
              setIsEditMode(false);
              setSelectedRecipes([]);
              loadLibraryData();
            } catch (error) {
              console.error('Error deleting recipes:', error);
              Alert.alert('Error', 'Failed to delete recipes');
            }
          }
        }
      ]
    );
  };

  const handleImportCategorySelect = (categoryId: string) => {
    if (categoryId === 'camera') {
      router.push({
        pathname: '/(tabs)/camera',
        params: {
          mode: 'recipe-scanner',
          returnTo: 'library',
          timestamp: Date.now().toString()
        }
      });
    } else if (categoryId === 'manual') {
      setShowManualRecipe(true);
    } else if (categoryId === 'socials') {
      setSelectedImportSource('socials');
      setShowURLImport(true);
    } else if (categoryId === 'web') {
      setSelectedImportSource('web');
      setShowURLImport(true);
    }
  };

  const handleManualRecipeSave = async (recipeData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to save recipes');
        return;
      }
      const { error } = await supabase.from('user_recipes').insert({
        user_id: user.id,
        ...recipeData,
      });
      if (error) {
        Alert.alert('Error', 'Failed to save recipe');
        return;
      }
      Alert.alert('Success!', 'Recipe added to your library');
      await loadLibraryData();
    } catch (error) {
      console.error('Error saving manual recipe:', error);
      Alert.alert('Error', 'Failed to save recipe');
    }
  };

  const handleFavoritesFilter = () => {
    setFilterMode(filterMode === 'favorites' ? 'all' : 'favorites');
  };

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
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Alert.alert('Error', 'Failed to delete recipe');
            }
          }
        }
      ]
    );
  };

  const handleURLImport = async (url: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to save recipes.');
        return;
      }

      setIsImporting(true);

      if (!url.trim() || !url.includes('http')) {
        Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
        return;
      }

      const videoPlatforms = ['youtube.com', 'youtu.be', 'tiktok.com', 'vt.tiktok.com', 'instagram.com', 'facebook.com', 'fb.watch'];
      const isVideoUrl = videoPlatforms.some(platform => url.includes(platform));

      if (isVideoUrl) {
        console.log('🎥 Detected video URL, using video extraction...');
        
        const platform = detectVideoPlatform(url);
        if (platform === 'Unknown') {
          Alert.alert('Unsupported Platform', 'This video platform is not supported yet.');
          return;
        }

        const result = await extractVideoRecipe(url, user.id);
        
        if (!result.success || !result.recipe) {
          Alert.alert(
            'Video Extraction Failed', 
            result.error || 'Could not extract recipe from this video. Please try another video or add manually.'
          );
          return;
        }

        Alert.alert(
          'Success! 🎉', 
          `"${result.recipe.title}" has been extracted from the video and saved to your library!`,
          [{ text: 'Great!', onPress: () => setShowURLImport(false) }]
        );

        await loadLibraryData();

      } else {
        console.log('🌐 Detected web URL, using web extraction...');
        const extractedData: ExtractedRecipeData | null = await extractRecipeFromUrl(url.trim(), user.id);
        
        if (!extractedData) {
          Alert.alert(
            'Import Failed', 
            'Could not extract recipe details from this URL. The page might not contain a recipe or may be inaccessible.'
          );
          return;
        }

        const newRecipe = {
          user_id: user.id,
          title: extractedData.title,
          description: extractedData.description || '',
          image_url: extractedData.image_url,
          prep_time: extractedData.prep_time || 0,
          cook_time: extractedData.cook_time || 0,
          servings: extractedData.servings || 1,
          difficulty: extractedData.difficulty || 'Easy',
          ingredients: extractedData.ingredients || [],
          instructions: extractedData.instructions || [],
          nutrition: extractedData.nutrition,
          tags: extractedData.tags || [],
          category: extractedData.category || 'General',
          is_favorite: false,
          is_ai_generated: true,
          source_url: url.trim(),
        };

        const { error } = await supabase.from('user_recipes').insert(newRecipe);

        if (error) {
          console.error('Error saving AI extracted recipe:', error);
          Alert.alert('Save Error', 'Failed to save the imported recipe. Please try again.');
          return;
        }

        Alert.alert(
          'Success!', 
          `"${newRecipe.title}" has been successfully imported to your library!`,
          [{ text: 'Great!', onPress: () => setShowURLImport(false) }]
        );

        await loadLibraryData();
      }

    } catch (error: any) {
      console.error('URL import process error:', error);
      
      if (error.message?.includes('Rate limit')) {
        Alert.alert('Rate Limit', error.message);
      } else {
        Alert.alert('Import Error', error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  if (loading || cookbooksLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading your recipe library...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>My Recipe Library</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => {
              setIsEditMode(!isEditMode);
              setSelectedRecipes([]);
            }}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>
              {isEditMode ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
          
          {/* YENİ: View mode toggle butonu */}
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={styles.viewModeButton}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'list' : 'grid'} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit mode selection bar */}
      {isEditMode && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedRecipes.length} selected
          </Text>
          <TouchableOpacity 
            onPress={() => {
              if (selectedRecipes.length === filteredRecipes.length) {
                setSelectedRecipes([]);
              } else {
                setSelectedRecipes(filteredRecipes.map(r => r.id));
              }
            }}
          >
            <Text style={styles.selectAllText}>
              {selectedRecipes.length === filteredRecipes.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
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
      
      <View style={styles.addActions}>
        <TouchableOpacity
          style={styles.addActionButton}
          onPress={() => setShowImportModal(true)}
        >
          <Plus size={18} color={colors.primary[500]} />
          <Text style={styles.addActionText}>Add Recipe</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.addActionButtonSecondary,
            filterMode === 'favorites' && styles.addActionButtonSecondaryActive
          ]}
          onPress={handleFavoritesFilter}
        >
          <Heart
            size={18}
            color={filterMode === 'favorites' ? colors.error[500] : colors.neutral[600]}
            fill={filterMode === 'favorites' ? colors.error[500] : 'transparent'}
          />
          <Text style={[
            styles.addActionTextSecondary,
            filterMode === 'favorites' && styles.addActionTextSecondaryActive
          ]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.recipesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.recipesContent,
          viewMode === 'grid' && styles.recipesGridContent,
          isEditMode && selectedRecipes.length > 0 && { paddingBottom: 120 }
        ]}
      >
        {/* 📚 COOKBOOK SECTION */}
        <View style={styles.cookbooksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Cookbooks</Text>
            <TouchableOpacity onPress={() => setShowCreateCookbook(true)}>
              <Plus size={20} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.cookbooksScroll}
          >
            {/* New Cookbook Card */}
            <TouchableOpacity
              style={styles.newCookbookCard}
              onPress={() => setShowCreateCookbook(true)}
            >
              <View style={styles.newCookbookIcon}>
                <Plus size={24} color={colors.primary[500]} />
              </View>
              <Text style={styles.newCookbookText}>New cookbook</Text>
            </TouchableOpacity>

            {/* Existing Cookbooks */}
            {cookbooks.map((cookbook, cookbookIndex) => (
              <TouchableOpacity
                key={`cookbook-${cookbook.id}-${cookbookIndex}`}
                style={styles.cookbookCard}
                onPress={() => router.push(`/cookbook/${cookbook.id}`)}
              >
                <Text style={styles.cookbookEmoji}>{cookbook.emoji}</Text>
                <Text style={styles.cookbookName}>{cookbook.name}</Text>
                <Text style={styles.cookbookCount}>{cookbook.recipe_count || 0} recipes</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recipes Section */}
        <View style={styles.recipesSection}>
          <Text style={styles.sectionTitle}>All Recipes</Text>
          
          {filteredRecipes.length > 0 ? (
            viewMode === 'grid' ? (
              <View style={styles.recipesGrid}>
                {filteredRecipes.map((recipe, recipeIndex) => (
                  <View key={`recipe-grid-${recipe.id}-${recipeIndex}`} style={styles.gridCardContainer}>
                    <RecipeCard
                      recipe={recipe}
                      viewMode="grid"
                      onPress={() => {
                        router.push(`/recipe/${recipe.id}`);
                      }}
                      onFavorite={() => handleFavorite(recipe.id)}
                      onEdit={() => {
                        console.log('Recipe edit form coming soon:', recipe.id);
                      }}
                      onDelete={() => handleDelete(recipe.id)}
                      onAddToCookbook={() => handleAddToCookbook(recipe)}
                      isEditMode={isEditMode}
                      isSelected={selectedRecipes.includes(recipe.id)}
                      onSelect={() => toggleRecipeSelection(recipe.id)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              filteredRecipes.map((recipe, recipeIndex) => (
                <RecipeCard
                  key={`recipe-list-${recipe.id}-${recipeIndex}`}
                  recipe={recipe}
                  viewMode="list"
                  onPress={() => {
                    router.push(`/recipe/${recipe.id}`);
                  }}
                  onFavorite={() => handleFavorite(recipe.id)}
                  onEdit={() => {
                    console.log('Recipe edit form coming soon:', recipe.id);
                  }}
                  onDelete={() => handleDelete(recipe.id)}
                  onAddToCookbook={() => handleAddToCookbook(recipe)}
                  isEditMode={isEditMode}
                  isSelected={selectedRecipes.includes(recipe.id)}
                  onSelect={() => toggleRecipeSelection(recipe.id)}
                />
              ))
            )
          ) : (
            <EmptyState
              hasFilters={hasActiveFilters}
              onAddRecipe={() => setShowImportModal(true)}
              onClearFilters={clearAllFilters}
            />
          )}
        </View>
      </ScrollView>

      {/* Bulk actions bottom bar */}
      {isEditMode && selectedRecipes.length > 0 && (
        <View style={styles.bulkActionsBar}>
          <TouchableOpacity 
            style={styles.bulkAction}
            onPress={() => setShowBulkActions(true)}
          >
            <Ionicons name="book-outline" size={20} color="#4CAF50" />
            <Text style={styles.bulkActionText}>Add to Cookbook</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.bulkAction}
            onPress={handleBulkFavorite}
          >
            <Ionicons name="heart-outline" size={20} color="#4CAF50" />
            <Text style={styles.bulkActionText}>Favorite</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.bulkAction, styles.bulkActionDelete]}
            onPress={handleBulkDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#FF5252" />
            <Text style={[styles.bulkActionText, styles.bulkActionTextDelete]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <ImportCategoriesModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSelect={handleImportCategorySelect}
      />
      
      <ManualRecipeModal
        visible={showManualRecipe}
        onClose={() => setShowManualRecipe(false)}
        onSave={handleManualRecipeSave}
      />
      
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
      
      <URLImportModal
        visible={showURLImport}
        onClose={() => setShowURLImport(false)}
        onImport={handleURLImport}
        selectedSource={selectedImportSource}
        loading={isImporting}
      />

      {/* Cookbook Selection Modal */}
      {selectedRecipeForCookbook && (
        <CookbookBottomSheet
          visible={showAddToCookbook}
          onClose={() => {
            setShowAddToCookbook(false);
            setSelectedRecipeForCookbook(null);
            loadCookbooks();
          }}
          recipeId={selectedRecipeForCookbook.id}
          recipeTitle={selectedRecipeForCookbook.title}
        />
      )}

      {/* Bulk cookbook selection bottom sheet */}
      <BulkActionsBottomSheet
        visible={showBulkActions}
        onClose={() => setShowBulkActions(false)}
        selectedRecipeIds={selectedRecipes}
        onCookbooksUpdated={() => {
          setShowBulkActions(false);
          setIsEditMode(false);
          setSelectedRecipes([]);
        }}
      />

      {/* Create Cookbook BottomSheet */}
      <EditCookbookBottomSheet
        visible={showCreateCookbook}
        onClose={() => setShowCreateCookbook(false)}
        cookbook={{
          id: 'new',
          name: '',
          description: '',
          emoji: '📚',
          color: colors.primary[500]
        }}
        onUpdate={() => {
          setShowCreateCookbook(false);
          loadCookbooks();
        }}
      />
      
      {/* DEĞİŞTİR: Floating Action Button (edit mode kontrolü ekle) */}
      {!isEditMode && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowImportModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}
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
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize['2xl'],
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-Bold',
    color: colors.neutral[800],
    marginLeft: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
  },
  editButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  viewModeButton: {
    padding: 4,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  selectAllText: {
    color: '#4CAF50',
    fontWeight: '500',
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
  addActionButtonSecondaryActive: {
    backgroundColor: colors.error[50],
  },
  addActionText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.primary[600],
  },
  addActionTextSecondary: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[600],
  },
  addActionTextSecondaryActive: {
    color: colors.error[600],
  },
  recipesContainer: {
    flex: 1,
  },
  recipesContent: {
    padding: spacing.lg,
  },
  recipesGridContent: {
    paddingBottom: 100,
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  gridCardContainer: {
    width: (width - spacing.lg * 2 - spacing.sm) / 2,
  },
  
  // Cookbook Section Styles
  cookbooksSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  recipesSection: {
    flex: 1,
  },
  cookbooksScroll: {
    flexDirection: 'row',
  },
  newCookbookCard: {
    width: 140,
    height: 180,
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  newCookbookIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  newCookbookText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary[600],
  },
  cookbookCard: {
    width: 140,
    height: 180,
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing.md,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  cookbookEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  cookbookName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cookbookCount: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  
  // Filter Option with Emoji
  filterOptionWithEmoji: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // List view styles
  listCard: {
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    ...shadows.sm,
  },
  listCardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  listCheckbox: {
    marginRight: 12,
  },
  listCardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  listCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  listCardDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  listCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyMedium: {
    backgroundColor: '#FFF3E0',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F57C00',
  },
  aiBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1976D2',
  },
  listCardActions: {
    flexDirection: 'column',
    gap: 16,
    marginLeft: 12,
  },
  
  // Bulk Actions Styles
  bulkActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    justifyContent: 'space-around',
    paddingBottom: 32,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bulkAction: {
    alignItems: 'center',
    gap: 4,
  },
  bulkActionText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  bulkActionDelete: {
    // Delete için özel stil
  },
  bulkActionTextDelete: {
    color: '#FF5252',
  },

  // Bulk Modal Styles
  bulkModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bulkModalContainer: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  bulkModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  bulkModalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  bulkModalContent: {
    maxHeight: 400,
    padding: spacing.lg,
  },
  bulkCookbookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.neutral[50],
    marginBottom: spacing.sm,
  },
  bulkCookbookEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  bulkCookbookInfo: {
    flex: 1,
  },
  bulkCookbookName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs / 2,
  },
  bulkCookbookDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },

  // Edit mode styles
  selectedCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  gridCheckboxContainer: {
    top: 8,
    left: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  
  // Import Modal Styles
  importModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  importModalContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    width: '85%',
    maxWidth: 350,
    ...shadows.lg,
  },
  importModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  importModalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  importModalContent: {
    paddingVertical: spacing.sm,
  },
  importModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  importModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  importModalTextContainer: {
    flex: 1,
  },
  importModalItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs / 2,
  },
  importModalItemDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  
  // Manual Recipe Modal Styles
  manualRecipeContainer: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  manualRecipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  manualRecipeTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-SemiBold',
    fontWeight: '600',
    color: colors.neutral[800],
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.primary[500],
  },
  manualRecipeContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  formSection: {
    marginVertical: spacing.lg,
  },
  formSectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  formInput: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  textArea: {
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  formHint: {
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
    marginBottom: spacing.sm,
  },
  pickerContainer: {
    marginTop: spacing.xs,
  },
  pickerOption: {
    backgroundColor: colors.neutral[100],
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primary[500],
  },
  pickerOptionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Medium',
    fontWeight: '500',
    color: colors.neutral[600],
  },
  pickerOptionTextSelected: {
    color: colors.neutral[0],
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
  
  // URL Import Modal Styles
  urlModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  urlModalContainer: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    maxHeight: '80%',
  },
  urlModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  urlModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  urlModalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  urlModalTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-SemiBold',
    fontWeight: '600',
    color: colors.neutral[800],
  },
  urlModalSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
  },
  urlModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlModalDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[600],
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  urlInputWrapper: {
    marginBottom: spacing.lg,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  urlInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[800],
    paddingVertical: spacing.md,
  },
  clearInputButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  exampleUrlsContainer: {
    marginBottom: spacing.xl,
  },
  exampleUrlsTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[600],
    marginBottom: spacing.md,
  },
  exampleUrlsText: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
    lineHeight: 20,
  },
  urlModalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  urlCancelButton: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  urlCancelButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[600],
  },
  urlImportButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  urlImportButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  urlImportButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[0],
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  
  // Recipe Card Styles
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Bold',
    fontWeight: 'bold',
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Bold',
    fontWeight: 'bold',
    color: colors.neutral[0],
  },
  sourceBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  gridDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Medium',
    fontWeight: '500',
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
  
  // Empty State Styles
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-SemiBold',
    fontWeight: '600',
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
    fontWeight: '600',
    color: colors.primary[600],
  },
  emptyActionTextSecondary: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[600],
  },
  fab: {
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