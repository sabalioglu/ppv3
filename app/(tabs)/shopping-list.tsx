//app/(tabs)/shopping-list.tsx
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
  ScrollView,
} from 'react-native';
import { 
  Plus, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
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

// ✅ Theme import düzeltmesi
import { colors, spacing, typography, shadows } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

// ✅ Interface tanımları
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
  // ✅ State Management
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  
  // ✅ NEW: Dropdown states
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showPriorityFilter, setShowPriorityFilter] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  // 🆕 Edit states
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  
  // 🆕 Add Modal Dropdown states
  const [showAddUnitDropdown, setShowAddUnitDropdown] = useState(false);
  const [showAddCategoryDropdown, setShowAddCategoryDropdown] = useState(false);
  const [showAddPriorityDropdown, setShowAddPriorityDropdown] = useState(false);
  
  const [editForm, setEditForm] = useState({
    item_name: '',
    category: 'general',
    quantity: 1,
    unit: 'piece',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    estimated_cost: 0,
    brand: '',
    notes: '',
  });

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

  // ✅ CRUD Operations
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

      setItems(prev => [data, ...prev]);
      
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

  // 🆕 Edit Item Function
  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setEditForm({
      item_name: item.item_name,
      category: item.category || 'general',
      quantity: item.quantity,
      unit: item.unit,
      priority: item.priority || 'medium',
      estimated_cost: item.estimated_cost || 0,
      brand: item.brand || '',
      notes: item.notes || '',
    });
    setShowEditModal(true);
  };

  // 🆕 Update Item Function
  const handleUpdateItem = async () => {
    if (!editingItem || !editForm.item_name.trim()) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to update items');
        return;
      }

      const updateData = {
        item_name: editForm.item_name.trim(),
        category: editForm.category,
        quantity: editForm.quantity,
        unit: editForm.unit,
        priority: editForm.priority,
        estimated_cost: editForm.estimated_cost || null,
        brand: editForm.brand?.trim() || null,
        notes: editForm.notes?.trim() || null,
      };

      const { data, error } = await supabase
        .from('shopping_list_items')
        .update(updateData)
        .eq('id', editingItem.id)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === editingItem.id ? { ...item, ...updateData } : item
      ));
      
      setShowEditModal(false);
      setEditingItem(null);
      Alert.alert('Success', 'Item updated successfully!');

    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Failed to update item');
    }
  };

  // 🆕 Cancel Edit Function
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingItem(null);
    setShowUnitDropdown(false);
    setShowCategoryDropdown(false);
    setShowPriorityDropdown(false);
    setEditForm({
      item_name: '',
      category: 'general',
      quantity: 1,
      unit: 'piece',
      priority: 'medium',
      estimated_cost: 0,
      brand: '',
      notes: '',
    });
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

  // ✅ NEW: Pantry Integration Function
  const addMissingFromPantry = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: lowStockItems, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', user.id)
        .lt('quantity', 2);

      if (error) throw error;
      if (!lowStockItems || lowStockItems.length === 0) {
        Alert.alert('Info', 'No low stock items found in pantry');
        return;
      }

      const shoppingItems = lowStockItems.map(item => ({
        user_id: user.id,
        item_name: item.name,
        category: item.category,
        quantity: 1,
        unit: item.unit,
        source: 'auto_pantry' as const,
        pantry_item_id: item.id,
        priority: 'medium' as const,
        notes: `Running low (${item.quantity} ${item.unit} left)`,
        is_completed: false,
        organic_preference: false,
        coupons_available: false,
        seasonal_availability: true,
      }));

      const { data, error: insertError } = await supabase
        .from('shopping_list_items')
        .insert(shoppingItems)
        .select();

      if (insertError) throw insertError;

      setItems(prev => [...(data || []), ...prev]);
      
      Alert.alert('Success', `Added ${lowStockItems.length} low stock items`);
      setShowQuickActions(false);

    } catch (error) {
      console.error('Error adding from pantry:', error);
      Alert.alert('Error', 'Failed to add items from pantry');
    }
  };

  // ✅ NEW: Clear Completed Function
  const handleClearCompleted = async () => {
    const completedItems = items.filter(item => item.is_completed);
    
    if (completedItems.length === 0) {
      Alert.alert('Info', 'No completed items to clear');
      return;
    }

    Alert.alert(
      'Clear Completed Items',
      `Delete ${completedItems.length} completed items?`,
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
                .in('id', completedItems.map(item => item.id));

              if (error) throw error;
              setItems(prev => prev.filter(item => !item.is_completed));
              setShowQuickActions(false);
              
            } catch (error) {
              console.error('Error clearing completed items:', error);
              Alert.alert('Error', 'Failed to clear completed items');
            }
          }
        }
      ]
    );
  };

  // ✅ Filtering with priority support
  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchText.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
                         item.notes?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesCompletion = showCompleted ? item.is_completed : !item.is_completed;
    const matchesPriority = selectedPriorities.length === 0 || 
                           (item.priority && selectedPriorities.includes(item.priority));
    
    return matchesSearch && matchesCategory && matchesCompletion && matchesPriority;
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

  // ✅ Updated Render Function with Edit
  const renderShoppingItem = ({ item }: { item: ShoppingItem }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => handleEditItem(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={(e) => {
            e.stopPropagation();
            handleToggleComplete(item.id);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteItem(item.id);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={18} color={colors.error[500]} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 🆕 Edit Indicator */}
      <View style={styles.editIndicator}>
        <Edit3 size={14} color={colors.neutral[400]} />
        <Text style={styles.editHint}>Tap to edit</Text>
      </View>
    </TouchableOpacity>
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
      {/* ✅ Header with Dropdown Toggle */}
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

      {/* ✅ Compact Stats Row */}
      <View style={styles.compactStatsRow}>
        <View style={styles.compactStat}>
          <Text style={styles.compactStatValue}>{stats.total}</Text>
          <Text style={styles.compactStatLabel}>Items</Text>
        </View>
        <View style={styles.compactStat}>
          <Text style={styles.compactStatValue}>${stats.estimated_cost.toFixed(2)}</Text>
          <Text style={styles.compactStatLabel}>Cost</Text>
        </View>
        <View style={styles.compactStat}>
          <Text style={styles.compactStatValue}>{Math.round((stats.completed / (stats.total || 1)) * 100)}%</Text>
          <Text style={styles.compactStatLabel}>Done</Text>
        </View>
        
        <View style={styles.compactSearchContainer}>
          <Search size={16} color={colors.neutral[400]} />
          <TextInput
            style={styles.compactSearchInput}
            placeholder="Search..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={colors.neutral[400]}
          />
        </View>
      </View>

      {/* ✅ Quick Actions Dropdown Button */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionsButton}
          onPress={() => setShowQuickActions(!showQuickActions)}
        >
          <Text style={styles.quickActionsButtonText}>Quick Actions</Text>
          {showQuickActions ? (
            <ChevronUp size={20} color={colors.neutral[600]} />
          ) : (
            <ChevronDown size={20} color={colors.neutral[600]} />
          )}
        </TouchableOpacity>

        {/* Toggle Buttons */}
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
              Done ({stats.completed})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ Dropdown Menu Content */}
      {showQuickActions && (
        <View style={styles.dropdownContent}>
          {/* Quick Actions */}
          <View style={styles.dropdownSection}>
            <Text style={styles.dropdownSectionTitle}>Quick Actions</Text>
            <View style={styles.dropdownActions}>
              <TouchableOpacity
                style={styles.dropdownActionButton}
                onPress={addMissingFromPantry}
              >
                <Package size={18} color={colors.primary[500]} />
                <Text style={styles.dropdownActionText}>Add from Pantry</Text>
              </TouchableOpacity>
              
              {stats.completed > 0 && (
                <TouchableOpacity
                  style={styles.dropdownActionButton}
                  onPress={handleClearCompleted}
                >
                  <Trash2 size={18} color={colors.error[500]} />
                  <Text style={[styles.dropdownActionText, { color: colors.error[500] }]}>
                    Clear Completed ({stats.completed})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Filter */}
          <View style={styles.dropdownSection}>
            <Text style={styles.dropdownSectionTitle}>Categories</Text>
            <View style={styles.dropdownCategoryGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.dropdownCategoryItem,
                    selectedCategory === category.id && styles.dropdownCategoryItemActive
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.dropdownCategoryEmoji}>{category.icon}</Text>
                  <Text style={[
                    styles.dropdownCategoryText,
                    selectedCategory === category.id && styles.dropdownCategoryTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Filter */}
          <View style={styles.dropdownSection}>
            <Text style={styles.dropdownSectionTitle}>Priority Filter</Text>
            <View style={styles.dropdownPriorityGrid}>
              {PRIORITIES.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[
                    styles.dropdownPriorityItem,
                    selectedPriorities.includes(priority.id) && {
                      backgroundColor: priority.color + '20',
                      borderColor: priority.color,
                    }
                  ]}
                  onPress={() => {
                    if (selectedPriorities.includes(priority.id)) {
                      setSelectedPriorities(prev => prev.filter(p => p !== priority.id));
                    } else {
                      setSelectedPriorities(prev => [...prev, priority.id]);
                    }
                  }}
                >
                  <View style={[
                    styles.priorityDot,
                    { backgroundColor: priority.color }
                  ]} />
                  <Text style={[
                    styles.dropdownPriorityText,
                    selectedPriorities.includes(priority.id) && { color: priority.color, fontWeight: '600' }
                  ]}>
                    {priority.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ✅ Main Content List */}
      <View style={styles.mainContent}>
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id}
          renderItem={renderShoppingItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={filteredItems.length === 0 ? styles.emptyListContent : undefined}
        />
      </View>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setShowAddUnitDropdown(false);
                setShowAddCategoryDropdown(false);
                setShowAddPriorityDropdown(false);
              }}
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

          <ScrollView 
            style={styles.modalContent} 
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => {
              setShowAddUnitDropdown(false);
              setShowAddCategoryDropdown(false);
              setShowAddPriorityDropdown(false);
            }}
          >
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

            {/* Quantity & Unit */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
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
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Unit</Text>
                <TouchableOpacity
                  style={styles.unitDropdownButton}
                  onPress={() => setShowAddUnitDropdown(!showAddUnitDropdown)}
                >
                  <Text style={styles.unitDropdownButtonText}>{addItemForm.unit}</Text>
                  <ChevronDown size={16} color={colors.neutral[500]} />
                </TouchableOpacity>
                
                {showAddUnitDropdown && (
                  <View style={styles.unitDropdownMenu}>
                    <ScrollView style={styles.unitDropdownScroll} nestedScrollEnabled>
                      {UNITS.map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitDropdownItem,
                            addItemForm.unit === unit && styles.unitDropdownItemActive
                          ]}
                          onPress={() => {
                            setAddItemForm(prev => ({ ...prev, unit }));
                            setShowAddUnitDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.unitDropdownItemText,
                            addItemForm.unit === unit && styles.unitDropdownItemTextActive
                          ]}>
                            {unit}
                          </Text>
                          {addItemForm.unit === unit && (
                            <CheckCircle2 size={16} color={colors.primary[500]} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category</Text>
              <TouchableOpacity
                style={styles.categoryDropdownButton}
                onPress={() => setShowAddCategoryDropdown(!showAddCategoryDropdown)}
              >
                <View style={styles.categoryDropdownSelected}>
                  <Text style={styles.categoryDropdownEmoji}>
                    {CATEGORIES.find(c => c.id === addItemForm.category)?.icon || '📦'}
                  </Text>
                  <Text style={styles.categoryDropdownButtonText}>
                    {CATEGORIES.find(c => c.id === addItemForm.category)?.name || 'General'}
                  </Text>
                </View>
                <ChevronDown size={16} color={colors.neutral[500]} />
              </TouchableOpacity>
              
              {showAddCategoryDropdown && (
                <View style={styles.categoryDropdownMenu}>
                  <ScrollView style={styles.categoryDropdownScroll} nestedScrollEnabled>
                    {CATEGORIES.slice(1).map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryDropdownItem,
                          addItemForm.category === category.id && styles.categoryDropdownItemActive
                        ]}
                        onPress={() => {
                          setAddItemForm(prev => ({ ...prev, category: category.id }));
                          setShowAddCategoryDropdown(false);
                        }}
                      >
                        <View style={styles.categoryDropdownItemContent}>
                          <Text style={styles.categoryDropdownItemEmoji}>
                            {category.icon}
                          </Text>
                          <Text style={[
                            styles.categoryDropdownItemText,
                            addItemForm.category === category.id && styles.categoryDropdownItemTextActive
                          ]}>
                            {category.name}
                          </Text>
                        </View>
                        {addItemForm.category === category.id && (
                          <CheckCircle2 size={16} color={colors.primary[500]} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Priority */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority</Text>
              <TouchableOpacity
                style={styles.priorityDropdownButton}
                onPress={() => setShowAddPriorityDropdown(!showAddPriorityDropdown)}
              >
                <View style={styles.priorityDropdownSelected}>
                  <View style={[
                    styles.priorityDropdownDot,
                    { backgroundColor: PRIORITIES.find(p => p.id === addItemForm.priority)?.color }
                  ]} />
                  <Text style={styles.priorityDropdownButtonText}>
                    {PRIORITIES.find(p => p.id === addItemForm.priority)?.name || 'Medium'}
                  </Text>
                </View>
                <ChevronDown size={16} color={colors.neutral[500]} />
              </TouchableOpacity>
              
              {showAddPriorityDropdown && (
                <View style={styles.priorityDropdownMenu}>
                  {PRIORITIES.map((priority) => (
                    <TouchableOpacity
                      key={priority.id}
                      style={[
                        styles.priorityDropdownItem,
                        addItemForm.priority === priority.id && styles.priorityDropdownItemActive
                      ]}
                      onPress={() => {
                        setAddItemForm(prev => ({ ...prev, priority: priority.id as 'low' | 'medium' | 'high' | 'urgent' }));
                        setShowAddPriorityDropdown(false);
                      }}
                    >
                      <View style={styles.priorityDropdownItemContent}>
                        <View style={[
                          styles.priorityDropdownItemDot,
                          { backgroundColor: priority.color }
                        ]} />
                        <Text style={[
                          styles.priorityDropdownItemText,
                          addItemForm.priority === priority.id && styles.priorityDropdownItemTextActive
                        ]}>
                          {priority.name}
                        </Text>
                      </View>
                      {addItemForm.priority === priority.id && (
                        <CheckCircle2 size={16} color={colors.primary[500]} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* 🆕 Edit Modal with Dropdowns */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.modalCloseButton}>
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <TouchableOpacity 
              onPress={handleUpdateItem} 
              style={[
                styles.modalSaveButton,
                !editForm.item_name.trim() && styles.modalSaveButtonDisabled
              ]}
              disabled={!editForm.item_name.trim()}
            >
              <Save size={20} color={colors.neutral[0]} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent} 
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => {
              setShowUnitDropdown(false);
              setShowCategoryDropdown(false);
              setShowPriorityDropdown(false);
            }}
          >
            {/* Item Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Item Name *</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.item_name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, item_name: text }))}
                placeholder="e.g., Bananas, Milk, Bread"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            {/* Quantity & Unit with Dropdown */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Quantity</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.quantity.toString()}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 1;
                    setEditForm(prev => ({ ...prev, quantity: num }));
                  }}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Unit</Text>
                <TouchableOpacity
                  style={styles.unitDropdownButton}
                  onPress={() => setShowUnitDropdown(!showUnitDropdown)}
                >
                  <Text style={styles.unitDropdownButtonText}>{editForm.unit}</Text>
                  <ChevronDown size={16} color={colors.neutral[500]} />
                </TouchableOpacity>
                
                {showUnitDropdown && (
                  <View style={styles.unitDropdownMenu}>
                    <ScrollView style={styles.unitDropdownScroll} nestedScrollEnabled>
                      {UNITS.map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitDropdownItem,
                            editForm.unit === unit && styles.unitDropdownItemActive
                          ]}
                          onPress={() => {
                            setEditForm(prev => ({ ...prev, unit }));
                            setShowUnitDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.unitDropdownItemText,
                            editForm.unit === unit && styles.unitDropdownItemTextActive
                          ]}>
                            {unit}
                          </Text>
                          {editForm.unit === unit && (
                            <CheckCircle2 size={16} color={colors.primary[500]} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Category with Dropdown */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category</Text>
              <TouchableOpacity
                style={styles.categoryDropdownButton}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <View style={styles.categoryDropdownSelected}>
                  <Text style={styles.categoryDropdownEmoji}>
                    {CATEGORIES.find(c => c.id === editForm.category)?.icon || '📦'}
                  </Text>
                  <Text style={styles.categoryDropdownButtonText}>
                    {CATEGORIES.find(c => c.id === editForm.category)?.name || 'General'}
                  </Text>
                </View>
                <ChevronDown size={16} color={colors.neutral[500]} />
              </TouchableOpacity>
              
              {showCategoryDropdown && (
                <View style={styles.categoryDropdownMenu}>
                  <ScrollView style={styles.categoryDropdownScroll} nestedScrollEnabled>
                    {CATEGORIES.slice(1).map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryDropdownItem,
                          editForm.category === category.id && styles.categoryDropdownItemActive
                        ]}
                        onPress={() => {
                          setEditForm(prev => ({ ...prev, category: category.id }));
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <View style={styles.categoryDropdownItemContent}>
                          <Text style={styles.categoryDropdownItemEmoji}>
                            {category.icon}
                          </Text>
                          <Text style={[
                            styles.categoryDropdownItemText,
                            editForm.category === category.id && styles.categoryDropdownItemTextActive
                          ]}>
                            {category.name}
                          </Text>
                        </View>
                        {editForm.category === category.id && (
                          <CheckCircle2 size={16} color={colors.primary[500]} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Priority with Dropdown */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority</Text>
              <TouchableOpacity
                style={styles.priorityDropdownButton}
                onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}
              >
                <View style={styles.priorityDropdownSelected}>
                  <View style={[
                    styles.priorityDropdownDot,
                    { backgroundColor: PRIORITIES.find(p => p.id === editForm.priority)?.color }
                  ]} />
                  <Text style={styles.priorityDropdownButtonText}>
                    {PRIORITIES.find(p => p.id === editForm.priority)?.name || 'Medium'}
                  </Text>
                </View>
                <ChevronDown size={16} color={colors.neutral[500]} />
              </TouchableOpacity>
              
              {showPriorityDropdown && (
                <View style={styles.priorityDropdownMenu}>
                  {PRIORITIES.map((priority) => (
                    <TouchableOpacity
                      key={priority.id}
                      style={[
                        styles.priorityDropdownItem,
                        editForm.priority === priority.id && styles.priorityDropdownItemActive
                      ]}
                      onPress={() => {
                        setEditForm(prev => ({ ...prev, priority: priority.id as 'low' | 'medium' | 'high' | 'urgent' }));
                        setShowPriorityDropdown(false);
                      }}
                    >
                      <View style={styles.priorityDropdownItemContent}>
                        <View style={[
                          styles.priorityDropdownItemDot,
                          { backgroundColor: priority.color }
                        ]} />
                        <Text style={[
                          styles.priorityDropdownItemText,
                          editForm.priority === priority.id && styles.priorityDropdownItemTextActive
                        ]}>
                          {priority.name}
                        </Text>
                      </View>
                      {editForm.priority === priority.id && (
                        <CheckCircle2 size={16} color={colors.primary[500]} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Estimated Cost */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Estimated Cost (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.estimated_cost ? editForm.estimated_cost.toString() : ''}
                onChangeText={(text) => {
                  const num = parseFloat(text) || 0;
                  setEditForm(prev => ({ ...prev, estimated_cost: num }));
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            {/* Brand */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Brand (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.brand}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, brand: text }))}
                placeholder="e.g., Organic Valley"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.notesInput]}
                value={editForm.notes}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, notes: text }))}
                placeholder="Any special notes..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ✅ Complete Styles with Dropdowns
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

  // ✅ Compact Stats Row
  compactStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  compactStat: {
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  compactStatValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.neutral[800],
  },
  compactStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  compactSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  compactSearchInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[800],
    marginLeft: spacing.xs,
  },

  // ✅ Quick Actions Container
  quickActionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  quickActionsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing.sm,
  },
  quickActionsButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
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

  // ✅ Dropdown Content
  dropdownContent: {
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  dropdownSection: {
    marginBottom: spacing.lg,
  },
  dropdownSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownActions: {
    gap: spacing.sm,
  },
  dropdownActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing.sm,
  },
  dropdownActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: '500',
  },
  dropdownCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dropdownCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing.xs,
  },
  dropdownCategoryItemActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  dropdownCategoryEmoji: {
    fontSize: 14,
  },
  dropdownCategoryText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  dropdownCategoryTextActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  dropdownPriorityGrid: {
    gap: spacing.sm,
  },
  dropdownPriorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing.sm,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dropdownPriorityText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  emptyListContent: {
    flex: 1,
  },

  // Item Card Styles
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

  // 🆕 Edit Indicator
  editIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    gap: spacing.xs,
  },
  editHint: {
    fontSize: 12,
    color: colors.neutral[400],
    fontStyle: 'italic',
  },

  // Empty State
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

  // 🆕 Form Row
  formRow: {
    flexDirection: 'row',
  },

  // 🆕 Unit Dropdown Styles
  unitDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[0],
  },
  unitDropdownButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[800],
    fontWeight: '500',
  },
  unitDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.md,
    zIndex: 1000,
  },
  unitDropdownScroll: {
    maxHeight: 200,
  },
  unitDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  unitDropdownItemActive: {
    backgroundColor: colors.primary[50],
  },
  unitDropdownItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
  },
  unitDropdownItemTextActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },

  // 🆕 Category Dropdown Styles
  categoryDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[0],
  },
  categoryDropdownSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryDropdownEmoji: {
    fontSize: 18,
  },
  categoryDropdownButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[800],
    fontWeight: '500',
  },
  categoryDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.md,
    zIndex: 1000,
  },
  categoryDropdownScroll: {
    maxHeight: 250,
  },
  categoryDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  categoryDropdownItemActive: {
    backgroundColor: colors.primary[50],
  },
  categoryDropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryDropdownItemEmoji: {
    fontSize: 18,
  },
  categoryDropdownItemText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[700],
  },
  categoryDropdownItemTextActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },

  // 🆕 Priority Dropdown Styles
  priorityDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[0],
  },
  priorityDropdownSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priorityDropdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityDropdownButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[800],
    fontWeight: '500',
  },
  priorityDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.md,
    zIndex: 1000,
  },
  priorityDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  priorityDropdownItemActive: {
    backgroundColor: colors.primary[50],
  },
  priorityDropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priorityDropdownItemDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityDropdownItemText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[700],
  },
  priorityDropdownItemTextActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
});