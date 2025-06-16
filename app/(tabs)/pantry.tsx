import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  AlertTriangle,
  Calendar,
  MapPin,
  Plus,
  Star,
  Clock,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';

const { width } = Dimensions.get('window');

// Mock pantry data
const mockPantryItems = [
  {
    id: '1',
    name: 'Greek Yogurt',
    brand: 'Chobani',
    category: 'Dairy',
    quantity: 2,
    unit: 'containers',
    location: 'fridge',
    expiryDate: '2025-01-10',
    daysUntilExpiry: 2,
    imageUrl: 'https://images.pexels.com/photos/1647163/pexels-photo-1647163.jpeg',
    calories: 150,
    protein: 20,
    isFavorite: true,
    isOpened: false,
  },
  {
    id: '2',
    name: 'Baby Spinach',
    brand: 'Organic Valley',
    category: 'Vegetables',
    quantity: 1,
    unit: 'bag',
    location: 'fridge',
    expiryDate: '2025-01-11',
    daysUntilExpiry: 3,
    imageUrl: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg',
    calories: 23,
    protein: 2.9,
    isFavorite: false,
    isOpened: true,
  },
  {
    id: '3',
    name: 'Chicken Breast',
    brand: 'Fresh Market',
    category: 'Proteins',
    quantity: 1.2,
    unit: 'lbs',
    location: 'fridge',
    expiryDate: '2025-01-09',
    daysUntilExpiry: 1,
    imageUrl: 'https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg',
    calories: 165,
    protein: 31,
    isFavorite: false,
    isOpened: false,
  },
  {
    id: '4',
    name: 'Brown Rice',
    brand: 'Uncle Ben\'s',
    category: 'Grains',
    quantity: 500,
    unit: 'g',
    location: 'pantry',
    expiryDate: '2025-12-15',
    daysUntilExpiry: 350,
    imageUrl: 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg',
    calories: 370,
    protein: 7.9,
    isFavorite: true,
    isOpened: true,
  },
  {
    id: '5',
    name: 'Avocados',
    brand: 'Organic',
    category: 'Fruits',
    quantity: 3,
    unit: 'pieces',
    location: 'counter',
    expiryDate: '2025-01-12',
    daysUntilExpiry: 4,
    imageUrl: 'https://images.pexels.com/photos/557659/pexels-photo-557659.jpeg',
    calories: 160,
    protein: 2,
    isFavorite: true,
    isOpened: false,
  },
  {
    id: '6',
    name: 'Frozen Berries',
    brand: 'Nature\'s Way',
    category: 'Fruits',
    quantity: 1,
    unit: 'bag',
    location: 'freezer',
    expiryDate: '2025-08-15',
    daysUntilExpiry: 220,
    imageUrl: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg',
    calories: 80,
    protein: 1,
    isFavorite: false,
    isOpened: true,
  },
];

const categories = ['All', 'Proteins', 'Vegetables', 'Fruits', 'Dairy', 'Grains', 'Snacks'];
const locations = ['All', 'Fridge', 'Pantry', 'Freezer', 'Counter'];

interface PantryItemProps {
  item: typeof mockPantryItems[0];
  viewMode: 'grid' | 'list';
  onPress: () => void;
}

const PantryItem: React.FC<PantryItemProps> = ({ item, viewMode, onPress }) => {
  const getExpiryColor = (days: number) => {
    if (days <= 1) return colors.error[500];
    if (days <= 3) return colors.warning[500];
    if (days <= 7) return colors.secondary[500];
    return colors.neutral[500];
  };

  const getLocationIcon = (location: string) => {
    return <MapPin size={12} color={colors.neutral[500]} />;
  };

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity style={styles.gridItem} onPress={onPress}>
        <View style={styles.itemImageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          {item.isFavorite && (
            <View style={styles.favoriteIcon}>
              <Star size={12} color={colors.secondary[500]} fill={colors.secondary[500]} />
            </View>
          )}
          {item.isOpened && (
            <View style={styles.openedBadge}>
              <Text style={styles.openedText}>Opened</Text>
            </View>
          )}
        </View>
        
        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.itemBrand} numberOfLines={1}>{item.brand}</Text>
          
          <View style={styles.itemMeta}>
            <View style={styles.quantityContainer}>
              <Text style={styles.quantity}>{item.quantity} {item.unit}</Text>
            </View>
            
            <View style={styles.locationContainer}>
              {getLocationIcon(item.location)}
              <Text style={styles.location}>{item.location}</Text>
            </View>
          </View>
          
          <View style={styles.expiryContainer}>
            <Clock size={12} color={getExpiryColor(item.daysUntilExpiry)} />
            <Text style={[styles.expiryText, { color: getExpiryColor(item.daysUntilExpiry) }]}>
              {item.daysUntilExpiry <= 1 ? 'Expires today' : `${item.daysUntilExpiry}d left`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <Image source={{ uri: item.imageUrl }} style={styles.listItemImage} />
      
      <View style={styles.listItemContent}>
        <View style={styles.listItemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.isFavorite && (
            <Star size={16} color={colors.secondary[500]} fill={colors.secondary[500]} />
          )}
        </View>
        
        <Text style={styles.itemBrand}>{item.brand} • {item.category}</Text>
        
        <View style={styles.listItemMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.quantity}>{item.quantity} {item.unit}</Text>
          </View>
          
          <View style={styles.metaItem}>
            {getLocationIcon(item.location)}
            <Text style={styles.location}>{item.location}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Clock size={12} color={getExpiryColor(item.daysUntilExpiry)} />
            <Text style={[styles.expiryText, { color: getExpiryColor(item.daysUntilExpiry) }]}>
              {item.daysUntilExpiry <= 1 ? 'Today' : `${item.daysUntilExpiry}d`}
            </Text>
          </View>
        </View>
        
        <View style={styles.nutritionInfo}>
          <Text style={styles.nutritionText}>{item.calories} cal • {item.protein}g protein</Text>
        </View>
      </View>
      
      {item.isOpened && (
        <View style={styles.openedIndicator} />
      )}
    </TouchableOpacity>
  );
};

export default function Pantry() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const filteredItems = mockPantryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesLocation = selectedLocation === 'All' ||
                           item.location.toLowerCase() === selectedLocation.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const expiringItems = filteredItems.filter(item => item.daysUntilExpiry <= 7);
  const totalValue = filteredItems.reduce((sum, item) => sum + (item.calories * 0.1), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Pantry</Text>
        <Text style={styles.headerSubtitle}>
          {filteredItems.length} items • {expiringItems.length} expiring soon
        </Text>
      </View>

      {/* Search and Controls */}
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.neutral[400]}
          />
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={colors.primary[500]} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          {viewMode === 'grid' ? (
            <List size={20} color={colors.primary[500]} />
          ) : (
            <Grid3X3 size={20} color={colors.primary[500]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category:</Text>
              <View style={styles.filterChips}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterChip,
                      selectedCategory === category && styles.filterChipActive
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategory === category && styles.filterChipTextActive
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Location:</Text>
              <View style={styles.filterChips}>
                {locations.map(location => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.filterChip,
                      selectedLocation === location && styles.filterChipActive
                    ]}
                    onPress={() => setSelectedLocation(location)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedLocation === location && styles.filterChipTextActive
                      ]}
                    >
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <AlertTriangle size={16} color={colors.warning[500]} />
          <Text style={styles.statNumber}>{expiringItems.length}</Text>
          <Text style={styles.statLabel}>Expiring</Text>
        </View>
        
        <View style={styles.statCard}>
          <Calendar size={16} color={colors.primary[500]} />
          <Text style={styles.statNumber}>{filteredItems.length}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>${totalValue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Est. Value</Text>
        </View>
      </View>

      {/* Items List/Grid */}
      <ScrollView
        style={styles.itemsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.itemsContent}
      >
        {viewMode === 'grid' ? (
          <View style={styles.gridContainer}>
            {filteredItems.map(item => (
              <PantryItem
                key={item.id}
                item={item}
                viewMode={viewMode}
                onPress={() => console.log('Item pressed:', item.name)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredItems.map(item => (
              <PantryItem
                key={item.id}
                item={item}
                viewMode={viewMode}
                onPress={() => console.log('Item pressed:', item.name)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton}>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitle: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
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
    fontFamily: 'Inter-Regular',
    color: colors.neutral[800],
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingVertical: spacing.md,
  },
  filterSection: {
    marginRight: spacing.lg,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
    marginBottom: spacing.xs,
    marginLeft: spacing.lg,
  },
  filterChips: {
    flexDirection: 'row',
    paddingLeft: spacing.lg,
  },
  filterChip: {
    backgroundColor: colors.neutral[100],
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
  },
  filterChipTextActive: {
    color: colors.neutral[0],
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  statNumber: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[800],
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[500],
  },
  itemsContainer: {
    flex: 1,
  },
  itemsContent: {
    padding: spacing.lg,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listContainer: {
    gap: spacing.md,
  },
  gridItem: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  listItem: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    ...shadows.md,
  },
  itemImageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: spacing.md,
  },
  favoriteIcon: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing.xs,
  },
  openedBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.accent[500],
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  openedText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: colors.neutral[0],
  },
  openedIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent[500],
  },
  itemContent: {
    padding: spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  itemName: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
    flex: 1,
  },
  itemBrand: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
    marginBottom: spacing.sm,
  },
  itemMeta: {
    marginBottom: spacing.sm,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quantity: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[700],
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  location: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
    textTransform: 'capitalize',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  expiryText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
  },
  nutritionInfo: {
    marginTop: spacing.xs,
  },
  nutritionText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
  },
  addButton: {
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