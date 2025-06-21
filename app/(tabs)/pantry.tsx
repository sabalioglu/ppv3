import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import {
  Plus,
  Search,
  Filter,
  Package,
  Calendar,
  AlertTriangle,
  X,
  Camera,
  Barcode,
  Clock,
  MapPin,
  TrendingUp,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { colors } from '@/lib/theme';
import type { Theme } from '@/lib/theme';

const { width: screenWidth } = Dimensions.get('window');

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

const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'oz', 'lb', 'cups', 'tbsp', 'tsp'];

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
  const [categoryStats, setCategoryStats] = useState<{[key: string]: number}>({});

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

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory]);

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
    let filtered = items;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

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

  const renderPantryItem = (item: PantryItem) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date || '');
    const expiryColor = getExpiryColor(daysUntilExpiry);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.itemCard}
        onLongPress={() => handleDeleteItem(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
          </View>
          <View style={styles.itemQuantity}>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <Text style={styles.quantityUnit}>{item.unit}</Text>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.itemMeta}>
            <MapPin size={12} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>

          {item.expiry_date && (
            <View style={[styles.itemMeta, styles.expiryMeta]}>
              <Calendar size={12} color={expiryColor} />
              <Text style={[styles.metaText, { color: expiryColor }]}>
                {daysUntilExpiry === 0
                  ? 'Expires today'
                  : daysUntilExpiry === 1
                  ? 'Tomorrow'
                  : daysUntilExpiry && daysUntilExpiry > 0
                  ? `${daysUntilExpiry} days`
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
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerText}>{newItem.unit}</Text>
                </View>
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

  // Dynamic styles
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
    categoriesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 24,
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
    statsBar: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      marginHorizontal: 20,
      marginBottom: 20,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.colors.borderLight,
      marginHorizontal: 16,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginTop: 4,
    },
    statLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '600',
    },
    itemsList: {
      flex: 1,
      paddingHorizontal: 20,
    },
    itemsGrid: {
      paddingTop: 8,
      paddingBottom: 100,
    },
    itemCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      position: 'relative',
      overflow: 'hidden',
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
    },
    expiryMeta: {
      marginLeft: 16,
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
    pickerContainer: {
      backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100],
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 14,
    },
    pickerText: {
      fontSize: 16,
      color: theme.colors.textPrimary,
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

      {/* Categories Header */}
      <View style={styles.categoriesHeader}>
        <Text style={styles.categoriesTitle}>Categories</Text>
        {selectedCategory !== 'all' && (
          <TouchableOpacity onPress={() => setSelectedCategory('all')}>
            <Text style={styles.clearFilter}>Clear Filter</Text>
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

      {/* Quick Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Package size={18} color={theme.colors.primary} />
          <Text style={styles.statValue}>{categoryStats['all'] || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <AlertTriangle size={18} color={theme.colors.warning} />
          <Text style={styles.statValue}>
            {items.filter(item => {
              const days = getDaysUntilExpiry(item.expiry_date || '');
              return days !== null && days <= 3 && days >= 0;
            }).length}
          </Text>
          <Text style={styles.statLabel}>Expiring</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Clock size={18} color={theme.colors.error} />
          <Text style={styles.statValue}>
            {items.filter(item => {
              const days = getDaysUntilExpiry(item.expiry_date || '');
              return days !== null && days < 0;
            }).length}
          </Text>
          <Text style={styles.statLabel}>Expired</Text>
        </View>
      </View>

      {/* Items List */}
      <ScrollView
        style={styles.itemsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPantryItems}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={56} color={theme.colors.textSecondary} strokeWidth={1.5} />
            <Text style={styles.emptyText}>
              {searchQuery || selectedCategory !== 'all'
                ? 'No items found'
                : 'Your pantry is empty'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Tap the + button to add items'}
            </Text>
          </View>
        ) : (
          <View style={styles.itemsGrid}>
            {filteredItems.map(renderPantryItem)}
          </View>
        )}
      </ScrollView>

      {/* Add Item Modal */}
      {renderAddItemModal()}
    </View>
  );
}
