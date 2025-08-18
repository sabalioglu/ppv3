// app/(tabs)/shopping-list.tsx - İmport düzeltmeleri

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { 
  Plus, 
  Search, 
  Filter, 
  ShoppingCart,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Package,
  X,
  Save,
  DollarSign,
  Tag,
  AlertCircle,
  TrendingUp
} from 'lucide-react-native';

// ✅ Theme import düzeltmesi - '@/' yerine '../../' kullan
import { colors, spacing, typography, shadows } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

// ✅ Interface tanımları aynı kalıyor...
interface ShoppingItem {
  id: string;
  user_id: string;
  item_name: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  quantity: number;
  unit: string;
  estimated_cost?: number;
  actual_cost?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  source?: 'manual' | 'auto_pantry' | 'recipe' | 'meal_plan' | 'ai_suggestion';
  source_id?: string;
  nutrition_goal?: string;
  store_section?: string;
  preferred_brand?: string;
  size_preference?: string;
  organic_preference: boolean;
  is_completed: boolean;
  completed_at?: string;
  pantry_item_id?: string;
  notes?: string;
  alternatives?: string[];
  coupons_available: boolean;
  seasonal_availability: boolean;
  sustainability_score?: number;
  created_at: string;
}

interface AddItemForm {
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_cost?: number;
  brand?: string;
  notes?: string;
  organic_preference: boolean;
}

// ✅ Categories ve Priorities tanımları
const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🛒', color: colors.neutral[500] },
  { id: 'fruits', name: 'Fruits', icon: '🍎', color: colors.success[500] },
  { id: 'vegetables', name: 'Vegetables', icon: '🥕', color: colors.success[600] },
  { id: 'dairy', name: 'Dairy', icon: '🥛', color: colors.primary[500] },
  { id: 'meat', name: 'Meat', icon: '🥩', color: colors.error[500] },
  { id: 'grains', name: 'Grains', icon: '🌾', color: colors.warning[500] },
  { id: 'snacks', name: 'Snacks', icon: '🍪', color: colors.secondary[500] },
  { id: 'beverages', name: 'Beverages', icon: '🥤', color: colors.accent[500] },
  { id: 'general', name: 'General', icon: '📦', color: colors.neutral[400] },
];

const PRIORITIES = [
  { id: 'low', name: 'Low', color: colors.success[500] },
  { id: 'medium', name: 'Medium', color: colors.warning[500] },
  { id: 'high', name: 'High', color: colors.error[500] },
  { id: 'urgent', name: 'Urgent', color: colors.error[700] },
];

const UNITS = ['piece', 'kg', 'g', 'l', 'ml', 'pack', 'bottle', 'can', 'box'];

export default function ShoppingList() {
  // ✅ State Management - Aynı kalıyor
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [addingItem, setAddingItem] = useState(false);

  // ✅ Add Item Form State
  const [addItemForm, setAddItemForm] = useState<AddItemForm>({
    item_name: '',
    category: 'general',
    quantity: 1,
    unit: 'piece',
    priority: 'medium',
    estimated_cost: undefined,
    brand: '',
    notes: '',
    organic_preference: false,
  });

  // ✅ CRUD Operations - Aynı kalıyor, sadece error handling geliştirildi
  const loadShoppingItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Shopping items loaded:', data?.length || 0);
      setItems(data || []);
    } catch (error) {
      console.error('Error loading shopping items:', error);
      // Eğer tablo yoksa mock data ile çalış
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddItem = async () => {
    if (!addItemForm.item_name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    try {
      setAddingItem(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to add items');
        return;
      }

      const itemData = {
        user_id: user.id,
        item_name: addItemForm.item_name.trim(),
        category: addItemForm.category,
        quantity: addItemForm.quantity,
        unit: addItemForm.unit,
        priority: addItemForm.priority,
        estimated_cost: addItemForm.estimated_cost || null,
        brand: addItemForm.brand?.trim() || null,
        notes: addItemForm.notes?.trim() || null,
        organic_preference: addItemForm.organic_preference,
        source: 'manual' as const,
        is_completed: false,
        coupons_available: false,
        seasonal_availability: true,
      };

      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setItems(prev => [data, ...prev]);
      
      // Reset form
      setAddItemForm({
        item_name: '',
        category: 'general',
        quantity: 1,
        unit: 'piece',
        priority: 'medium',
        estimated_cost: undefined,
        brand: '',
        notes: '',
        organic_preference: false,
      });
      
      setShowAddModal(false);
      
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item to shopping list');
    } finally {
      setAddingItem(false);
    }
  };

  const handleToggleComplete = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const newCompletedState = !item.is_completed;
      const updateData = {
        is_completed: newCompletedState,
        completed_at: newCompletedState ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('shopping_list_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      setItems(prev => prev.map(i => 
        i.id === itemId 
          ? { ...i, ...updateData }
          : i
      ));

    } catch (error) {
      console.error('Error toggling completion:', error);
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('shopping_list_items')
                .delete()
                .eq('id', itemId);

              if (error) throw error;

              // Remove from local state
              setItems(prev => prev.filter(i => i.id !== itemId));
              
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  // ✅ Filtering ve Statistics
  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchText.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
                         item.notes?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesCompletion = showCompleted ? item.is_completed : !item.is_completed;
    
    return matchesSearch && matchesCategory && matchesCompletion;
  });

  const stats = {
    total: items.length,
    completed: items.filter(item => item.is_completed).length,
    pending: items.filter(item => !item.is_completed).length,
    estimated_cost: items.reduce((sum, item) => sum + (item.estimated_cost || 0), 0),
    urgent: items.filter(item => item.priority === 'urgent' && !item.is_completed).length,
  };

  // ✅ Effects
  useEffect(() => {
    loadShoppingItems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadShoppingItems();
  };

  // ✅ Render Functions
  const renderShoppingItem = ({ item }: { item: ShoppingItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleToggleComplete(item.id)}
        >
          {item.is_completed ? (
            <CheckCircle2 size={24} color={colors.success[500]} />
          ) : (
            <Circle size={24} color={colors.neutral[400]} />
          )}
        </TouchableOpacity>
        
        <View style={styles.itemContent}>
          <Text style={[
            styles.itemName,
            item.is_completed && styles.completedText
          ]}>
            {item.item_name}
          </Text>
          
          {item.brand && (
            <Text style={styles.itemBrand}>{item.brand}</Text>
          )}
          
          <View style={styles.itemMeta}>
            <Text style={styles.itemQuantity}>
              {item.quantity} {item.unit}
            </Text>
            
            {item.estimated_cost && (
              <Text style={styles.itemCost}>
                ${item.estimated_cost.toFixed(2)}
              </Text>
            )}
            
            <View style={[
              styles.priorityBadge,
              { backgroundColor: PRIORITIES.find(p => p.id === item.priority)?.color + '20' }
            ]}>
              <Text style={[
                styles.priorityText,
                { color: PRIORITIES.find(p => p.id === item.priority)?.color }
              ]}>
                {item.priority}
              </Text>
            </View>
          </View>
          
          {item.notes && (
            <Text style={styles.itemNotes}>{item.notes}</Text>
          )}
        </View>
        
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteItem(item.id)}
          >
            <Trash2 size={18} color={colors.error[500]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ShoppingCart size={48} color={colors.neutral[300]} />
      <Text style={styles.emptyTitle}>
        {showCompleted ? 'No completed items' : 'Your shopping list is empty'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {showCompleted 
          ? 'Complete some items to see them here'
          : 'Add items to get started with your shopping list'
        }
      </Text>
      {!showCompleted && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.emptyButtonText}>Add First Item</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading shopping list...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shopping List</Text>
          <Text style={styles.headerSubtitle}>
            {stats.pending} pending • {stats.completed} completed
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          {stats.urgent > 0 && (
            <View style={styles.urgentBadge}>
              <AlertCircle size={16} color={colors.error[700]} />
              <Text style={styles.urgentText}>{stats.urgent}</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color={colors.neutral[0]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${stats.estimated_cost.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Est. Cost</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round((stats.completed / (stats.total || 1)) * 100)}%</Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
      </View>

      {/* Search and Toggle */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={colors.neutral[400]}
          />
        </View>
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              !showCompleted && styles.toggleButtonActive
            ]}
            onPress={() => setShowCompleted(false)}
          >
            <Text style={[
              styles.toggleText,
              !showCompleted && styles.toggleTextActive
            ]}>
              Pending ({stats.pending})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showCompleted && styles.toggleButtonActive
            ]}
            onPress={() => setShowCompleted(true)}
          >
            <Text style={[
              styles.toggleText,
              showCompleted && styles.toggleTextActive
            ]}>
              Completed ({stats.completed})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Tabs */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={item => item.id}
        style={styles.categoryTabs}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryTab,
              selectedCategory === item.id && { backgroundColor: item.color + '20' }
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text style={styles.categoryEmoji}>{item.icon}</Text>
            <Text style={[
              styles.categoryText,
              selectedCategory === item.id && { color: item.color, fontWeight: '600' }
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Shopping Items List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderShoppingItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        style={styles.itemsList}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Item Modal - Basitleştirilmiş */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Item</Text>
            <TouchableOpacity
              onPress={handleAddItem}
              style={[
                styles.modalSaveButton,
                (!addItemForm.item_name.trim() || addingItem) && styles.modalSaveButtonDisabled
              ]}
              disabled={!addItemForm.item_name.trim() || addingItem}
            >
              {addingItem ? (
                <ActivityIndicator size="small" color={colors.neutral[0]} />
              ) : (
                <Save size={20} color={colors.neutral[0]} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Item Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Item Name *</Text>
              <TextInput
                style={styles.formInput}
                value={addItemForm.item_name}
                onChangeText={(text) => setAddItemForm(prev => ({ ...prev, item_name: text }))}
                placeholder="e.g., Bananas, Milk, Bread"
                placeholderTextColor={colors.neutral[400]}
                autoFocus
              />
            </View>

            {/* Quantity */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Quantity</Text>
              <TextInput
                style={styles.formInput}
                value={addItemForm.quantity.toString()}
                onChangeText={(text) => {
                  const num = parseFloat(text) || 1;
                  setAddItemForm(prev => ({ ...prev, quantity: num }));
                }}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.notesInput]}
                value={addItemForm.notes}
                onChangeText={(text) => setAddItemForm(prev => ({ ...prev, notes: text }))}
                placeholder="Any special notes..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ✅ Simplified Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.neutral[800],
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  urgentText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.error[700],
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.neutral[800],
    marginLeft: spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.neutral[0],
    ...shadows.sm,
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  toggleTextActive: {
    color: colors.neutral[800],
    fontWeight: '600',
  },
  categoryTabs: {
    paddingLeft: spacing.lg,
    marginBottom: spacing.md,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  itemCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
  },
  checkbox: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.neutral[400],
  },
  itemBrand: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  itemQuantity: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  itemCost: {
    fontSize: typography.fontSize.sm,
    color: colors.success[600],
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemNotes: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  itemActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.neutral[700],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 16,
  },
  emptyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[0],
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  modalSaveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.neutral[800],
    backgroundColor: colors.neutral[0],
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});
