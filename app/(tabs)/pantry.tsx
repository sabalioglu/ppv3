// app> (tabs) > pantry.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  Dimensions,
  FlatList,
  ListRenderItem,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Search, Filter, Package, Calendar, TriangleAlert as AlertTriangle, X, Camera, Barcode, Clock, MapPin, TrendingUp, ChevronDown, Trash2, Edit3, MoreVertical, ChefHat } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { RecipeOrchestrator } from '@/lib/meal-plan/recipe-orchestrator';
import { generateAIMeal } from '@/lib/meal-plan/ai-generation';
import type { Recipe } from '@/lib/meal-plan/types';

// Keep the existing PantryItem interface
interface PantryItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date?: string;
  purchase_date?: string;
  location?: string;
  image_url?: string;
  created_at: string;
}

// ... (Keep all existing constants like CATEGORIES, UNITS, LOCATIONS, categoryImages)
const CATEGORIES = [
    { key: 'all', label: 'All Items', emoji: '📦' },
    { key: 'dairy', label: 'Dairy', emoji: '🥛' },
    { key: 'meat', label: 'Meat & Fish', emoji: '🥩' },
    { key: 'vegetables', label: 'Vegetables', emoji: '🥬' },
    { key: 'fruits', label: 'Fruits', emoji: '🍎' },
    { key: 'grains', label: 'Grains & Bread', emoji: '🌾' },
    { key: 'snacks', label: 'Snacks', emoji: '🍿' },
    { key: 'beverages', label: 'Beverages', emoji: '🥤' },
    { key: 'condiments', label: 'Sauces & Spices', emoji: '🧂' },
    { key: 'frozen', label: 'Frozen', emoji: '🧊' },
    { key: 'canned', label: 'Canned Goods', emoji: '🥫' },
    { key: 'bakery', label: 'Bakery', emoji: '🥐' },
  ];

  const UNITS = [
    { value: 'pcs', label: 'Pieces', category: 'Count' },
    { value: 'kg', label: 'Kilograms', category: 'Weight' },
    { value: 'g', label: 'Grams', category: 'Weight' },
    { value: 'L', label: 'Liters', category: 'Volume' },
    { value: 'ml', label: 'Milliliters', category: 'Volume' },
    { value: 'oz', label: 'Ounces', category: 'Weight' },
    { value: 'lb', label: 'Pounds', category: 'Weight' },
    { value: 'cups', label: 'Cups', category: 'Volume' },
    { value: 'tbsp', label: 'Tablespoons', category: 'Volume' },
    { value: 'tsp', label: 'Teaspoons', category: 'Volume' },
  ];

  const LOCATIONS = ['Fridge', 'Freezer', 'Pantry', 'Cabinet', 'Counter'];

  const categoryImages = {
    dairy: require('../../assets/images/categoryImages/dairy.webp'),
    meat: require('../../assets/images/categoryImages/meat.webp'),
    vegetables: require('../../assets/images/categoryImages/vegetables.webp'),
    fruits: require('../../assets/images/categoryImages/fruits.webp'),
    grains: require('../../assets/images/categoryImages/grains.webp'),
    snacks: require('../../assets/images/categoryImages/snacks.webp'),
    beverages: require('../../assets/images/categoryImages/beverages.webp'),
    condiments: require('../../assets/images/categoryImages/condiments.webp'),
    frozen: require('../../assets/images/categoryImages/frozen.webp'),
    canned: require('../../assets/images/categoryImages/canned.webp'),
    bakery: require('../../assets/images/categoryImages/bakery.webp'),
    default: require('../../assets/images/categoryImages/default.webp'),
  };

  const getItemImageSource = (category: string) => {
    return categoryImages[category as keyof typeof categoryImages] || categoryImages.default;
  };

export default function PantryScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeExpiryFilter, setActiveExpiryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryStats, setCategoryStats] = useState<{[key: string]: number}>({});
  
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);

  // New state for recipe suggestions
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const recipeOrchestrator = useMemo(() => new RecipeOrchestrator(generateAIMeal), []);

  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const onChange = (result: any) => setScreenData(result.window);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const getGridLayout = () => {
    const { width } = screenData;
    const isTablet = width >= 768;
    const isLargeScreen = width >= 1024;
    
    if (isLargeScreen) return { numColumns: 3, itemWidth: (width - 80) / 3 };
    if (isTablet) return { numColumns: 2, itemWidth: (width - 60) / 2 };
    return { numColumns: 1, itemWidth: width - 40 };
  };

  const { numColumns, itemWidth } = getGridLayout();

  const [newItem, setNewItem] = useState({
    name: '', brand: '', category: 'vegetables', quantity: '1', unit: 'pcs',
    expiry_date: '', location: 'Fridge',
  });

  useEffect(() => {
    loadPantryItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory, activeExpiryFilter]);

  // New useEffect for recipe suggestions
  useEffect(() => {
    if (items.length > 0) {
      loadSuggestedRecipes();
    } else {
      setSuggestedRecipes([]);
    }
  }, [items]);

  const loadSuggestedRecipes = async () => {
    setIsLoadingSuggestions(true);
    try {
      const result = await recipeOrchestrator.findRecipesByPantry(items);
      if (result.data && result.data.length > 0) {
        setSuggestedRecipes(result.data);
      } else {
        setSuggestedRecipes([]);
      }
    } catch (error) {
      console.error('Failed to load recipe suggestions:', error);
      setSuggestedRecipes([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const loadPantryItems = async () => {
    // ... (keep existing implementation)
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('pantry_items')
          .select('*')
          .eq('user_id', user.id)
          .order('expiry_date', { ascending: true });

        if (error) throw error;

        setItems(data || []);

        const stats: {[key: string]: number} = {};
        data?.forEach(item => {
          stats[item.category] = (stats[item.category] || 0) + 1;
        });
        stats['all'] = data?.length || 0;
        setCategoryStats(stats);

      } catch (error) {
        console.error('Error loading pantry items:', error);
        Alert.alert('Error', 'Could not load pantry items');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
  };

  const filterItems = () => {
    // ... (keep existing implementation)
    let filtered = items;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeExpiryFilter !== 'all') {
      const today = new Date();
      filtered = filtered.filter(item => {
        if (!item.expiry_date) return activeExpiryFilter === 'no_expiry';
        
        const expiryDate = new Date(item.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (activeExpiryFilter) {
          case 'expired':
            return daysUntilExpiry < 0;
          case 'expiring':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
          case 'fresh':
            return daysUntilExpiry > 7;
          default:
            return true;
        }
      });
    }

    setFilteredItems(filtered);
  };

  // ... (keep all handlers: handleAddItem, handleUpdateItem, handleDeleteItem, handleEditItem, etc.)
  const handleAddItem = async () => {
    // Validation
    if (!newItem.name.trim()) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const itemData = {
        user_id: user.id,
        name: newItem.name.trim(),
        brand: newItem.brand.trim() || null,
        category: newItem.category,
        quantity: parseFloat(newItem.quantity) || 1,
        unit: newItem.unit,
        expiry_date: newItem.expiry_date || null,
        location: newItem.location,
        purchase_date: new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabase
        .from('pantry_items')
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;

      setItems([data, ...items]);
      setShowAddModal(false);
      resetNewItem();
      Alert.alert('Success', 'Item added to pantry!');
    } catch (error: any) {
      console.error('Error adding item:', error);
      Alert.alert('Error', error.message || 'Could not add item');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !newItem.name.trim()) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const itemData = {
        name: newItem.name.trim(),
        brand: newItem.brand.trim() || null,
        category: newItem.category,
        quantity: parseFloat(newItem.quantity) || 1,
        unit: newItem.unit,
        expiry_date: newItem.expiry_date || null,
        location: newItem.location,
      };

      const { data, error } = await supabase
        .from('pantry_items')
        .update(itemData)
        .eq('id', editingItem.id)
        .select()
        .single();

      if (error) throw error;

      setItems(items.map(item => item.id === editingItem.id ? data : item));
      setShowAddModal(false);
      setEditMode(false);
      setEditingItem(null);
      resetNewItem();
      Alert.alert('Success', 'Item updated successfully!');
    } catch (error: any) {
      console.error('Error updating item:', error);
      Alert.alert('Error', error.message || 'Could not update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('pantry_items')
                .delete()
                .eq('id', itemId);

              if (error) throw error;

              setItems(items.filter(item => item.id !== itemId));
              setShowActionsMenu(null);
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Could not delete item');
            }
          },
        },
      ]
    );
  };

  const handleEditItem = (item: PantryItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      brand: item.brand || '',
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      expiry_date: item.expiry_date || '',
      location: item.location || 'Fridge',
    });
    setEditMode(true);
    setShowAddModal(true);
    setShowActionsMenu(null);
  };

  const resetNewItem = () => {
    setNewItem({
      name: '',
      brand: '',
      category: 'vegetables',
      quantity: '1',
      unit: 'pcs',
      expiry_date: '',
      location: 'Fridge',
    });
    setShowUnitDropdown(false);
    setEditMode(false);
    setEditingItem(null);
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryColor = (days: number | null) => {
    if (days === null) return theme.colors.expiryNeutral;
    if (days <= 0) return theme.colors.expiryUrgent;
    if (days <= 3) return theme.colors.expirySoon;
    if (days <= 7) return theme.colors.info;
    return theme.colors.expiryOk;
  };

  const handleExpiryFilterChange = (filter: 'all' | 'expiring' | 'expired') => {
    setActiveExpiryFilter(filter);
    if (filter !== 'all') {
      setSelectedCategory('all');
    }
  };

  // New navigation functions
  const viewRecipeDetails = (recipeId: number) => {
    // Assuming you have a recipe detail screen at 'app/recipe/[id].tsx'
    navigation.navigate('recipe', { screen: 'RecipeDetails', params: { id: recipeId } });
  };

  const navigateToAiMealPlan = () => {
    navigation.navigate('ai-meal-plan');
  };

  // New Recipe Card component
  const renderRecipeCard: ListRenderItem<Recipe> = ({ item }) => (
    <TouchableOpacity
      style={newStyles.recipeCard}
      onPress={() => viewRecipeDetails(item.id)}
    >
      <Image source={{ uri: item.image }} style={newStyles.recipeImage} />
      <View style={newStyles.recipeInfo}>
        <Text style={newStyles.recipeTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={newStyles.matchPercentage}>
          Match: {item.matchPercentage || 0}%
        </Text>
        <View style={newStyles.ingredientCounts}>
          <Text style={newStyles.usedCount}>Used: {item.usedIngredientCount || 0}</Text>
          <Text style={newStyles.missedCount}>Missed: {item.missedIngredientCount || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // New Recipe Suggestions Section
  const renderRecipeSuggestions = () => (
    <View style={newStyles.recipesSection}>
      <Text style={newStyles.sectionTitle}>Recipe Ideas</Text>
      {isLoadingSuggestions ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 40 }}/>
      ) : suggestedRecipes.length > 0 ? (
        <FlatList
          data={suggestedRecipes}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20, paddingBottom: 20 }}
        />
      ) : (
        <View style={newStyles.emptyMessageContainer}>
          <ChefHat size={32} color={theme.colors.textSecondary}/>
          <Text style={newStyles.emptyMessage}>
            {items.length > 0
              ? 'No recipe ideas found for your pantry.'
              : 'Add items to your pantry to get recipe ideas!'}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={newStyles.aiButton}
        onPress={navigateToAiMealPlan}
      >
        <Text style={newStyles.aiButtonText}>Create AI Meal Plan</Text>
      </TouchableOpacity>
    </View>
  );

  // ... (keep existing render functions: renderPantryItem, renderAddItemModal, renderUnitDropdown, etc.)
  const renderCategoriesHeader = () => (
    <View>
      {/* Categories Header */}
      <View style={styles.categoriesHeaderInList}>
        <Text style={styles.categoriesTitle}>Categories</Text>
        {(selectedCategory !== 'all' || activeExpiryFilter !== 'all') && (
          <TouchableOpacity onPress={() => {
            setSelectedCategory('all');
            setActiveExpiryFilter('all');
          }}>
            <Text style={styles.clearFilter}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScrollViewInList}
        contentContainerStyle={{ paddingRight: 20 }}
      >
        {CATEGORIES.map((category) => {
          const count = categoryStats[category.key] || 0;
          const isActive = selectedCategory === category.key;
          
          return (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryTab,
                isActive && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(category.key)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryContent}>
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text
                  style={[
                    styles.categoryTabText,
                    isActive && styles.categoryTabTextActive,
                  ]}
                >
                  {category.label}
                </Text>
                {count > 0 && (
                  <View style={[
                    styles.categoryBadge,
                    isActive && styles.categoryBadgeActive
                  ]}>
                    <Text style={[
                      styles.categoryBadgeText,
                      isActive && styles.categoryBadgeTextActive
                    ]}>
                      {count}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stats Bar - Integrated into header */}
      <View style={styles.statsBar}>
        <TouchableOpacity
          style={[styles.statItem, activeExpiryFilter === 'all' && styles.statItemActive]}
          onPress={() => handleExpiryFilterChange('all')}
          activeOpacity={0.7}
        >
          <Package size={14} color={activeExpiryFilter === 'all' ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={styles.statValue}>{categoryStats['all'] || 0}</Text>
          <Text style={styles.statLabel}>TOTAL</Text>
        </TouchableOpacity>
        
        <View style={styles.statDivider} />
        
        <TouchableOpacity
          style={[styles.statItem, activeExpiryFilter === 'expiring' && styles.statItemActive]}
          onPress={() => handleExpiryFilterChange(activeExpiryFilter === 'expiring' ? 'all' : 'expiring')}
          activeOpacity={0.7}
        >
          <AlertTriangle size={14} color={activeExpiryFilter === 'expiring' ? theme.colors.warning : theme.colors.textSecondary} />
          <Text style={styles.statValue}>
            {items.filter(item => {
              const days = getDaysUntilExpiry(item.expiry_date || '');
              return days !== null && days <= 3 && days >= 0;
            }).length}
          </Text>
          <Text style={styles.statLabel}>EXPIRING</Text>
        </TouchableOpacity>
        
        <View style={styles.statDivider} />
        
        <TouchableOpacity
          style={[styles.statItem, activeExpiryFilter === 'expired' && styles.statItemActive]}
          onPress={() => handleExpiryFilterChange(activeExpiryFilter === 'expired' ? 'all' : 'expired')}
          activeOpacity={0.7}
        >
          <Clock size={14} color={activeExpiryFilter === 'expired' ? theme.colors.error : theme.colors.textSecondary} />
          <Text style={styles.statValue}>
            {items.filter(item => {
              const days = getDaysUntilExpiry(item.expiry_date || '');
              return days !== null && days < 0;
            }).length}
          </Text>
          <Text style={styles.statLabel}>EXPIRED</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPantryItem: ListRenderItem<PantryItem> = ({ item, index }) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date || '');
    const expiryColor = getExpiryColor(daysUntilExpiry);

    const itemStyle = [
      styles.itemCard,
      {
        width: numColumns === 1 ? '100%' : itemWidth - 8,
        marginRight: numColumns > 1 && (index + 1) % numColumns !== 0 ? 8 : 0,
      }
    ];

    return (
      <TouchableOpacity
        style={itemStyle}
        activeOpacity={0.7}
      >
        <TouchableOpacity
          style={styles.itemActionsButton}
          onPress={() => setShowActionsMenu(showActionsMenu === item.id ? null : item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreVertical size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {showActionsMenu === item.id && (
          <View style={styles.actionsDropdown}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleEditItem(item)}
            >
              <Edit3 size={16} color="#10b981" />
              <Text style={[styles.actionText, { color: '#10b981' }]}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleDeleteItem(item.id)}
            >
              <Trash2 size={16} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.itemHeader}>
          <Image
            source={getItemImageSource(item.category)}
            style={styles.itemImage}
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={numColumns > 1 ? 2 : 1}>
              {item.name}
            </Text>
            {item.brand && (
              <Text style={styles.itemBrand} numberOfLines={1}>
                {item.brand}
              </Text>
            )}
          </View>
          <View style={styles.itemQuantityContainer}>
            <View style={styles.itemQuantity}>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <Text style={styles.quantityUnit}>{item.unit}</Text>
            </View>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.itemMeta}>
            <MapPin size={12} color={theme.colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>

          {item.expiry_date && (
            <View style={[styles.itemMeta, styles.expiryMeta]}>
              <Calendar size={12} color={expiryColor} />
              <Text style={[styles.metaText, { color: expiryColor }]} numberOfLines={1}>
                {daysUntilExpiry === 0
                  ? 'Today'
                  : daysUntilExpiry === 1
                  ? 'Tomorrow'
                  : daysUntilExpiry && daysUntilExpiry > 0
                  ? `${daysUntilExpiry}d`
                  : 'Expired'}
              </Text>
            </View>
          )}
        </View>

        {daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0 && (
          <View style={[styles.expiryIndicator, { backgroundColor: expiryColor }]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderAddItemModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowAddModal(false);
        resetNewItem();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Item' : 'Add New Item'}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setShowAddModal(false);
                resetNewItem();
              }}
              style={styles.modalCloseButton}
            >
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Milk, Chicken Breast"
                placeholderTextColor={theme.colors.inputPlaceholder}
                value={newItem.name}
                onChangeText={(text) => setNewItem({ ...newItem, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Brand (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Organic Valley"
                placeholderTextColor={theme.colors.inputPlaceholder}
                value={newItem.brand}
                onChangeText={(text) => setNewItem({ ...newItem, brand: text })}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={theme.colors.inputPlaceholder}
                  keyboardType="numeric"
                  value={newItem.quantity}
                  onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Unit</Text>
                <TouchableOpacity
                  style={styles.unitDropdownButton}
                  onPress={() => setShowUnitDropdown(true)}
                >
                  <Text style={styles.unitDropdownText}>
                    {UNITS.find(u => u.value === newItem.unit)?.label || newItem.unit}
                  </Text>
                  <ChevronDown size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryPicker}>
                  {CATEGORIES.slice(1).map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryChip,
                        newItem.category === cat.key && styles.categoryChipActive,
                      ]}
                      onPress={() => setNewItem({ ...newItem, category: cat.key })}
                    >
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text
                        style={[
                          styles.categoryLabel,
                          newItem.category === cat.key && styles.categoryLabelActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Storage Location</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.locationPicker}>
                  {LOCATIONS.map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      style={[
                        styles.locationChip,
                        newItem.location === loc && styles.locationChipActive,
                      ]}
                      onPress={() => setNewItem({ ...newItem, location: loc })}
                    >
                      <Text
                        style={[
                          styles.locationText,
                          newItem.location === loc && styles.locationTextActive,
                        ]}
                      >
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Expiry Date (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.inputPlaceholder}
                value={newItem.expiry_date}
                onChangeText={(text) => setNewItem({ ...newItem, expiry_date: text })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetNewItem();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.addButton} 
                onPress={editMode ? handleUpdateItem : handleAddItem}
              >
                <Text style={styles.addButtonText}>
                  {editMode ? 'Update Item' : 'Add Item'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderUnitDropdown = () => (
    <Modal
      visible={showUnitDropdown}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowUnitDropdown(false)}
    >
      <TouchableOpacity
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => setShowUnitDropdown(false)}
      >
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Select Unit</Text>
            <TouchableOpacity
              onPress={() => setShowUnitDropdown(false)}
              style={styles.dropdownCloseButton}
            >
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
            {UNITS.map((unit) => (
              <TouchableOpacity
                key={unit.value}
                style={[
                  styles.dropdownItem,
                  newItem.unit === unit.value && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  setNewItem({ ...newItem, unit: unit.value });
                  setShowUnitDropdown(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  newItem.unit === unit.value && styles.dropdownItemTextSelected
                ]}>
                  {unit.label} ({unit.value})
                </Text>
                <Text style={styles.dropdownItemCategory}>
                  {unit.category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your pantry...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Pantry</Text>
        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderPantryItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.searchContainer}>
              <Search size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                placeholderTextColor={theme.colors.inputPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            {renderCategoriesHeader()}
            {renderRecipeSuggestions()}
            <Text style={[styles.categoriesTitle, { marginTop: 16 }]}>Your Items</Text>
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPantryItems}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <View>
            {renderRecipeSuggestions()}
            <View style={styles.emptyState}>
              <Package size={56} color={theme.colors.textSecondary} strokeWidth={1.5} />
              <Text style={styles.emptyText}>
                {searchQuery || selectedCategory !== 'all' || activeExpiryFilter !== 'all'
                  ? 'No items found'
                  : 'Your pantry is empty'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedCategory !== 'all' || activeExpiryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Tap the + button to add items'}
              </Text>
            </View>
          </View>
        )}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapperStyle : undefined}
      />

      {renderAddItemModal()}
      {renderUnitDropdown()}
    </View>
  );
}

// Keep existing styles and add new ones
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
      },
      loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e5e7eb',
      },
      headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1f2937',
        letterSpacing: -0.5,
      },
      headerAddButton: {
        backgroundColor: '#10b981',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        marginTop: 20,
        paddingHorizontal: 16,
        borderRadius: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#e5e7eb',
      },
      searchInput: {
        flex: 1,
        paddingVertical: 8,
        paddingLeft: 12,
        fontSize: 16,
        color: '#1f2937',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
      },
      categoriesHeaderInList: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 0,
        marginTop: 16,
        marginBottom: 12,
      },
      categoriesScrollViewInList: {
        paddingLeft: 0,
        marginBottom: 8,
        height: 44,
      },
      categoriesTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        letterSpacing: -0.3,
      },
      clearFilter: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '500',
      },
      categoryTab: {
        paddingHorizontal: 20,
        marginRight: 12,
        borderRadius: 22,
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: 'transparent',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
      },
      categoryTabActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      },
      categoryContent: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      categoryEmoji: {
        fontSize: 18,
        marginRight: 8,
      },
      categoryTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        letterSpacing: -0.2,
      },
      categoryTabTextActive: {
        color: '#FFFFFF',
      },
      categoryBadge: {
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
        minWidth: 24,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
      },
      categoryBadgeActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
      },
      categoryBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6b7280',
      },
      categoryBadgeTextActive: {
        color: '#FFFFFF',
      },
      statsBar: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        marginHorizontal: 0,
        marginTop: 8,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
      },
      statItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 2,
      },
      statItemActive: {
        backgroundColor: '#10b98115',
        transform: [{ scale: 1.02 }],
      },
      statDivider: {
        width: 1,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 10,
        height: '50%',
        alignSelf: 'center',
      },
      statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginTop: 1,
      },
      statLabel: {
        fontSize: 9,
        color: '#6b7280',
        marginTop: 1,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '600',
      },
      flatListContainer: {
        flex: 1,
        paddingHorizontal: 20,
      },
      flatListContent: {
        paddingTop: 0,
        paddingBottom: 120,
        flexGrow: 1,
      },
      itemCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        position: 'relative',
        overflow: 'visible',
        minHeight: 120,
      },
      itemActionsButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      },
      actionsDropdown: {
        position: 'absolute',
        top: 36,
        right: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingVertical: 4,
        minWidth: 140,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
      },
      actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
      },
      actionDivider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 12,
      },
      actionText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1f2937',
        marginLeft: 12,
      },
      itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
      },
      itemImage: {
        width: 64,
        height: 64,
        borderRadius: 14,
        marginRight: 12,
        resizeMode: 'cover',
        backgroundColor: '#f3f4f6',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      itemInfo: {
        flex: 1,
        marginRight: 8,
      },
      itemName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1f2937',
        letterSpacing: -0.3,
        marginBottom: 2,
      },
      itemBrand: {
        fontSize: 14,
        color: '#6b7280',
        letterSpacing: -0.2,
      },
      itemQuantityContainer: {
        marginRight: 24,
      },
      itemQuantity: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'baseline',
      },
      quantityText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
      },
      quantityUnit: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 4,
        fontWeight: '500',
      },
      itemDetails: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      expiryMeta: {
        marginLeft: 16,
        flex: 1,
      },
      metaText: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 6,
        fontWeight: '500',
      },
      expiryIndicator: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 4,
        height: '100%',
      },
      emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
      },
      emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginTop: 16,
        letterSpacing: -0.3,
      },
      emptySubtext: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 6,
        letterSpacing: -0.2,
      },
      columnWrapperStyle: {
        justifyContent: 'space-between',
      },
      modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
      },
      modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        maxHeight: '90%',
      },
      modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      },
      modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
        letterSpacing: -0.5,
      },
      modalCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
      },
      formGroup: {
        marginBottom: 20,
      },
      formRow: {
        flexDirection: 'row',
      },
      label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 10,
        letterSpacing: -0.2,
      },
      input: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1f2937',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
      },
      pickerContainer: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
      },
      pickerText: {
        fontSize: 16,
        color: '#1f2937',
      },
      categoryPicker: {
        flexDirection: 'row',
        paddingRight: 20,
      },
      categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: '#f3f4f6',
        borderWidth: 2,
        borderColor: 'transparent',
        marginRight: 10,
      },
      categoryChipActive: {
        borderColor: '#10b981',
        backgroundColor: '#ecfdf5',
      },
      categoryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginLeft: 8,
        letterSpacing: -0.2,
      },
      categoryLabelActive: {
        color: '#10b981',
      },
      locationPicker: {
        flexDirection: 'row',
        paddingRight: 20,
      },
      locationChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        borderWidth: 1.5,
        borderColor: 'transparent',
        marginRight: 10,
      },
      locationChipActive: {
        borderColor: '#10b981',
        backgroundColor: '#ecfdf5',
      },
      locationText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
        letterSpacing: -0.2,
      },
      locationTextActive: {
        color: '#10b981',
        fontWeight: '600',
      },
      modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
      },
      cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        backgroundColor: 'transparent',
      },
      cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
        letterSpacing: -0.3,
      },
      addButton: {
        flex: 1,
        backgroundColor: '#10b981',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: -0.3,
      },
      unitDropdownButton: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      unitDropdownText: {
        fontSize: 16,
        color: '#1f2937',
        flex: 1,
      },
      dropdownOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
      },
      dropdownContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        maxHeight: '70%',
        width: '100%',
        maxWidth: 320,
      },
      dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
      },
      dropdownTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
      },
      dropdownCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
      },
      dropdownList: {
        maxHeight: 300,
      },
      dropdownItem: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e5e7eb',
      },
      dropdownItemSelected: {
        backgroundColor: '#10b98115',
      },
      dropdownItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
        marginBottom: 2,
      },
      dropdownItemTextSelected: {
        color: '#10b981',
        fontWeight: '600',
      },
      dropdownItemCategory: {
        fontSize: 12,
        color: '#6b7280',
        textTransform: 'capitalize',
      },
});

const newStyles = StyleSheet.create({
    recipesSection: {
        marginTop: 24,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
      },
      sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1f2937',
        paddingHorizontal: 20,
        marginBottom: 16,
        marginTop: 20,
      },
      recipeCard: {
        width: 220,
        height: 240,
        marginRight: 16,
        borderRadius: 16,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
      },
      recipeImage: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      },
      recipeInfo: {
        padding: 12,
        flex: 1,
        justifyContent: 'space-between',
      },
      recipeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
      },
      matchPercentage: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10b981',
      },
      ingredientCounts: {
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      usedCount: {
        fontSize: 12,
        color: '#0d6efd',
      },
      missedCount: {
        fontSize: 12,
        color: '#dc3545',
      },
      emptyMessageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        marginHorizontal: 20,
      },
      emptyMessage: {
        textAlign: 'center',
        marginTop: 12,
        fontSize: 15,
        color: '#6b7280',
      },
      aiButton: {
        backgroundColor: '#6610f2',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 20,
        marginHorizontal: 20,
        shadowColor: '#6610f2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      aiButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
      }
});
