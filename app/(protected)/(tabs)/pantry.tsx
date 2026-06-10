// app/(tabs)/pantry.tsx — Stovd pantry ("Dolabım") in the Warm Kitchen language:
// cream paper, serif screen title, Eyebrow kickers, category chips, editorial
// item cards. Restyle only — all data hooks, CRUD and navigation are unchanged.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Search,
  Package,
  TriangleAlert as AlertTriangle,
  X,
  Clock,
  ChevronDown,
  LayoutGrid,
  Milk,
  Beef,
  Salad,
  Apple,
  Wheat,
  Popcorn,
  CupSoda,
  Droplet,
  Snowflake,
  Archive,
  Croissant,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { fonts, radius, spacing, type Colors } from '@/lib/theme/index';
import { Display, Eyebrow } from '@/components/UI/Display';
import { SectionHeader } from '@/components/UI/SectionHeader';
import { PantryItemCard } from '@/components/pantry/PantryItemCard';
import { t } from '@/lib/i18n';
import { useTranslation } from '@/contexts/LocaleContext';
import { confirmDestructive } from '@/lib/ui/confirm';

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
  user_id?: string;
}

// Stored keys/values are unchanged (data layer); only the displayed `label`
// is localized. Locale is fixed at startup, so labels resolve once at module load.
const CATEGORIES = [
  { key: 'all', label: t('common.all'), Icon: LayoutGrid },
  { key: 'dairy', label: t('pantry.cat.dairy'), Icon: Milk },
  { key: 'meat', label: t('pantry.cat.meat'), Icon: Beef },
  { key: 'vegetables', label: t('pantry.cat.vegetables'), Icon: Salad },
  { key: 'fruits', label: t('pantry.cat.fruits'), Icon: Apple },
  { key: 'grains', label: t('pantry.cat.grains'), Icon: Wheat },
  { key: 'snacks', label: t('pantry.cat.snacks'), Icon: Popcorn },
  { key: 'beverages', label: t('pantry.cat.beverages'), Icon: CupSoda },
  { key: 'condiments', label: t('pantry.cat.condiments'), Icon: Droplet },
  { key: 'frozen', label: t('pantry.cat.frozen'), Icon: Snowflake },
  { key: 'canned', label: t('pantry.cat.canned'), Icon: Archive },
  { key: 'bakery', label: t('pantry.cat.bakery'), Icon: Croissant },
];

const UNITS = [
  {
    value: 'pcs',
    label: t('pantry.unit.pcs'),
    category: t('pantry.unitCat.count'),
  },
  {
    value: 'kg',
    label: t('pantry.unit.kg'),
    category: t('pantry.unitCat.weight'),
  },
  {
    value: 'g',
    label: t('pantry.unit.g'),
    category: t('pantry.unitCat.weight'),
  },
  {
    value: 'L',
    label: t('pantry.unit.L'),
    category: t('pantry.unitCat.volume'),
  },
  {
    value: 'ml',
    label: t('pantry.unit.ml'),
    category: t('pantry.unitCat.volume'),
  },
  {
    value: 'oz',
    label: t('pantry.unit.oz'),
    category: t('pantry.unitCat.weight'),
  },
  {
    value: 'lb',
    label: t('pantry.unit.lb'),
    category: t('pantry.unitCat.weight'),
  },
  {
    value: 'cups',
    label: t('pantry.unit.cups'),
    category: t('pantry.unitCat.volume'),
  },
  {
    value: 'tbsp',
    label: t('pantry.unit.tbsp'),
    category: t('pantry.unitCat.volume'),
  },
  {
    value: 'tsp',
    label: t('pantry.unit.tsp'),
    category: t('pantry.unitCat.volume'),
  },
  {
    value: 'grams',
    label: t('pantry.unit.grams'),
    category: t('pantry.unitCat.weight'),
  },
  {
    value: 'piece',
    label: t('pantry.unit.piece'),
    category: t('pantry.unitCat.count'),
  },
];

// Stored location value (TR) -> display label key. Values stay as-is in the DB.
const LOCATIONS = ['Buzdolabı', 'Dondurucu', 'Kiler', 'Dolap', 'Tezgah'];
const LOCATION_LABEL_KEY: Record<string, string> = {
  Buzdolabı: 'pantry.loc.fridge',
  Dondurucu: 'pantry.loc.freezer',
  Kiler: 'pantry.loc.pantry',
  Dolap: 'pantry.loc.cupboard',
  Tezgah: 'pantry.loc.counter',
};
const locationLabel = (loc: string) =>
  LOCATION_LABEL_KEY[loc] ? t(LOCATION_LABEL_KEY[loc]) : loc;

const categoryImages = {
  dairy: require('@/assets/images/categoryImages/dairy.webp'),
  meat: require('@/assets/images/categoryImages/meat.webp'),
  vegetables: require('@/assets/images/categoryImages/vegetables.webp'),
  fruits: require('@/assets/images/categoryImages/fruits.webp'),
  grains: require('@/assets/images/categoryImages/grains.webp'),
  snacks: require('@/assets/images/categoryImages/snacks.webp'),
  beverages: require('@/assets/images/categoryImages/beverages.webp'),
  condiments: require('@/assets/images/categoryImages/condiments.webp'),
  frozen: require('@/assets/images/categoryImages/frozen.webp'),
  canned: require('@/assets/images/categoryImages/canned.webp'),
  bakery: require('@/assets/images/categoryImages/bakery.webp'),
  default: require('@/assets/images/categoryImages/default.webp'),
};

const getItemImageSource = (category: string) => {
  return (
    categoryImages[category as keyof typeof categoryImages] ||
    categoryImages.default
  );
};

export default function PantryScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState<PantryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeExpiryFilter, setActiveExpiryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryStats, setCategoryStats] = useState<{ [key: string]: number }>(
    {},
  );

  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);

  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const getGridLayout = () => {
    const { width } = screenData;
    const isTablet = width >= 768;
    const isLargeScreen = width >= 1024;

    if (isLargeScreen) {
      return { numColumns: 3, itemWidth: (width - 80) / 3 };
    } else if (isTablet) {
      return { numColumns: 2, itemWidth: (width - 60) / 2 };
    } else {
      return { numColumns: 1, itemWidth: width - 40 };
    }
  };

  const { numColumns, itemWidth } = getGridLayout();

  const [newItem, setNewItem] = useState({
    name: '',
    brand: '',
    category: 'vegetables',
    quantity: '1',
    unit: 'pcs',
    expiry_date: '',
    location: 'Buzdolabı',
  });

  // Refetch on every focus: items added elsewhere (camera scan, shopping
  // list) must appear without an app restart — the tab stays mounted.
  useFocusEffect(
    useCallback(() => {
      loadPantryItems();
    }, []),
  );

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory, activeExpiryFilter]);

  const loadPantryItems = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true });

      if (error) throw error;

      setItems(data || []);

      const stats: { [key: string]: number } = {};
      data?.forEach((item) => {
        stats[item.category] = (stats[item.category] || 0) + 1;
      });
      stats['all'] = data?.length || 0;
      setCategoryStats(stats);
    } catch (error) {
      console.error('Error loading pantry items:', error);
      Alert.alert(t('common.error'), t('pantry.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.brand?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (activeExpiryFilter !== 'all') {
      const today = new Date();
      filtered = filtered.filter((item) => {
        if (!item.expiry_date) return activeExpiryFilter === 'no_expiry';

        const expiryDate = new Date(item.expiry_date);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

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

  const handleAddItem = async () => {
    if (!newItem.name.trim()) {
      Alert.alert(t('common.error'), t('pantry.enterName'));
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      Alert.alert(t('pantry.addedTitle'), t('pantry.addedMessage'));
    } catch (error: any) {
      console.error('Error adding item:', error);
      Alert.alert(t('common.error'), error.message || t('pantry.addError'));
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !newItem.name.trim()) {
      Alert.alert(t('common.error'), t('pantry.enterName'));
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

      setItems(items.map((item) => (item.id === editingItem.id ? data : item)));
      setShowAddModal(false);
      setEditMode(false);
      setEditingItem(null);
      resetNewItem();
      Alert.alert(t('pantry.addedTitle'), t('pantry.updatedMessage'));
    } catch (error: any) {
      console.error('Error updating item:', error);
      Alert.alert(t('common.error'), error.message || t('pantry.updateError'));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    confirmDestructive({
      title: t('pantry.deleteTitle'),
      message: t('pantry.deleteMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('pantry_items')
            .delete()
            .eq('id', itemId);

          if (error) throw error;

          setItems(items.filter((item) => item.id !== itemId));
          setShowActionsMenu(null);
        } catch (error) {
          console.error('Error deleting item:', error);
          Alert.alert(t('common.error'), t('pantry.deleteError'));
        }
      },
    });
  };

  // ✅ FIXED: handleAddToShoppingList - Sadece tabloda olan alanları kullan
  const handleAddToShoppingList = async (item: PantryItem) => {
    try {
      console.log('Adding to shopping list:', item.name);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(t('common.error'), t('pantry.loginToAdd'));
        return;
      }

      // Check if item already exists
      const { data: existingItems, error: checkError } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_name', item.name)
        .eq('is_completed', false);

      if (checkError) {
        console.log('Check existing error (non-critical):', checkError);
      }

      if (existingItems && existingItems.length > 0) {
        Alert.alert(
          t('pantry.alreadyExistsTitle'),
          t('pantry.alreadyExistsMessage', { name: item.name }),
          [{ text: t('common.ok'), style: 'default' }],
        );
        setShowActionsMenu(null);
        return;
      }

      // ✅ FIXED: Pantry'deki quantity ve unit değerlerini kullan
      const shoppingItemData = {
        user_id: user.id,
        item_name: item.name,
        brand: item.brand || null,
        category: item.category || 'general',
        quantity: item.quantity || 1, // ✅ Pantry'deki quantity değerini al
        unit: item.unit || 'piece', // ✅ Pantry'deki unit değerini al
        source: 'auto_pantry',
        priority: 'medium',
        notes: `Added from pantry (Original: ${item.quantity} ${item.unit})`, // ✅ Orijinal değerleri not olarak ekle
        is_completed: false,
      };

      console.log(
        'Inserting shopping item with correct quantity:',
        shoppingItemData,
      );

      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert([shoppingItemData])
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Successfully added to shopping list:', data);

      // ✅ Başarı mesajında miktar ve birim bilgisini göster
      Alert.alert(
        t('pantry.addedToListTitle'),
        t('pantry.addedToListMessage', {
          name: `${item.name}${item.brand ? ` (${item.brand})` : ''}`,
          quantity: item.quantity,
          unit: item.unit,
        }),
        [{ text: t('common.ok'), style: 'default' }],
      );
      setShowActionsMenu(null);
    } catch (error: any) {
      console.error('Error adding to shopping list:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('pantry.addToListError'),
      );
      setShowActionsMenu(null);
    }
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
      location: item.location || 'Buzdolabı',
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
      location: 'Buzdolabı',
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
    if (days === null) return colors.expiryNeutral;
    if (days <= 0) return colors.expiryUrgent;
    if (days <= 3) return colors.expirySoon;
    if (days <= 7) return colors.info;
    return colors.expiryOk;
  };

  const handleExpiryFilterChange = (filter: 'all' | 'expiring' | 'expired') => {
    setActiveExpiryFilter(filter);
    if (filter !== 'all') {
      setSelectedCategory('all');
    }
  };

  const renderCategoriesHeader = () => (
    <View>
      <Eyebrow style={styles.screenEyebrow}>{t('pantry.eyebrow')}</Eyebrow>
      <Display size="xl" style={styles.screenTitle}>
        {t('pantry.title')}
      </Display>

      <View style={styles.searchContainer}>
        <Search size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('pantry.searchPlaceholder')}
          placeholderTextColor={colors.inputPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoriesHeaderInList}>
        <SectionHeader
          title={t('pantry.categoriesTitle')}
          actionLabel={
            selectedCategory !== 'all' || activeExpiryFilter !== 'all'
              ? t('pantry.clearFilter')
              : undefined
          }
          onAction={() => {
            setSelectedCategory('all');
            setActiveExpiryFilter('all');
          }}
        />
      </View>

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
              style={[styles.categoryTab, isActive && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(category.key)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryContent}>
                <category.Icon
                  size={15}
                  strokeWidth={2}
                  color={isActive ? colors.textOnPrimary : colors.textSecondary}
                  style={styles.categoryEmoji}
                />
                <Eyebrow
                  color={isActive ? colors.textOnPrimary : colors.textSecondary}
                  style={styles.categoryTabText}
                >
                  {category.label}
                </Eyebrow>
                {count > 0 && (
                  <View
                    style={[
                      styles.categoryBadge,
                      isActive && {
                        backgroundColor: 'rgba(255,255,255,0.25)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        {
                          color: isActive
                            ? colors.textOnPrimary
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.statsBar}>
        <TouchableOpacity
          style={[
            styles.statItem,
            activeExpiryFilter === 'all' && styles.statItemActive,
          ]}
          onPress={() => handleExpiryFilterChange('all')}
          activeOpacity={0.7}
        >
          <Package
            size={14}
            color={
              activeExpiryFilter === 'all'
                ? colors.primary
                : colors.textSecondary
            }
          />
          <Display
            size="md"
            color={colors.textPrimary}
            style={styles.statValue}
          >
            {`${categoryStats['all'] || 0}`}
          </Display>
          <Eyebrow color={colors.textSecondary} style={styles.statLabel}>
            {t('pantry.statTotal')}
          </Eyebrow>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <TouchableOpacity
          style={[
            styles.statItem,
            activeExpiryFilter === 'expiring' && styles.statItemActive,
          ]}
          onPress={() =>
            handleExpiryFilterChange(
              activeExpiryFilter === 'expiring' ? 'all' : 'expiring',
            )
          }
          activeOpacity={0.7}
        >
          <AlertTriangle
            size={14}
            color={
              activeExpiryFilter === 'expiring'
                ? colors.warning
                : colors.textSecondary
            }
          />
          <Display
            size="md"
            color={colors.textPrimary}
            style={styles.statValue}
          >
            {`${
              items.filter((item) => {
                const days = getDaysUntilExpiry(item.expiry_date || '');
                return days !== null && days <= 3 && days >= 0;
              }).length
            }`}
          </Display>
          <Eyebrow color={colors.textSecondary} style={styles.statLabel}>
            {t('pantry.statExpiring')}
          </Eyebrow>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <TouchableOpacity
          style={[
            styles.statItem,
            activeExpiryFilter === 'expired' && styles.statItemActive,
          ]}
          onPress={() =>
            handleExpiryFilterChange(
              activeExpiryFilter === 'expired' ? 'all' : 'expired',
            )
          }
          activeOpacity={0.7}
        >
          <Clock
            size={14}
            color={
              activeExpiryFilter === 'expired'
                ? colors.error
                : colors.textSecondary
            }
          />
          <Display
            size="md"
            color={colors.textPrimary}
            style={styles.statValue}
          >
            {`${
              items.filter((item) => {
                const days = getDaysUntilExpiry(item.expiry_date || '');
                return days !== null && days < 0;
              }).length
            }`}
          </Display>
          <Eyebrow color={colors.textSecondary} style={styles.statLabel}>
            {t('pantry.statExpired')}
          </Eyebrow>
        </TouchableOpacity>
      </View>
    </View>
  );

  const CellRendererComponent = ({ children, index, style, ...props }: any) => {
    const itemData = filteredItems[index];
    const isMenuOpen = itemData && showActionsMenu === itemData.id;

    const cellStyle = [
      style,
      {
        zIndex: isMenuOpen ? 9999 : 1,
        elevation: isMenuOpen ? 9999 : 1,
      },
    ];

    return (
      <View style={cellStyle} {...props}>
        {children}
      </View>
    );
  };

  const expiryLabel = (days: number | null) => {
    if (days === null) return undefined;
    if (days === 0) return t('pantry.expiryToday');
    if (days === 1) return t('pantry.expiryTomorrow');
    if (days > 0) return t('pantry.expiryDays', { count: days });
    return t('pantry.expiryPassed');
  };

  const renderPantryItem: ListRenderItem<PantryItem> = ({ item, index }) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date || '');
    const expiryColor = getExpiryColor(daysUntilExpiry);

    const cardStyle = {
      width: numColumns === 1 ? ('100%' as const) : itemWidth - 8,
      marginRight: numColumns > 1 && (index + 1) % numColumns !== 0 ? 8 : 0,
    };

    return (
      <PantryItemCard
        item={item}
        imageSource={getItemImageSource(item.category)}
        daysUntilExpiry={daysUntilExpiry}
        expiryColor={expiryColor}
        expiryLabel={expiryLabel(daysUntilExpiry)}
        showMenu={showActionsMenu === item.id}
        onToggleMenu={() =>
          setShowActionsMenu(showActionsMenu === item.id ? null : item.id)
        }
        onEdit={() => handleEditItem(item)}
        onAddToShoppingList={() => handleAddToShoppingList(item)}
        onDelete={() => handleDeleteItem(item.id)}
        twoUp={numColumns > 1}
        style={cardStyle}
      />
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
            <Display size="lg" color={colors.textPrimary}>
              {editMode ? t('pantry.editTitle') : t('pantry.addTitle')}
            </Display>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetNewItem();
              }}
              style={styles.modalCloseButton}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Eyebrow color={colors.textSecondary} style={styles.label}>
                {t('pantry.fieldName')}
              </Eyebrow>
              <TextInput
                style={styles.input}
                placeholder={t('pantry.fieldNamePlaceholder')}
                placeholderTextColor={colors.inputPlaceholder}
                value={newItem.name}
                onChangeText={(text) => setNewItem({ ...newItem, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Eyebrow color={colors.textSecondary} style={styles.label}>
                {t('pantry.fieldBrand')}
              </Eyebrow>
              <TextInput
                style={styles.input}
                placeholder={t('pantry.fieldBrandPlaceholder')}
                placeholderTextColor={colors.inputPlaceholder}
                value={newItem.brand}
                onChangeText={(text) => setNewItem({ ...newItem, brand: text })}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Eyebrow color={colors.textSecondary} style={styles.label}>
                  {t('pantry.fieldQuantity')}
                </Eyebrow>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="numeric"
                  value={newItem.quantity}
                  onChangeText={(text) =>
                    setNewItem({ ...newItem, quantity: text })
                  }
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Eyebrow color={colors.textSecondary} style={styles.label}>
                  {t('pantry.fieldUnit')}
                </Eyebrow>
                <TouchableOpacity
                  style={styles.unitDropdownButton}
                  onPress={() => setShowUnitDropdown(true)}
                >
                  <Text style={styles.unitDropdownText}>
                    {UNITS.find((u) => u.value === newItem.unit)?.label ||
                      newItem.unit}
                  </Text>
                  <ChevronDown size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Eyebrow color={colors.textSecondary} style={styles.label}>
                {t('pantry.fieldCategory')}
              </Eyebrow>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryPicker}>
                  {CATEGORIES.slice(1).map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryChip,
                        newItem.category === cat.key &&
                          styles.categoryChipActive,
                      ]}
                      onPress={() =>
                        setNewItem({ ...newItem, category: cat.key })
                      }
                    >
                      <cat.Icon
                        size={15}
                        strokeWidth={2}
                        color={
                          newItem.category === cat.key
                            ? colors.primary
                            : colors.textSecondary
                        }
                        style={styles.categoryEmoji}
                      />
                      <Eyebrow
                        color={
                          newItem.category === cat.key
                            ? colors.primary
                            : colors.textSecondary
                        }
                        style={styles.categoryLabel}
                      >
                        {cat.label}
                      </Eyebrow>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Eyebrow color={colors.textSecondary} style={styles.label}>
                {t('pantry.fieldLocation')}
              </Eyebrow>
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
                      <Eyebrow
                        color={
                          newItem.location === loc
                            ? colors.primary
                            : colors.textSecondary
                        }
                        style={styles.locationText}
                      >
                        {locationLabel(loc)}
                      </Eyebrow>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Eyebrow color={colors.textSecondary} style={styles.label}>
                {t('pantry.fieldExpiry')}
              </Eyebrow>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.inputPlaceholder}
                value={newItem.expiry_date}
                onChangeText={(text) =>
                  setNewItem({ ...newItem, expiry_date: text })
                }
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
                <Text style={styles.cancelButtonText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addButton}
                onPress={editMode ? handleUpdateItem : handleAddItem}
              >
                <Text style={styles.addButtonText}>
                  {editMode ? t('pantry.updateButton') : t('common.add')}
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
            <Display size="sm" color={colors.textPrimary}>
              {t('pantry.pickUnit')}
            </Display>
            <TouchableOpacity
              onPress={() => setShowUnitDropdown(false)}
              style={styles.dropdownCloseButton}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.dropdownList}
            showsVerticalScrollIndicator={false}
          >
            {UNITS.map((unit) => (
              <TouchableOpacity
                key={unit.value}
                style={[
                  styles.dropdownItem,
                  newItem.unit === unit.value && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setNewItem({ ...newItem, unit: unit.value });
                  setShowUnitDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    newItem.unit === unit.value &&
                      styles.dropdownItemTextSelected,
                  ]}
                >
                  {unit.label} ({unit.value})
                </Text>
                <Text style={styles.dropdownItemCategory}>{unit.category}</Text>
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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('pantry.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredItems}
        renderItem={renderPantryItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        // Element (not function ref): a new function identity each render
        // remounts the header, blurring the search input and dropping the
        // keyboard between keystrokes.
        ListHeaderComponent={renderCategoriesHeader()}
        keyboardShouldPersistTaps="handled"
        CellRendererComponent={CellRendererComponent}
        removeClippedSubviews={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPantryItems}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Package size={56} color={colors.textSecondary} strokeWidth={1.5} />
            <Display
              size="md"
              color={colors.textPrimary}
              style={styles.emptyText}
            >
              {searchQuery ||
              selectedCategory !== 'all' ||
              activeExpiryFilter !== 'all'
                ? t('pantry.emptyNoResults')
                : t('pantry.emptyTitle')}
            </Display>
            <Eyebrow color={colors.textSecondary} style={styles.emptySubtext}>
              {searchQuery ||
              selectedCategory !== 'all' ||
              activeExpiryFilter !== 'all'
                ? t('pantry.emptyNoResultsHint')
                : t('pantry.emptyHint')}
            </Eyebrow>
          </View>
        )}
        columnWrapperStyle={
          numColumns > 1 ? styles.columnWrapperStyle : undefined
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.85}
      >
        <Plus size={24} color={colors.textOnPrimary} />
      </TouchableOpacity>

      {renderAddItemModal()}
      {renderUnitDropdown()}
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: spacing.sm + 4,
      fontSize: 15,
      color: colors.textSecondary,
      fontFamily: fonts.body,
    },
    screenEyebrow: {
      marginTop: spacing.sm,
    },
    screenTitle: {
      marginTop: spacing.xs + 2,
      marginBottom: spacing.md,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      height: 50,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: '#3C2814',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1,
    },
    searchInput: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingLeft: spacing.sm + 4,
      fontSize: 15,
      color: colors.textPrimary,
      fontFamily: fonts.body,
    },
    categoriesHeaderInList: {
      marginTop: spacing.lg,
    },
    categoriesScrollViewInList: {
      marginBottom: spacing.sm,
      height: 44,
    },
    categoryTab: {
      paddingHorizontal: spacing.md,
      marginRight: spacing.sm + 2,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
      elevation: 4,
    },
    categoryContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryEmoji: {
      fontSize: 16,
      marginRight: spacing.xs + 2,
    },
    categoryTabText: {
      fontSize: 10.5,
      letterSpacing: 0.8,
    },
    categoryBadge: {
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.md,
      marginLeft: spacing.sm,
      minWidth: 22,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryBadgeText: {
      fontFamily: fonts.bodyBold,
      fontSize: 11,
    },
    statsBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      marginTop: spacing.sm + 4,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: '#3C2814',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
    },
    statItemActive: {
      backgroundColor: colors.surfaceVariant,
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.borderLight,
      marginHorizontal: spacing.sm + 2,
      height: '55%',
      alignSelf: 'center',
    },
    statValue: {
      marginTop: 2,
    },
    statLabel: {
      fontSize: 9,
      marginTop: 2,
    },
    flatListContainer: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    flatListContent: {
      paddingTop: 0,
      paddingBottom: 120,
      flexGrow: 1,
    },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.32,
      shadowRadius: 14,
      elevation: 8,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 60,
    },
    emptyText: {
      marginTop: spacing.md,
      textAlign: 'center',
    },
    emptySubtext: {
      marginTop: spacing.sm,
      fontSize: 11,
      letterSpacing: 0.6,
      textTransform: 'none',
      fontFamily: fonts.bodyMedium,
    },
    columnWrapperStyle: {
      justifyContent: 'space-between',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    formGroup: {
      marginBottom: spacing.md + 4,
    },
    formRow: {
      flexDirection: 'row',
    },
    label: {
      marginBottom: spacing.sm + 2,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 6,
      fontSize: 15,
      color: colors.textPrimary,
      fontFamily: fonts.body,
    },
    categoryPicker: {
      flexDirection: 'row',
      paddingRight: spacing.lg,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1.5,
      borderColor: 'transparent',
      marginRight: spacing.sm + 2,
    },
    categoryChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    categoryLabel: {
      fontSize: 10.5,
      letterSpacing: 0.8,
      marginLeft: spacing.xs + 2,
    },
    locationPicker: {
      flexDirection: 'row',
      paddingRight: spacing.lg,
    },
    locationChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1.5,
      borderColor: 'transparent',
      marginRight: spacing.sm + 2,
    },
    locationChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    locationText: {
      fontSize: 10.5,
      letterSpacing: 0.8,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.sm + 4,
      marginTop: spacing.xl,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    cancelButtonText: {
      fontFamily: fonts.bodySemibold,
      fontSize: 15,
      color: colors.textSecondary,
    },
    addButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    addButtonText: {
      fontFamily: fonts.bodyBold,
      fontSize: 15,
      color: colors.textOnPrimary,
    },
    unitDropdownButton: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    unitDropdownText: {
      fontSize: 15,
      color: colors.textPrimary,
      flex: 1,
      fontFamily: fonts.body,
    },
    dropdownOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl + 8,
    },
    dropdownContainer: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      maxHeight: '70%',
      width: '100%',
      maxWidth: 320,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    dropdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md + 4,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    dropdownCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownList: {
      maxHeight: 300,
    },
    dropdownItem: {
      paddingHorizontal: spacing.md + 4,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderLight,
    },
    dropdownItemSelected: {
      backgroundColor: colors.surfaceVariant,
    },
    dropdownItemText: {
      fontSize: 15,
      color: colors.textPrimary,
      marginBottom: 2,
      fontFamily: fonts.bodyMedium,
    },
    dropdownItemTextSelected: {
      color: colors.primary,
      fontFamily: fonts.bodySemibold,
    },
    dropdownItemCategory: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: 'capitalize',
      fontFamily: fonts.body,
    },
  });
}
