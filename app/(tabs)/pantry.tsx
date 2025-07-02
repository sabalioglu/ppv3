import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, ActivityIndicator, Platform, KeyboardAvoidingView,
  RefreshControl, Dimensions, FlatList, ListRenderItem, Image,
} from 'react-native';
import {
  Plus, Search, Package, Calendar, AlertTriangle, X, Clock,
  MapPin, ChevronDown,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { colors } from '@/lib/theme';

// ✅ UPDATED: Kategori görselleri (256x256 WebP format, optimize edilmiş görüntüleme)
const categoryImages = {
  dairy: require('../../../assets/images/categoryImages/dairy.webp'),
  meat: require('../../../assets/images/categoryImages/meat.webp'),
  vegetables: require('../../../assets/images/categoryImages/vegetables.webp'),
  fruits: require('../../../assets/images/categoryImages/fruits.webp'),
  grains: require('../../../assets/images/categoryImages/grains.webp'),
  snacks: require('../../../assets/images/categoryImages/snacks.webp'),
  beverages: require('../../../assets/images/categoryImages/beverages.webp'),
  condiments: require('../../../assets/images/categoryImages/condiments.webp'),
  frozen: require('../../../assets/images/categoryImages/frozen.webp'),
  canned: require('../../../assets/images/categoryImages/canned.webp'),
  bakery: require('../../../assets/images/categoryImages/bakery.webp'),
  default: require('../../../assets/images/categoryImages/default.webp'),
};

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

export default function PantryScreen() {
  const { theme, isDark } = useTheme();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryStats, setCategoryStats] = useState<{ [key: string]: number }>({});
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  
  // ✅ Interactive Stats Bar State
  const [activeExpiryFilter, setActiveExpiryFilter] = useState<'all' | 'expiring' | 'expired'>('all');

  // ✅ RESPONSIVE: Dynamic screen dimensions
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.window);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  // ✅ RESPONSIVE: Enhanced grid calculation
  const getGridLayout = () => {
    const { width } = screenData;
    const horizontalPadding = 40;
    const itemSpacing = 12;
    
    let numColumns = width >= 1024 ? 3 : width >= 768 ? 2 : 1;
    const availableWidth = width - horizontalPadding;
    const itemWidth = (availableWidth - (numColumns - 1) * itemSpacing) / numColumns;
    
    return { numColumns, itemWidth };
  };

  const { numColumns, itemWidth } = getGridLayout();

  // Form states for new item
  const [newItem, setNewItem] = useState({
    name: '',
    brand: '',
    category: 'vegetables',
    quantity: '1',
    unit: 'pcs',
    expiry_date: '',
    location: 'Fridge',
  });

  useEffect(() => {
    loadPantryItems();
  }, []);

  // ✅ ENHANCED: Filter with expiry logic
  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory, activeExpiryFilter]);

  const loadPantryItems = async () => {
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
      
      // Calculate category statistics
      const stats: { [key: string]: number } = {};
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

  // ✅ ENHANCED: Multi-filter logic
  const filterItems = () => {
    let filtered = items;

    // 1. Apply Expiry Filter First
    if (activeExpiryFilter === 'expiring') {
      filtered = filtered.filter(item => {
        const days = getDaysUntilExpiry(item.expiry_date || '');
        return days !== null && days <= 3 && days >= 0;
      });
    } else if (activeExpiryFilter === 'expired') {
      filtered = filtered.filter(item => {
        const days = getDaysUntilExpiry(item.expiry_date || '');
        return days !== null && days < 0;
      });
    }

    // 2. Apply Category Filter (when expiry filter is 'all')
    if (selectedCategory !== 'all' && activeExpiryFilter === 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // 3. Apply Search Filter (always active)
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  // ✅ Expiry filter handler
  const handleExpiryFilterChange = (filter: 'all' | 'expiring' | 'expired') => {
    setActiveExpiryFilter(filter);
    if (filter !== 'all') {
      setSelectedCategory('all');
    }
  };

  const handleAddItem = async () => {
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
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Could not delete item');
            }
          },
        },
      ]
    );
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

  // ✅ UPDATED: Kategori görsellerini getiren fonksiyon
  const getItemImageSource = (category: string) => {
    return categoryImages[category as keyof typeof categoryImages] || categoryImages.default;
  };

  // ✅ ENHANCED: Optimize edilmiş görsel ile ürün renderı
  const renderPantryItem: ListRenderItem<PantryItem> = ({ item }) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date || '');
    const expiryColor = getExpiryColor(daysUntilExpiry);

    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          { width: numColumns === 1 ? '100%' : itemWidth }
        ]}
        onLongPress={() => handleDeleteItem(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          {/* ✅ OPTIMIZED: Kategori Görseli */}
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
          <View style={styles.itemQuantity}>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <Text style={styles.quantityUnit}>{item.unit}</Text>
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

  // Unit Dropdown Modal
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

  // Add Item Modal
  const renderAddItemModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Item</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(false)}
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

              <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ✅ OPTIMIZED STYLES - 256x256 WebP Desteği
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: 20,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
    },
    headerAddButton: {
      backgroundColor: theme.colors.primary,
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? theme.colors.surface : colors.neutral[100],
      marginHorizontal: 20,
      marginTop: 20,
      paddingHorizontal: 16,
      borderRadius: 16,
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 8,
      paddingLeft: 12,
      fontSize: 16,
      color: theme.colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    statsBar: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    statItemActive: {
      backgroundColor: theme.colors.primary + '15',
      transform: [{ scale: 1.02 }],
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.colors.borderLight,
      marginHorizontal: 10,
      height: '50%',
      alignSelf: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginTop: 2,
    },
    statLabel: {
      fontSize: 9,
      color: theme.colors.textSecondary,
      marginTop: 1,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '600',
    },
    categoriesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 16,
      marginBottom: 12,
    },
    categoriesTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      letterSpacing: -0.3,
    },
    clearFilter: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    categoriesContainer: {
      paddingLeft: 20,
      marginBottom: 16,
      height: 44,
    },
    categoryTab: {
      paddingHorizontal: 20,
      marginRight: 12,
      borderRadius: 22,
      backgroundColor: isDark ? theme.colors.surface : colors.neutral[100],
      borderWidth: 1.5,
      borderColor: 'transparent',
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryTabActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
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
      color: theme.colors.textSecondary,
      letterSpacing: -0.2,
    },
    categoryTabTextActive: {
      color: '#FFFFFF',
    },
    categoryBadge: {
      backgroundColor: isDark ? colors.neutral[700] : colors.neutral[300],
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
      color: theme.colors.textSecondary,
    },
    categoryBadgeTextActive: {
      color: '#FFFFFF',
    },
    itemCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      position: 'relative',
      overflow: 'hidden',
      minHeight: 120,
    },
    // ✅ OPTIMIZED: 256x256 WebP için optimize edilmiş görsel boyutu
    itemImage: {
      width: 64,               // ✅ Optimal visual impact için artırıldı
      height: 64,              // ✅ 256x256 kaynak için ideal display size
      borderRadius: 14,        // ✅ Proporsiyon için büyütüldü
      marginRight: 12,
      resizeMode: 'cover',     // ✅ Yüksek çözünürlük görseller için 'cover'
      backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100],
      // ✅ Derinlik için subtle shadow eklendi
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    itemInfo: {
      flex: 1,
      marginRight: 12,
    },
    itemName: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      letterSpacing: -0.3,
      marginBottom: 2,
    },
    itemBrand: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      letterSpacing: -0.2,
    },
    itemQuantity: {
      backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100],
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    quantityText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    quantityUnit: {
      fontSize: 12,
      color: theme.colors.textSecondary,
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
      color: theme.colors.textSecondary,
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
    flatListContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },
    flatListContent: {
      paddingTop: 8,
      paddingBottom: 120,
      flexGrow: 1,
    },
    columnWrapperStyle: {
      justifyContent: 'space-between',
      marginBottom: 12,
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
      color: theme.colors.textPrimary,
      marginTop: 16,
      letterSpacing: -0.3,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 6,
      letterSpacing: -0.2,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
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
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100],
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
      color: theme.colors.textPrimary,
      marginBottom: 10,
      letterSpacing: -0.2,
    },
    input: {
      backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100],
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    unitDropdownButton: {
      backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100],
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    unitDropdownText: {
      fontSize: 16,
      color: theme.colors.textPrimary,
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
      backgroundColor: theme.colors.surface,
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
      borderBottomColor: theme.colors.border,
    },
    dropdownTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    dropdownCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100],
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
      borderBottomColor: theme.colors.border,
    },
    dropdownItemSelected: {
      backgroundColor: theme.colors.primary + '15',
    },
    dropdownItemText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    dropdownItemTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    dropdownItemCategory: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textTransform: 'capitalize',
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
      backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100],
      borderWidth: 2,
      borderColor: 'transparent',
      marginRight: 10,
    },
    categoryChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '15',
    },
    categoryLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginLeft: 8,
      letterSpacing: -0.2,
    },
    categoryLabelActive: {
      color: theme.colors.primary,
    },
    locationPicker: {
      flexDirection: 'row',
      paddingRight: 20,
    },
    locationChip: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100],
      borderWidth: 1.5,
      borderColor: 'transparent',
      marginRight: 10,
    },
    locationChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '15',
    },
    locationText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      letterSpacing: -0.2,
    },
    locationTextActive: {
      color: theme.colors.primary,
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
      borderColor: theme.colors.border,
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      letterSpacing: -0.3,
    },
    addButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      shadowColor: theme.colors.primary,
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
  });

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
      {/* Header */}
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

      {/* Search Bar */}
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

      {/* ✅ INTERACTIVE STATS BAR */}
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

      {/* Categories Header */}
      <View style={styles.categoriesHeader}>
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

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
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

      {/* ✅ FIXED: Items List with proper spacing */}
      <FlatList
        data={filteredItems}
        renderItem={renderPantryItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPantryItems}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={() => (
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
        )}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapperStyle : undefined}
      />

      {/* Add Item Modal */}
      {renderAddItemModal()}

      {/* Unit Dropdown Modal */}
      {renderUnitDropdown()}
    </View>
  );
}
