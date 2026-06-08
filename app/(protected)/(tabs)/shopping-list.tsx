// app/(protected)/(tabs)/shopping-list.tsx — Stovd "Alışveriş Listesi" (Warm Kitchen).
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  CheckCircle2,
  Package,
  Trash2,
  X,
  Save,
  AlertCircle,
} from 'lucide-react-native';

import {
  colors as palette,
  spacing,
  radius,
  type Colors,
} from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import { Display, Eyebrow } from '@/components/UI/Display';
import { SectionHeader } from '@/components/UI/SectionHeader';
import { ShoppingRow } from '@/components/shopping/ShoppingRow';
import { supabase } from '@/lib/supabase';
import { t, i18n } from '@/lib/i18n';
import { confirmDestructive } from '@/lib/ui/confirm';

// Currency/percent formats differ by locale; compute once (locale fixed at startup).
const TR = i18n.locale === 'tr';
const costLabel = (n: string | number) => (TR ? `₺${n}` : `$${n}`);
const pctLabel = (p: number) => (TR ? `%${p}` : `${p}%`);

type ThemeColors = Colors;

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
  {
    id: 'all',
    labelKey: 'shopping.catAll',
    icon: '🛒',
    color: palette.neutral[500],
  },
  {
    id: 'fruits',
    labelKey: 'shopping.catFruits',
    icon: '🍎',
    color: palette.success[500],
  },
  {
    id: 'vegetables',
    labelKey: 'shopping.catVegetables',
    icon: '🥕',
    color: palette.success[600],
  },
  {
    id: 'dairy',
    labelKey: 'shopping.catDairy',
    icon: '🥛',
    color: palette.primary[500],
  },
  {
    id: 'meat',
    labelKey: 'shopping.catMeat',
    icon: '🥩',
    color: palette.error[500],
  },
  {
    id: 'grains',
    labelKey: 'shopping.catGrains',
    icon: '🌾',
    color: palette.warning[500],
  },
  {
    id: 'snacks',
    labelKey: 'shopping.catSnacks',
    icon: '🍪',
    color: palette.secondary[500],
  },
  {
    id: 'beverages',
    labelKey: 'shopping.catBeverages',
    icon: '🥤',
    color: palette.accent[500],
  },
  {
    id: 'general',
    labelKey: 'shopping.catGeneral',
    icon: '📦',
    color: palette.neutral[400],
  },
];

const PRIORITIES = [
  { id: 'low', labelKey: 'shopping.prioLow', color: palette.secondary[500] },
  { id: 'medium', labelKey: 'shopping.prioMedium', color: palette.accent[600] },
  { id: 'high', labelKey: 'shopping.prioHigh', color: palette.error[500] },
  { id: 'urgent', labelKey: 'shopping.prioUrgent', color: palette.error[700] },
];

const UNITS = ['piece', 'kg', 'g', 'l', 'ml', 'pack', 'bottle', 'box', 'case'];

export default function ShoppingList() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      Alert.alert(t('shopping.errorTitle'), t('shopping.errorNameRequired'));
      return;
    }

    try {
      setAddingItem(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(t('shopping.errorTitle'), t('shopping.errorLoginToAdd'));
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

      setItems((prev) => [data, ...prev]);

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
      Alert.alert(t('shopping.errorTitle'), t('shopping.errorAddFailed'));
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
      Alert.alert(t('shopping.errorTitle'), t('shopping.errorNameRequired'));
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(t('shopping.errorTitle'), t('shopping.errorLoginToUpdate'));
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

      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...updateData } : item,
        ),
      );

      setShowEditModal(false);
      setEditingItem(null);
      Alert.alert(t('shopping.doneTitle'), t('shopping.successUpdated'));
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert(t('shopping.errorTitle'), t('shopping.errorUpdateFailed'));
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
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const newCompletedState = !item.is_completed;
      const updateData = {
        is_completed: newCompletedState,
        completed_at: newCompletedState ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('shopping_list_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, ...updateData } : i)),
      );
    } catch (error) {
      console.error('Error toggling completion:', error);
      Alert.alert(t('shopping.errorTitle'), t('shopping.errorUpdateFailed'));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    confirmDestructive({
      title: t('shopping.deleteItemTitle'),
      message: t('shopping.deleteItemMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('shopping_list_items')
            .delete()
            .eq('id', itemId);

          if (error) throw error;

          setItems((prev) => prev.filter((i) => i.id !== itemId));
        } catch (error) {
          console.error('Error deleting item:', error);
          Alert.alert(
            t('shopping.errorTitle'),
            t('shopping.errorDeleteFailed'),
          );
        }
      },
    });
  };

  // ✅ NEW: Pantry Integration Function
  const addMissingFromPantry = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: lowStockItems, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', user.id)
        .lt('quantity', 2);

      if (error) throw error;
      if (!lowStockItems || lowStockItems.length === 0) {
        Alert.alert(t('shopping.infoTitle'), t('shopping.pantryNoneLow'));
        return;
      }

      const shoppingItems = lowStockItems.map((item) => ({
        user_id: user.id,
        item_name: item.name,
        category: item.category,
        quantity: 1,
        unit: item.unit,
        source: 'auto_pantry' as const,
        pantry_item_id: item.id,
        priority: 'medium' as const,
        notes: t('shopping.pantryRunningLow', {
          quantity: item.quantity,
          unit: item.unit,
        }),
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

      setItems((prev) => [...(data || []), ...prev]);

      Alert.alert(
        t('shopping.doneTitle'),
        t('shopping.pantryAdded', { count: lowStockItems.length }),
      );
      setShowQuickActions(false);
    } catch (error) {
      console.error('Error adding from pantry:', error);
      Alert.alert(t('shopping.errorTitle'), t('shopping.pantryAddFailed'));
    }
  };

  // ✅ NEW: Clear Completed Function
  const handleClearCompleted = async () => {
    const completedItems = items.filter((item) => item.is_completed);

    if (completedItems.length === 0) {
      Alert.alert(t('shopping.infoTitle'), t('shopping.clearNoneTitle'));
      return;
    }

    confirmDestructive({
      title: t('shopping.clearConfirmTitle'),
      message: t('shopping.clearConfirmMessage', {
        count: completedItems.length,
      }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('shopping_list_items')
            .delete()
            .in(
              'id',
              completedItems.map((item) => item.id),
            );

          if (error) throw error;
          setItems((prev) => prev.filter((item) => !item.is_completed));
          setShowQuickActions(false);
        } catch (error) {
          console.error('Error clearing completed items:', error);
          Alert.alert(t('shopping.errorTitle'), t('shopping.clearFailed'));
        }
      },
    });
  };

  // ✅ Filtering with priority support
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.item_name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesCompletion = showCompleted
      ? item.is_completed
      : !item.is_completed;
    const matchesPriority =
      selectedPriorities.length === 0 ||
      (item.priority && selectedPriorities.includes(item.priority));

    return (
      matchesSearch && matchesCategory && matchesCompletion && matchesPriority
    );
  });

  const stats = {
    total: items.length,
    completed: items.filter((item) => item.is_completed).length,
    pending: items.filter((item) => !item.is_completed).length,
    estimated_cost: items.reduce(
      (sum, item) => sum + (item.estimated_cost || 0),
      0,
    ),
    urgent: items.filter(
      (item) => item.priority === 'urgent' && !item.is_completed,
    ).length,
  };

  // ✅ Effects
  useEffect(() => {
    loadShoppingItems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadShoppingItems();
  };

  // ✅ Updated Render Function — Warm Kitchen row
  const renderShoppingItem = ({ item }: { item: ShoppingItem }) => {
    const cat = CATEGORIES.find(
      (c) => c.id === item.category && c.id !== 'all',
    );
    return (
      <ShoppingRow
        item={item}
        kicker={cat ? t(cat.labelKey) : undefined}
        onPress={() => handleEditItem(item)}
        onToggle={() => handleToggleComplete(item.id)}
        onDelete={() => handleDeleteItem(item.id)}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <ShoppingCart size={34} color={colors.primary} />
      </View>
      <Display size="md" color={colors.textPrimary} style={styles.emptyTitle}>
        {showCompleted
          ? t('shopping.emptyCompletedTitle')
          : t('shopping.emptyTitle')}
      </Display>
      <Text style={styles.emptySubtitle}>
        {showCompleted
          ? t('shopping.emptyCompletedSubtitle')
          : t('shopping.emptySubtitle')}
      </Text>
      {!showCompleted && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={18} color="#fff" />
          <Text style={styles.emptyButtonText}>
            {t('shopping.emptyAction')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('shopping.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ✅ Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Eyebrow>{t('shopping.eyebrow')}</Eyebrow>
          <Display
            size="xl"
            color={colors.textPrimary}
            style={styles.headerTitle}
          >
            {t('shopping.title')}
          </Display>
          <Text style={styles.headerSubtitle}>
            {t('shopping.subtitle', {
              pending: stats.pending,
              completed: stats.completed,
            })}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {stats.urgent > 0 && (
            <View style={styles.urgentBadge}>
              <AlertCircle size={15} color={palette.error[600]} />
              <Text style={styles.urgentText}>{stats.urgent}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ Compact Stats Row */}
      <View style={styles.compactStatsRow}>
        <View style={styles.compactStat}>
          <Display size="md" color={colors.textPrimary}>
            {String(stats.total)}
          </Display>
          <Text style={styles.compactStatLabel}>{t('shopping.statItems')}</Text>
        </View>
        <View style={[styles.compactStat, styles.compactStatDivider]}>
          <Display size="md" color={colors.secondary}>
            {costLabel(stats.estimated_cost.toFixed(0))}
          </Display>
          <Text style={styles.compactStatLabel}>{t('shopping.statCost')}</Text>
        </View>
        <View style={[styles.compactStat, styles.compactStatDivider]}>
          <Display size="md" color={colors.primary}>
            {pctLabel(Math.round((stats.completed / (stats.total || 1)) * 100))}
          </Display>
          <Text style={styles.compactStatLabel}>{t('shopping.statDone')}</Text>
        </View>

        <View style={styles.compactSearchContainer}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.compactSearchInput}
            placeholder={t('shopping.searchPlaceholder')}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={colors.inputPlaceholder}
          />
        </View>
      </View>

      {/* ✅ Quick Actions Dropdown Button */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionsButton}
          onPress={() => setShowQuickActions(!showQuickActions)}
        >
          <Text style={styles.quickActionsButtonText}>
            {t('shopping.quickActions')}
          </Text>
          {showQuickActions ? (
            <ChevronUp size={18} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={18} color={colors.textSecondary} />
          )}
        </TouchableOpacity>

        {/* Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              !showCompleted && styles.toggleButtonActive,
            ]}
            onPress={() => setShowCompleted(false)}
          >
            <Text
              style={[
                styles.toggleText,
                !showCompleted && styles.toggleTextActive,
              ]}
            >
              {t('shopping.tabPending', { count: stats.pending })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              showCompleted && styles.toggleButtonActive,
            ]}
            onPress={() => setShowCompleted(true)}
          >
            <Text
              style={[
                styles.toggleText,
                showCompleted && styles.toggleTextActive,
              ]}
            >
              {t('shopping.tabCompleted', { count: stats.completed })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ Dropdown Menu Content */}
      {showQuickActions && (
        <View style={styles.dropdownContent}>
          {/* Quick Actions */}
          <View style={styles.dropdownSection}>
            <SectionHeader title={t('shopping.quickActions')} />
            <View style={styles.dropdownActions}>
              <TouchableOpacity
                style={styles.dropdownActionButton}
                onPress={addMissingFromPantry}
              >
                <Package size={18} color={colors.primary} />
                <Text style={styles.dropdownActionText}>
                  {t('shopping.addFromPantry')}
                </Text>
              </TouchableOpacity>

              {stats.completed > 0 && (
                <TouchableOpacity
                  style={styles.dropdownActionButton}
                  onPress={handleClearCompleted}
                >
                  <Trash2 size={18} color={palette.error[500]} />
                  <Text
                    style={[
                      styles.dropdownActionText,
                      { color: palette.error[500] },
                    ]}
                  >
                    {t('shopping.clearCompleted', { count: stats.completed })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Filter */}
          <View style={styles.dropdownSection}>
            <SectionHeader title={t('shopping.sectionCategories')} />
            <View style={styles.dropdownCategoryGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.dropdownCategoryItem,
                    selectedCategory === category.id &&
                      styles.dropdownCategoryItemActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.dropdownCategoryEmoji}>
                    {category.icon}
                  </Text>
                  <Text
                    style={[
                      styles.dropdownCategoryText,
                      selectedCategory === category.id &&
                        styles.dropdownCategoryTextActive,
                    ]}
                  >
                    {t(category.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Filter */}
          <View style={styles.dropdownSection}>
            <SectionHeader title={t('shopping.sectionPriority')} />
            <View style={styles.dropdownPriorityGrid}>
              {PRIORITIES.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[
                    styles.dropdownPriorityItem,
                    selectedPriorities.includes(priority.id) && {
                      backgroundColor: priority.color + '20',
                      borderColor: priority.color,
                    },
                  ]}
                  onPress={() => {
                    if (selectedPriorities.includes(priority.id)) {
                      setSelectedPriorities((prev) =>
                        prev.filter((p) => p !== priority.id),
                      );
                    } else {
                      setSelectedPriorities((prev) => [...prev, priority.id]);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: priority.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.dropdownPriorityText,
                      selectedPriorities.includes(priority.id) && {
                        color: priority.color,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {t(priority.labelKey)}
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
          keyExtractor={(item) => item.id}
          renderItem={renderShoppingItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            filteredItems.length === 0 ? styles.emptyListContent : undefined
          }
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
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('shopping.addTitle')}</Text>
            <TouchableOpacity
              onPress={handleAddItem}
              style={[
                styles.modalSaveButton,
                (!addItemForm.item_name.trim() || addingItem) &&
                  styles.modalSaveButtonDisabled,
              ]}
              disabled={!addItemForm.item_name.trim() || addingItem}
            >
              {addingItem ? (
                <ActivityIndicator size="small" color={'#fff'} />
              ) : (
                <Save size={20} color={'#fff'} />
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
              <Text style={styles.formLabel}>{t('shopping.fieldName')}</Text>
              <TextInput
                style={styles.formInput}
                value={addItemForm.item_name}
                onChangeText={(text) =>
                  setAddItemForm((prev) => ({ ...prev, item_name: text }))
                }
                placeholder={t('shopping.fieldNamePlaceholder')}
                placeholderTextColor={colors.inputPlaceholder}
                autoFocus
              />
            </View>

            {/* Quantity & Unit */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>
                  {t('shopping.fieldQuantity')}
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={addItemForm.quantity.toString()}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 1;
                    setAddItemForm((prev) => ({ ...prev, quantity: num }));
                  }}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>{t('shopping.fieldUnit')}</Text>
                <TouchableOpacity
                  style={styles.unitDropdownButton}
                  onPress={() => setShowAddUnitDropdown(!showAddUnitDropdown)}
                >
                  <Text style={styles.unitDropdownButtonText}>
                    {addItemForm.unit}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {showAddUnitDropdown && (
                  <View style={styles.unitDropdownMenu}>
                    <ScrollView
                      style={styles.unitDropdownScroll}
                      nestedScrollEnabled
                    >
                      {UNITS.map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitDropdownItem,
                            addItemForm.unit === unit &&
                              styles.unitDropdownItemActive,
                          ]}
                          onPress={() => {
                            setAddItemForm((prev) => ({ ...prev, unit }));
                            setShowAddUnitDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.unitDropdownItemText,
                              addItemForm.unit === unit &&
                                styles.unitDropdownItemTextActive,
                            ]}
                          >
                            {unit}
                          </Text>
                          {addItemForm.unit === unit && (
                            <CheckCircle2 size={16} color={colors.primary} />
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
              <Text style={styles.formLabel}>
                {t('shopping.fieldCategory')}
              </Text>
              <TouchableOpacity
                style={styles.categoryDropdownButton}
                onPress={() =>
                  setShowAddCategoryDropdown(!showAddCategoryDropdown)
                }
              >
                <View style={styles.categoryDropdownSelected}>
                  <Text style={styles.categoryDropdownEmoji}>
                    {CATEGORIES.find((c) => c.id === addItemForm.category)
                      ?.icon || '📦'}
                  </Text>
                  <Text style={styles.categoryDropdownButtonText}>
                    {t(
                      CATEGORIES.find((c) => c.id === addItemForm.category)
                        ?.labelKey || 'shopping.catGeneral',
                    )}
                  </Text>
                </View>
                <ChevronDown size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {showAddCategoryDropdown && (
                <View style={styles.categoryDropdownMenu}>
                  <ScrollView
                    style={styles.categoryDropdownScroll}
                    nestedScrollEnabled
                  >
                    {CATEGORIES.slice(1).map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryDropdownItem,
                          addItemForm.category === category.id &&
                            styles.categoryDropdownItemActive,
                        ]}
                        onPress={() => {
                          setAddItemForm((prev) => ({
                            ...prev,
                            category: category.id,
                          }));
                          setShowAddCategoryDropdown(false);
                        }}
                      >
                        <View style={styles.categoryDropdownItemContent}>
                          <Text style={styles.categoryDropdownItemEmoji}>
                            {category.icon}
                          </Text>
                          <Text
                            style={[
                              styles.categoryDropdownItemText,
                              addItemForm.category === category.id &&
                                styles.categoryDropdownItemTextActive,
                            ]}
                          >
                            {t(category.labelKey)}
                          </Text>
                        </View>
                        {addItemForm.category === category.id && (
                          <CheckCircle2 size={16} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Priority */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('shopping.fieldPriority')}
              </Text>
              <TouchableOpacity
                style={styles.priorityDropdownButton}
                onPress={() =>
                  setShowAddPriorityDropdown(!showAddPriorityDropdown)
                }
              >
                <View style={styles.priorityDropdownSelected}>
                  <View
                    style={[
                      styles.priorityDropdownDot,
                      {
                        backgroundColor: PRIORITIES.find(
                          (p) => p.id === addItemForm.priority,
                        )?.color,
                      },
                    ]}
                  />
                  <Text style={styles.priorityDropdownButtonText}>
                    {t(
                      PRIORITIES.find((p) => p.id === addItemForm.priority)
                        ?.labelKey || 'shopping.prioMedium',
                    )}
                  </Text>
                </View>
                <ChevronDown size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {showAddPriorityDropdown && (
                <View style={styles.priorityDropdownMenu}>
                  {PRIORITIES.map((priority) => (
                    <TouchableOpacity
                      key={priority.id}
                      style={[
                        styles.priorityDropdownItem,
                        addItemForm.priority === priority.id &&
                          styles.priorityDropdownItemActive,
                      ]}
                      onPress={() => {
                        setAddItemForm((prev) => ({
                          ...prev,
                          priority: priority.id as
                            | 'low'
                            | 'medium'
                            | 'high'
                            | 'urgent',
                        }));
                        setShowAddPriorityDropdown(false);
                      }}
                    >
                      <View style={styles.priorityDropdownItemContent}>
                        <View
                          style={[
                            styles.priorityDropdownItemDot,
                            { backgroundColor: priority.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.priorityDropdownItemText,
                            addItemForm.priority === priority.id &&
                              styles.priorityDropdownItemTextActive,
                          ]}
                        >
                          {t(priority.labelKey)}
                        </Text>
                      </View>
                      {addItemForm.priority === priority.id && (
                        <CheckCircle2 size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('shopping.fieldNotes')}</Text>
              <TextInput
                style={[styles.formInput, styles.notesInput]}
                value={addItemForm.notes}
                onChangeText={(text) =>
                  setAddItemForm((prev) => ({ ...prev, notes: text }))
                }
                placeholder={t('shopping.fieldNotesPlaceholder')}
                placeholderTextColor={colors.inputPlaceholder}
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
            <TouchableOpacity
              onPress={handleCancelEdit}
              style={styles.modalCloseButton}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('shopping.editTitle')}</Text>
            <TouchableOpacity
              onPress={handleUpdateItem}
              style={[
                styles.modalSaveButton,
                !editForm.item_name.trim() && styles.modalSaveButtonDisabled,
              ]}
              disabled={!editForm.item_name.trim()}
            >
              <Save size={20} color={'#fff'} />
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
              <Text style={styles.formLabel}>{t('shopping.fieldName')}</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.item_name}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, item_name: text }))
                }
                placeholder={t('shopping.fieldNamePlaceholder')}
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>

            {/* Quantity & Unit with Dropdown */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>
                  {t('shopping.fieldQuantity')}
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.quantity.toString()}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 1;
                    setEditForm((prev) => ({ ...prev, quantity: num }));
                  }}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>{t('shopping.fieldUnit')}</Text>
                <TouchableOpacity
                  style={styles.unitDropdownButton}
                  onPress={() => setShowUnitDropdown(!showUnitDropdown)}
                >
                  <Text style={styles.unitDropdownButtonText}>
                    {editForm.unit}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {showUnitDropdown && (
                  <View style={styles.unitDropdownMenu}>
                    <ScrollView
                      style={styles.unitDropdownScroll}
                      nestedScrollEnabled
                    >
                      {UNITS.map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitDropdownItem,
                            editForm.unit === unit &&
                              styles.unitDropdownItemActive,
                          ]}
                          onPress={() => {
                            setEditForm((prev) => ({ ...prev, unit }));
                            setShowUnitDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.unitDropdownItemText,
                              editForm.unit === unit &&
                                styles.unitDropdownItemTextActive,
                            ]}
                          >
                            {unit}
                          </Text>
                          {editForm.unit === unit && (
                            <CheckCircle2 size={16} color={colors.primary} />
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
              <Text style={styles.formLabel}>
                {t('shopping.fieldCategory')}
              </Text>
              <TouchableOpacity
                style={styles.categoryDropdownButton}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <View style={styles.categoryDropdownSelected}>
                  <Text style={styles.categoryDropdownEmoji}>
                    {CATEGORIES.find((c) => c.id === editForm.category)?.icon ||
                      '📦'}
                  </Text>
                  <Text style={styles.categoryDropdownButtonText}>
                    {t(
                      CATEGORIES.find((c) => c.id === editForm.category)
                        ?.labelKey || 'shopping.catGeneral',
                    )}
                  </Text>
                </View>
                <ChevronDown size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {showCategoryDropdown && (
                <View style={styles.categoryDropdownMenu}>
                  <ScrollView
                    style={styles.categoryDropdownScroll}
                    nestedScrollEnabled
                  >
                    {CATEGORIES.slice(1).map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryDropdownItem,
                          editForm.category === category.id &&
                            styles.categoryDropdownItemActive,
                        ]}
                        onPress={() => {
                          setEditForm((prev) => ({
                            ...prev,
                            category: category.id,
                          }));
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <View style={styles.categoryDropdownItemContent}>
                          <Text style={styles.categoryDropdownItemEmoji}>
                            {category.icon}
                          </Text>
                          <Text
                            style={[
                              styles.categoryDropdownItemText,
                              editForm.category === category.id &&
                                styles.categoryDropdownItemTextActive,
                            ]}
                          >
                            {t(category.labelKey)}
                          </Text>
                        </View>
                        {editForm.category === category.id && (
                          <CheckCircle2 size={16} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Priority with Dropdown */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('shopping.fieldPriority')}
              </Text>
              <TouchableOpacity
                style={styles.priorityDropdownButton}
                onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}
              >
                <View style={styles.priorityDropdownSelected}>
                  <View
                    style={[
                      styles.priorityDropdownDot,
                      {
                        backgroundColor: PRIORITIES.find(
                          (p) => p.id === editForm.priority,
                        )?.color,
                      },
                    ]}
                  />
                  <Text style={styles.priorityDropdownButtonText}>
                    {t(
                      PRIORITIES.find((p) => p.id === editForm.priority)
                        ?.labelKey || 'shopping.prioMedium',
                    )}
                  </Text>
                </View>
                <ChevronDown size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {showPriorityDropdown && (
                <View style={styles.priorityDropdownMenu}>
                  {PRIORITIES.map((priority) => (
                    <TouchableOpacity
                      key={priority.id}
                      style={[
                        styles.priorityDropdownItem,
                        editForm.priority === priority.id &&
                          styles.priorityDropdownItemActive,
                      ]}
                      onPress={() => {
                        setEditForm((prev) => ({
                          ...prev,
                          priority: priority.id as
                            | 'low'
                            | 'medium'
                            | 'high'
                            | 'urgent',
                        }));
                        setShowPriorityDropdown(false);
                      }}
                    >
                      <View style={styles.priorityDropdownItemContent}>
                        <View
                          style={[
                            styles.priorityDropdownItemDot,
                            { backgroundColor: priority.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.priorityDropdownItemText,
                            editForm.priority === priority.id &&
                              styles.priorityDropdownItemTextActive,
                          ]}
                        >
                          {t(priority.labelKey)}
                        </Text>
                      </View>
                      {editForm.priority === priority.id && (
                        <CheckCircle2 size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Estimated Cost */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('shopping.fieldCost')}</Text>
              <TextInput
                style={styles.formInput}
                value={
                  editForm.estimated_cost
                    ? editForm.estimated_cost.toString()
                    : ''
                }
                onChangeText={(text) => {
                  const num = parseFloat(text) || 0;
                  setEditForm((prev) => ({ ...prev, estimated_cost: num }));
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>

            {/* Brand */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('shopping.fieldBrand')}</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.brand}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, brand: text }))
                }
                placeholder={t('shopping.fieldBrandPlaceholder')}
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('shopping.fieldNotes')}</Text>
              <TextInput
                style={[styles.formInput, styles.notesInput]}
                value={editForm.notes}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, notes: text }))
                }
                placeholder={t('shopping.fieldNotesPlaceholder')}
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ✅ Warm Kitchen styles — themed factory (dark-mode aware)
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      fontFamily: 'Inter-Medium',
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 16,
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    headerText: { flex: 1, gap: 4 },
    headerTitle: { marginTop: 2 },
    headerSubtitle: {
      fontFamily: 'Inter-Regular',
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 22,
    },
    urgentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.error[500] + '1A',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      gap: spacing.xs,
    },
    urgentText: {
      fontFamily: 'Inter-Bold',
      fontSize: 13,
      color: palette.error[600],
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },

    // Compact Stats Row
    compactStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: spacing.md,
      shadowColor: '#3C2814',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    compactStat: { alignItems: 'center' },
    compactStatDivider: {
      borderLeftWidth: 1,
      borderLeftColor: colors.borderLight,
      paddingLeft: spacing.md,
    },
    compactStatLabel: {
      fontFamily: 'Inter-Medium',
      fontSize: 10.5,
      color: colors.textSecondary,
      marginTop: 3,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    compactSearchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    compactSearchInput: {
      flex: 1,
      fontFamily: 'Inter-Regular',
      fontSize: 13,
      color: colors.textPrimary,
      marginLeft: spacing.xs,
      padding: 0,
    },

    // Quick Actions
    quickActionsContainer: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    quickActionsButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginBottom: spacing.sm,
    },
    quickActionsButtonText: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 14,
      color: colors.textPrimary,
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
      padding: 3,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
      alignItems: 'center',
    },
    toggleButtonActive: {
      backgroundColor: colors.surface,
      shadowColor: '#3C2814',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    toggleText: {
      fontFamily: 'Inter-Medium',
      fontSize: 13,
      color: colors.textSecondary,
    },
    toggleTextActive: {
      fontFamily: 'Inter-SemiBold',
      color: colors.textPrimary,
    },

    // Dropdown Content
    dropdownContent: {
      backgroundColor: colors.surface,
      marginHorizontal: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
      marginBottom: spacing.sm,
    },
    dropdownSection: { marginBottom: spacing.md },
    dropdownActions: { gap: spacing.sm },
    dropdownActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: spacing.sm,
    },
    dropdownActionText: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 13,
      color: colors.textPrimary,
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
      borderRadius: radius.full,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: spacing.xs,
    },
    dropdownCategoryItemActive: {
      backgroundColor: colors.primary + '14',
      borderColor: colors.primary,
    },
    dropdownCategoryEmoji: { fontSize: 14 },
    dropdownCategoryText: {
      fontFamily: 'Inter-Medium',
      fontSize: 13,
      color: colors.textSecondary,
    },
    dropdownCategoryTextActive: {
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
    dropdownPriorityGrid: { gap: spacing.sm },
    dropdownPriorityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: spacing.sm,
    },
    priorityDot: { width: 10, height: 10, borderRadius: 5 },
    dropdownPriorityText: {
      fontFamily: 'Inter-Medium',
      fontSize: 13,
      color: colors.textSecondary,
    },
    mainContent: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: 4 },
    emptyListContent: { flex: 1 },

    // Empty State
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
    },
    emptyIcon: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: colors.primary + '14',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    emptyTitle: { marginBottom: spacing.sm, textAlign: 'center' },
    emptySubtitle: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: spacing.xl,
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: 14,
      borderRadius: 18,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    emptyButtonText: {
      fontFamily: 'Inter-Bold',
      fontSize: 15,
      color: '#fff',
    },

    // Modal
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 60,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 18,
      color: colors.textPrimary,
    },
    modalSaveButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalSaveButtonDisabled: { backgroundColor: colors.border },
    modalContent: { flex: 1, padding: spacing.lg },
    formGroup: { marginBottom: spacing.lg },
    formLabel: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 13,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    formInput: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontFamily: 'Inter-Regular',
      fontSize: 15,
      color: colors.textPrimary,
      backgroundColor: colors.inputBackground,
    },
    notesInput: { height: 80, textAlignVertical: 'top' },
    formRow: { flexDirection: 'row' },

    // Unit Dropdown
    unitDropdownButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.inputBackground,
    },
    unitDropdownButtonText: {
      fontFamily: 'Inter-Medium',
      fontSize: 15,
      color: colors.textPrimary,
    },
    unitDropdownMenu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: '#3C2814',
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
      zIndex: 1000,
    },
    unitDropdownScroll: { maxHeight: 200 },
    unitDropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    unitDropdownItemActive: { backgroundColor: colors.primary + '14' },
    unitDropdownItemText: {
      fontFamily: 'Inter-Regular',
      fontSize: 13,
      color: colors.textPrimary,
    },
    unitDropdownItemTextActive: {
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },

    // Category Dropdown
    categoryDropdownButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.inputBackground,
    },
    categoryDropdownSelected: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    categoryDropdownEmoji: { fontSize: 18 },
    categoryDropdownButtonText: {
      fontFamily: 'Inter-Medium',
      fontSize: 15,
      color: colors.textPrimary,
    },
    categoryDropdownMenu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: '#3C2814',
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
      zIndex: 1000,
    },
    categoryDropdownScroll: { maxHeight: 250 },
    categoryDropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    categoryDropdownItemActive: { backgroundColor: colors.primary + '14' },
    categoryDropdownItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    categoryDropdownItemEmoji: { fontSize: 18 },
    categoryDropdownItemText: {
      fontFamily: 'Inter-Regular',
      fontSize: 15,
      color: colors.textPrimary,
    },
    categoryDropdownItemTextActive: {
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },

    // Priority Dropdown
    priorityDropdownButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.inputBackground,
    },
    priorityDropdownSelected: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    priorityDropdownDot: { width: 12, height: 12, borderRadius: 6 },
    priorityDropdownButtonText: {
      fontFamily: 'Inter-Medium',
      fontSize: 15,
      color: colors.textPrimary,
    },
    priorityDropdownMenu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: '#3C2814',
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
      zIndex: 1000,
    },
    priorityDropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    priorityDropdownItemActive: { backgroundColor: colors.primary + '14' },
    priorityDropdownItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    priorityDropdownItemDot: { width: 12, height: 12, borderRadius: 6 },
    priorityDropdownItemText: {
      fontFamily: 'Inter-Regular',
      fontSize: 15,
      color: colors.textPrimary,
    },
    priorityDropdownItemTextActive: {
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
  });
