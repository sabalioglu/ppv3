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
  Instagram,
  Youtube,
  Facebook,
  Video, // TikTok icon replacement
  Bookmark, // Pinterest icon replacement
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

// **OpenAI Recipe AI Service Import**
import { extractRecipeFromUrl, ExtractedRecipeData } from '@/lib/recipeAIService';

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

// **Enhanced Filter Categories (Samsung Food Style)**
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

// **Import Sources Configuration (Updated Icons)**
interface ImportSource {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
}

const importSources: ImportSource[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
    description: 'Recipe posts and reels'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Video,
    color: '#000000',
    description: 'Cooking videos and recipes'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    description: 'Recipe posts and videos'
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: Bookmark,
    color: '#BD081C',
    description: 'Recipe pins and boards'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    description: 'Cooking videos and tutorials'
  },
  {
    id: 'camera',
    name: 'Camera',
    icon: Camera,
    color: colors.primary[500],
    description: 'Scan recipe from notebook'
  }
];

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
      // Process ingredients (split by line)
      const ingredientsList = formData.ingredients
        .split('\n')
        .filter(line => line.trim())
        .map((line, index) => ({
          name: line.trim(),
          quantity: '',
          unit: '',
          notes: ''
        }));

      // Process instructions (split by line)
      const instructionsList = formData.instructions
        .split('\n')
        .filter(line => line.trim())
        .map((line, index) => ({
          step: index + 1,
          instruction: line.trim(),
          duration_mins: undefined
        }));

      // Process tags (split by comma)
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
        {/* Header */}
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
          {/* Basic Info */}
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
                    {['Easy', 'Medium', 'Hard'].map((level) => (
                      <TouchableOpacity
                        key={level}
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
                  {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
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
          {/* Ingredients */}
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
          {/* Instructions */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Instructions *</Text>
            <Text style={styles.formHint}>Enter each step on a new line</Text>
            <TextInput
              style={[styles.formInput, styles.textArea, { height: 150 }]}
              placeholder="Preheat oven to 350°F&#10;Mix dry ingredients in a bowl&#10;Add wet ingredients and stir&#10;Bake for 25-30 minutes"
              value={formData.instructions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
              placeholderTextColor={colors.neutral[400]}
              multiline
              textAlignVertical="top"
            />
          </View>
          {/* Tags */}
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

// **Enhanced Filter Modal Component (Samsung Food Style)**
const FilterModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  filters: { [key: string]: string };
  onFiltersChange: (filters: { [key: string]: string }) => void;
  recipeCount: number;
}> = ({ visible, onClose, filters, onFiltersChange, recipeCount }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    meal_type: true, // Default expanded
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
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.filterModalContainer}>
        {/* Header */}
        <View style={styles.filterModalHeader}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.neutral[600]} />
          </TouchableOpacity>
          <Text style={styles.filterModalTitle}>Filter Recipes</Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        {/* Filter Categories */}
        <ScrollView style={styles.filterModalContent} showsVerticalScrollIndicator={false}>
          {filterCategories.map((category) => (
            <View key={category.id} style={styles.filterCategoryContainer}>
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
                  {category.options.map((option) => {
                    const isSelected = localFilters[category.id] === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
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
        {/* Apply Button */}
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

// **Enhanced Import Options Modal Component**
const ImportOptionsModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelectSource: (sourceId: string) => void;
}> = ({ visible, onClose, onSelectSource }) => {
  const handleSourceSelect = (sourceId: string) => {
    onSelectSource(sourceId);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.importModalOverlay}>
        <View style={styles.importModalContainer}>
          {/* Header */}
          <View style={styles.importModalHeader}>
            <View style={styles.importModalTitleContainer}>
              <View style={styles.importModalIconContainer}>
                <Plus size={24} color={colors.primary[500]} />
              </View>
              <View>
                <Text style={styles.importModalTitle}>Import Recipe</Text>
                <Text style={styles.importModalSubtitle}>Choose your source</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.importModalCloseButton}>
              <X size={20} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
          {/* Import Sources Grid */}
          <ScrollView style={styles.importSourcesContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.importSourcesGrid}>
              {importSources.map((source) => (
                <TouchableOpacity
                  key={source.id}
                  style={styles.importSourceCard}
                  onPress={() => handleSourceSelect(source.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.importSourceIconContainer, { backgroundColor: `${source.color}15` }]}>
                    <source.icon size={28} color={source.color} />
                  </View>
                  <Text style={styles.importSourceName}>{source.name}</Text>
                  <Text style={styles.importSourceDescription}>{source.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {/* Manual Add Option */}
          <View style={styles.manualAddContainer}>
            <TouchableOpacity
              style={styles.manualAddButton}
              onPress={() => handleSourceSelect('manual')}
            >
              <Edit3 size={20} color={colors.neutral[600]} />
              <Text style={styles.manualAddText}>Add Recipe Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// **Enhanced URL Import Modal Component with Intelligent Loading Messages**
const URLImportModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onImport: (url: string) => void;
  selectedSource?: string;
  loading: boolean;
}> = ({ visible, onClose, onImport, selectedSource, loading }) => {
  const [url, setUrl] = useState('');
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState('Our AI chef is cooking up your recipe...');

  // Platform-aware and humorous loading messages
  const getLoadingMessages = (url: string) => {
    const baseMessages = [
      "Our AI chef is cooking up your recipe...",
      "Scanning the digital pantry for ingredients...",
      "Teaching our robots to chop onions (virtually, of course)...",
      "Brewing the perfect digital coffee for our recipe AI...",
      "Wrangling pixels to find the best recipe image...",
      "Making sure no digital crumbs are left behind...",
      "Consulting the ancient scrolls of culinary wisdom...",
      "Don't worry, we're faster than a slow cooker!",
      "Almost ready to serve your new favorite dish!",
      "Just adding a pinch of AI magic..."
    ];

    // Platform-specific messages
    const platformMessages: { [key: string]: string[] } = {
      tiktok: [
        "🎵 Parsing TikTok cooking video...",
        "📱 Extracting recipe from viral content...",
        "🎬 Analyzing video thumbnail...",
        "⭐ This looks like a trending recipe!"
      ],
      instagram: [
        "📸 Processing Instagram recipe post...",
        "🌟 Extracting from food influencer content...",
        "📖 Reading recipe from beautiful photos...",
        "✨ Instagram-worthy recipe incoming!"
      ],
      youtube: [
        "🎥 Analyzing YouTube cooking tutorial...",
        "👨‍🍳 Learning from the chef's video...",
        "📺 Extracting step-by-step instructions...",
        "🎬 Processing video thumbnail..."
      ]
    };

    // Detect platform
    let platform = 'general';
    if (url.includes('tiktok.com')) platform = 'tiktok';
    else if (url.includes('instagram.com')) platform = 'instagram';
    else if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';

    // Combine platform-specific + general messages
    const specificMessages = platformMessages[platform] || [];
    return [...specificMessages, ...baseMessages].slice(0, 8); // Max 8 messages
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
      }, 2500); // Change message every 2.5 seconds
    } else {
      setCurrentLoadingMessage('Our AI chef is cooking up your recipe...');
    }
    return () => clearInterval(interval);
  }, [loading, url]);

  const getSourceInfo = () => {
    const source = importSources.find(s => s.id === selectedSource);
    return source || { name: 'Website', color: colors.primary[500], description: 'Any recipe website' };
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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.urlModalOverlay}>
        <View style={styles.urlModalContainer}>
          {/* Header */}
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

          {/* Description */}
          <Text style={styles.urlModalDescription}>
            Paste a link from {sourceInfo.name} and our AI will automatically extract the recipe details,
            including ingredients, instructions, and nutritional information.
          </Text>

          {/* URL Input */}
          <View style={styles.urlInputWrapper}>
            <View style={styles.urlInputContainer}>
              <TextInput
                style={styles.urlInput}
                placeholder={`https://${sourceInfo.name.toLowerCase()}.com/recipe`}
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

          {/* Example URLs */}
          <View style={styles.exampleUrlsContainer}>
            <Text style={styles.exampleUrlsTitle}>Supported formats:</Text>
            <Text style={styles.exampleUrlsText}>
              - Recipe posts and videos{'\n'}
              - Cooking tutorials{'\n'}
              - Food blog articles{'\n'}
              - Recipe sharing posts
            </Text>
          </View>

          {/* Action Buttons */}
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

// **Recipe Card Component (keeping existing implementation)**
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
        <TouchableOpacity style={styles.favoriteButton} onPress={onFavorite}>
          <Heart
            size={18}
            color={recipe.is_favorite ? colors.error[500] : colors.neutral[0]}
            fill={recipe.is_favorite ? colors.error[500] : 'transparent'}
          />
        </TouchableOpacity>
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
        {recipe.ai_match_score !== undefined && (
          <View style={styles.matchScore}>
            <Text style={styles.matchScoreText}>{recipe.ai_match_score}%</Text>
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

// **Enhanced Empty State Component**
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [showURLImport, setShowURLImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showManualRecipe, setShowManualRecipe] = useState(false);
  const [selectedImportSource, setSelectedImportSource] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false); // **NEW: Loading state for AI import**

  // **Enhanced Filter State**
  const [filters, setFilters] = useState<{ [key: string]: string }>({
    meal_type: 'all',
    diet: 'all',
    cook_time: 'all',
    difficulty: 'all',
    cuisine: 'all',
  });

  // **Load Data from Supabase**
  const loadLibraryData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to view your recipe library.');
        return;
      }

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
      console.error('Error loading library data:', error);
      Alert.alert('Error', 'Failed to load library data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryData();
  }, []);

  // **Enhanced Filter Logic**
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMealType = filters.meal_type === 'all' ||
      recipe.category.toLowerCase() === filters.meal_type.toLowerCase();

    const matchesDiet = filters.diet === 'all' ||
      recipe.tags.some(tag => tag.toLowerCase().includes(filters.diet.toLowerCase()));

    const totalTime = recipe.prep_time + recipe.cook_time;
    const matchesCookTime = filters.cook_time === 'all' ||
      (filters.cook_time === 'under_15' && totalTime < 15) ||
      (filters.cook_time === 'under_30' && totalTime < 30) ||
      (filters.cook_time === 'under_60' && totalTime < 60) ||
      (filters.cook_time === 'over_60' && totalTime >= 60);

    const matchesDifficulty = filters.difficulty === 'all' ||
      recipe.difficulty.toLowerCase() === filters.difficulty.toLowerCase();

    const matchesFavorites = filterMode === 'all' ||
      (filterMode === 'favorites' && recipe.is_favorite);

    return matchesSearch && matchesMealType && matchesDiet && matchesCookTime && matchesDifficulty && matchesFavorites;
  });

  // **Check if any filters are active**
  const hasActiveFilters = Object.values(filters).some(filter => filter !== 'all') || filterMode !== 'all';

  // **Clear all filters**
  const clearAllFilters = () => {
    setFilters({
      meal_type: 'all',
      diet: 'all',
      cook_time: 'all',
      difficulty: 'all',
      cuisine: 'all',
    });
    setFilterMode('all');
  };

  // **Handle Import Source Selection**
  const handleImportSourceSelect = (sourceId: string) => {
    if (sourceId === 'camera') {
      router.push({
        pathname: '/(tabs)/camera',
        params: {
          mode: 'recipe-scanner',
          returnTo: 'library',
          timestamp: Date.now().toString()
        }
      });
    } else if (sourceId === 'manual') {
      setShowManualRecipe(true);
    } else {
      setSelectedImportSource(sourceId);
      setShowURLImport(true);
    }
  };

  // **Handle Manual Recipe Save**
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
      Alert.alert('Success! 📚', 'Recipe added to your library');
      await loadLibraryData();
    } catch (error) {
      console.error('Error saving manual recipe:', error);
      Alert.alert('Error', 'Failed to save recipe');
    }
  };

  // **Handle Favorites Toggle**
  const handleFavoritesFilter = () => {
    setFilterMode(filterMode === 'favorites' ? 'all' : 'favorites');
  };

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
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Alert.alert('Error', 'Failed to delete recipe');
            }
          }
        }
      ]
    );
  };

  // **🚀 Enhanced AI-Powered URL Import Handler with Zero Extra Cost + Intelligent Loading**
  const handleURLImport = async (url: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to save recipes.');
        return;
      }

      setIsImporting(true); // **Start intelligent loading state**

      // URL validation
      if (!url.trim() || !url.includes('http')) {
        Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
        return;
      }

      // Extract recipe using AI service (same API call, zero extra cost)
      const extractedData: ExtractedRecipeData | null = await extractRecipeFromUrl(url.trim(), user.id);

      if (!extractedData) {
        Alert.alert(
          'Import Failed', 
          'Could not extract recipe details from this URL. The page might not contain a recipe or may be inaccessible. Please try another link or add manually.'
        );
        return;
      }

      // Convert extracted data to Supabase recipe format
      const newRecipe = {
        user_id: user.id,
        title: extractedData.title,
        description: extractedData.description || '',
        image_url: extractedData.image_url, // **AI extracts this in same call - zero extra cost**
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

      // Save to Supabase
      const { error } = await supabase.from('user_recipes').insert(newRecipe);

      if (error) {
        console.error('Error saving AI extracted recipe:', error);
        Alert.alert('Save Error', 'Failed to save the imported recipe. Please try again.');
        return;
      }

      // Success feedback
      Alert.alert(
        'Success! 🎉', 
        `"${newRecipe.title}" has been successfully imported to your library!`,
        [{ text: 'Great!', onPress: () => setShowURLImport(false) }]
      );

      // Refresh recipe list
      await loadLibraryData();

    } catch (error: any) {
      console.error('URL import process error:', error);
      
      if (error.message?.includes('Rate limit')) {
        Alert.alert('Rate Limit', error.message);
      } else {
        Alert.alert('Import Error', error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsImporting(false); // **End loading state**
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
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
            {hasActiveFilters ? ' filtered' : ' in your collection'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewToggleButton}
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          {viewMode === 'grid' ? (
            <List size={20} color={colors.neutral[600]} />
          ) : (
            <Grid size={20} color={colors.neutral[600]} />
          )}
        </TouchableOpacity>
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
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={20} color={hasActiveFilters ? colors.primary[500] : colors.neutral[600]} />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>
      {/* Add Recipe Actions */}
      <View style={styles.addActions}>
        <TouchableOpacity
          style={styles.addActionButton}
          onPress={() => setShowImportOptions(true)}
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
                    onPress={() => {
                      router.push(`/recipe/${recipe.id}`);
                    }}
                    onFavorite={() => handleFavorite(recipe.id)}
                    onEdit={() => {
                      console.log('Recipe edit form coming soon:', recipe.id);
                    }}
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
                onPress={() => {
                  router.push(`/recipe/${recipe.id}`);
                }}
                onFavorite={() => handleFavorite(recipe.id)}
                onEdit={() => {
                  console.log('Recipe edit form coming soon:', recipe.id);
                }}
                onDelete={() => handleDelete(recipe.id)}
              />
            ))
          )
        ) : (
          <EmptyState
            hasFilters={hasActiveFilters}
            onAddRecipe={() => setShowImportOptions(true)}
            onClearFilters={clearAllFilters}
          />
        )}
      </ScrollView>
      {/* Manual Recipe Modal */}
      <ManualRecipeModal
        visible={showManualRecipe}
        onClose={() => setShowManualRecipe(false)}
        onSave={handleManualRecipeSave}
      />
      {/* Enhanced Import Options Modal */}
      <ImportOptionsModal
        visible={showImportOptions}
        onClose={() => setShowImportOptions(false)}
        onSelectSource={handleImportSourceSelect}
      />
      {/* Enhanced Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        recipeCount={filteredRecipes.length}
      />
      {/* Enhanced URL Import Modal with Intelligent Loading */}
      <URLImportModal
        visible={showURLImport}
        onClose={() => setShowURLImport(false)}
        onImport={handleURLImport}
        selectedSource={selectedImportSource}
        loading={isImporting} // **Pass intelligent loading state**
      />
      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingAddButton}
        onPress={() => setShowImportOptions(true)}
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-Bold',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[600],
  },
  viewToggleButton: {
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
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
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
  // **Enhanced Import Options Modal Styles**
  importModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  importModalContainer: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    maxHeight: '85%',
  },
  importModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  importModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  importModalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  importModalTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-SemiBold',
    fontWeight: '600',
    color: colors.neutral[800],
  },
  importModalSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
  },
  importModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  importSourcesContainer: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  importSourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  importSourceCard: {
    width: (width - spacing.lg * 2 - spacing.sm * 2) / 3,
    backgroundColor: colors.neutral[50],
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  importSourceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  importSourceName: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  importSourceDescription: {
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 16,
  },
  manualAddContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: spacing.lg,
  },
  manualAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  manualAddText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
    color: colors.neutral[600],
  },
  // **Manual Recipe Modal Styles**
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
  // **Enhanced Filter Modal Styles**
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
  // **Enhanced URL Import Modal Styles**
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
  // **NEW: Intelligent Loading Content Style**
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  // **Recipe Card Styles (existing implementation)**
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
  matchScore: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.success[500],
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchScoreText: {
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Bold',
    fontWeight: 'bold',
    color: colors.neutral[0],
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    fontWeight: '600',
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Medium',
    fontWeight: '500',
    color: colors.neutral[500],
  },
  difficultyChip: {
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  difficultyChipText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Bold',
    fontWeight: 'bold',
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Bold',
    fontWeight: 'bold',
    color: colors.neutral[0],
  },
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
