// CATEGORIES dizisini güncelleyelim - daha detaylı kategoriler
const CATEGORIES = [
  { key: 'all', label: 'All Items', emoji: '📦', count: 0 },
  { key: 'dairy', label: 'Dairy', emoji: '🥛', count: 0 },
  { key: 'meat', label: 'Meat & Fish', emoji: '🥩', count: 0 },
  { key: 'vegetables', label: 'Vegetables', emoji: '🥬', count: 0 },
  { key: 'fruits', label: 'Fruits', emoji: '🍎', count: 0 },
  { key: 'grains', label: 'Grains & Bread', emoji: '🌾', count: 0 },
  { key: 'snacks', label: 'Snacks', emoji: '🍿', count: 0 },
  { key: 'beverages', label: 'Beverages', emoji: '🥤', count: 0 },
  { key: 'condiments', label: 'Sauces & Spices', emoji: '🧂', count: 0 },
  { key: 'frozen', label: 'Frozen', emoji: '🧊', count: 0 },
  { key: 'canned', label: 'Canned Goods', emoji: '🥫', count: 0 },
  { key: 'bakery', label: 'Bakery', emoji: '🥐', count: 0 },
];

// Component'e kategori sayılarını ekleyelim
export default function PantryScreen() {
  // Mevcut state'lere ekle
  const [categoryStats, setCategoryStats] = useState<{[key: string]: number}>({});

  // loadPantryItems fonksiyonunu güncelle
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
      
      // Kategori istatistiklerini hesapla
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

  // Kategori sekmelerini güncelleyelim - sayıları gösterelim
  return (
    <View style={styles.container}>
      {/* Header - değişiklik yok */}
      
      {/* Search Bar - değişiklik yok */}
      
      {/* Enhanced Categories with Stats */}
      <View>
        <View style={styles.categoriesHeader}>
          <Text style={styles.categoriesTitle}>Categories</Text>
          <TouchableOpacity onPress={() => setSelectedCategory('all')}>
            <Text style={styles.clearFilter}>Clear Filter</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
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
      </View>

      {/* Quick Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Package size={16} color={colors.primary} />
          <Text style={styles.statValue}>{categoryStats['all'] || 0}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <AlertTriangle size={16} color={colors.warning} />
          <Text style={styles.statValue}>
            {items.filter(item => {
              const days = getDaysUntilExpiry(item.expiry_date || '');
              return days !== null && days <= 3 && days >= 0;
            }).length}
          </Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Clock size={16} color={colors.error} />
          <Text style={styles.statValue}>
            {items.filter(item => {
              const days = getDaysUntilExpiry(item.expiry_date || '');
              return days !== null && days < 0;
            }).length}
          </Text>
          <Text style={styles.statLabel}>Expired</Text>
        </View>
      </View>

      {/* Items List - mevcut kod... */}
      
      {/* Add Item Modal - kategori seçimini güncelleyelim */}
      {/* Modal içinde kategori seçimi kısmını güncelle */}
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
    </View>
  );
}

// Yeni stiller ekle
const additionalStyles = StyleSheet.create({
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  clearFilter: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  categoryBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryBadgeTextActive: {
    color: 'white',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: spacing.md,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

// styles objesine yeni stilleri ekle
const styles = StyleSheet.create({
  ...existingStyles,
  ...additionalStyles,
});
