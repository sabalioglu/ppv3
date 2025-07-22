import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import {
  ShoppingCart,
  Plus,
  Check,
  X,
  DollarSign,
  MapPin,
  Clock,
  TrendingUp,
  Zap,
  Search,
  Filter,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';

const { width } = Dimensions.get('window');

// Mock shopping list data
const mockShoppingItems = [
  {
    id: '1',
    name: 'Greek Yogurt',
    brand: 'Chobani',
    category: 'Dairy',
    quantity: 2,
    unit: 'containers',
    estimatedCost: 6.99,
    actualCost: null,
    priority: 'high',
    source: 'auto_pantry',
    sourceId: 'pantry-item-1',
    nutritionGoal: 'protein',
    storeSection: 'Dairy',
    isCompleted: false,
    notes: 'Plain, low-fat',
    alternatives: ['Fage', 'Two Good'],
    couponsAvailable: true,
    sustainabilityScore: 75,
  },
  {
    id: '2',
    name: 'Organic Spinach',
    brand: 'Earthbound Farm',
    category: 'Vegetables',
    quantity: 1,
    unit: 'bag',
    estimatedCost: 4.49,
    actualCost: 4.29,
    priority: 'medium',
    source: 'recipe',
    sourceId: 'recipe-1',
    nutritionGoal: 'fiber',
    storeSection: 'Produce',
    isCompleted: true,
    notes: 'Baby spinach preferred',
    alternatives: ['Regular spinach', 'Arugula'],
    couponsAvailable: false,
    sustainabilityScore: 90,
  },
  {
    id: '3',
    name: 'Chicken Breast',
    brand: 'Bell & Evans',
    category: 'Proteins',
    quantity: 2,
    unit: 'lbs',
    estimatedCost: 12.99,
    actualCost: null,
    priority: 'high',
    source: 'meal_plan',
    sourceId: 'meal-plan-1',
    nutritionGoal: 'protein',
    storeSection: 'Meat',
    isCompleted: false,
    notes: 'Organic, boneless',
    alternatives: ['Thighs', 'Turkey breast'],
    couponsAvailable: true,
    sustainabilityScore: 60,
  },
  {
    id: '4',
    name: 'Quinoa',
    brand: 'Ancient Harvest',
    category: 'Grains',
    quantity: 1,
    unit: 'box',
    estimatedCost: 5.99,
    actualCost: null,
    priority: 'low',
    source: 'ai_suggestion',
    sourceId: null,
    nutritionGoal: 'fiber',
    storeSection: 'Pantry',
    isCompleted: false,
    notes: 'Tri-color preferred',
    alternatives: ['White quinoa', 'Brown rice'],
    couponsAvailable: false,
    sustainabilityScore: 85,
  },
  {
    id: '5',
    name: 'Avocados',
    brand: null,
    category: 'Fruits',
    quantity: 4,
    unit: 'pieces',
    estimatedCost: 3.99,
    actualCost: 3.79,
    priority: 'medium',
    source: 'manual',
    sourceId: null,
    nutritionGoal: 'healthy fats',
    storeSection: 'Produce',
    isCompleted: true,
    notes: 'Ripe but firm',
    alternatives: [],
    couponsAvailable: false,
    sustainabilityScore: 70,
  },
];

const categories = ['All', 'Proteins', 'Vegetables', 'Fruits', 'Dairy', 'Grains', 'Snacks'];
const priorities = ['All', 'High', 'Medium', 'Low'];
const sources = ['All', 'Manual', 'Auto Pantry', 'Recipe', 'Meal Plan', 'AI Suggestion'];

interface ShoppingItemProps {
  item: typeof mockShoppingItems[0];
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ShoppingItem: React.FC<ShoppingItemProps> = ({
  item,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error[500];
      case 'medium': return colors.warning[500];
      case 'low': return colors.success[500];
      default: return colors.neutral[500];
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'auto_pantry': return <Clock size={12} color={colors.accent[500]} />;
      case 'recipe': return <Zap size={12} color={colors.secondary[500]} />;
      case 'meal_plan': return <TrendingUp size={12} color={colors.primary[500]} />;
      case 'ai_suggestion': return <Zap size={12} color={colors.warning[500]} />;
      default: return <Plus size={12} color={colors.neutral[500]} />;
    }
  };

  const getSustainabilityColor = (score: number) => {
    if (score >= 80) return colors.success[500];
    if (score >= 60) return colors.warning[500];
    return colors.error[500];
  };

  return (
    <View style={[styles.shoppingItem, item.isCompleted && styles.shoppingItemCompleted]}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={onToggleComplete}
      >
        <View style={[styles.checkbox, item.isCompleted && styles.checkboxCompleted]}>
          {item.isCompleted && (
            <Check size={16} color={colors.neutral[0]} />
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, item.isCompleted && styles.itemNameCompleted]}>
            {item.name}
          </Text>
          <View style={styles.itemBadges}>
            {item.couponsAvailable && (
              <View style={styles.couponBadge}>
                <DollarSign size={10} color={colors.success[600]} />
              </View>
            )}
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemBrand}>
            {item.brand ? `${item.brand} • ` : ''}{item.category}
          </Text>
          <Text style={styles.itemQuantity}>
            {item.quantity} {item.unit}
          </Text>
        </View>
        
        <View style={styles.itemMeta}>
          <View style={styles.metaItem}>
            {getSourceIcon(item.source)}
            <Text style={styles.metaText}>
              {item.source.replace('_', ' ')}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <MapPin size={12} color={colors.neutral[500]} />
            <Text style={styles.metaText}>{item.storeSection}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <View
              style={[
                styles.sustainabilityDot,
                { backgroundColor: getSustainabilityColor(item.sustainabilityScore) }
              ]}
            />
            <Text style={styles.metaText}>{item.sustainabilityScore}% sustainable</Text>
          </View>
        </View>
        
        <View style={styles.itemFooter}>
          <View style={styles.costContainer}>
            <Text style={styles.estimatedCost}>
              Est: ${item.estimatedCost.toFixed(2)}
            </Text>
            {item.actualCost && (
              <Text style={styles.actualCost}>
                Actual: ${item.actualCost.toFixed(2)}
              </Text>
            )}
          </View>
          
          {item.nutritionGoal && (
            <View style={styles.nutritionGoal}>
              <Text style={styles.nutritionGoalText}>For: {item.nutritionGoal}</Text>
            </View>
          )}
        </View>
        
        {item.notes && (
          <Text style={styles.itemNotes}>{item.notes}</Text>
        )}
        
        {item.alternatives.length > 0 && (
          <View style={styles.alternatives}>
            <Text style={styles.alternativesLabel}>Alternatives: </Text>
            <Text style={styles.alternativesText}>
              {item.alternatives.join(', ')}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <X size={16} color={colors.error[500]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ShoppingList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const filteredItems = mockShoppingItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || 
                           item.priority.toLowerCase() === selectedPriority.toLowerCase();
    const matchesCompletion = showCompleted || !item.isCompleted;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesCompletion;
  });

  const completedItems = filteredItems.filter(item => item.isCompleted);
  const pendingItems = filteredItems.filter(item => !item.isCompleted);
  const totalEstimatedCost = pendingItems.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalActualCost = completedItems.reduce((sum, item) => sum + (item.actualCost || item.estimatedCost), 0);

  const handleToggleComplete = (itemId: string) => {
    console.log('Toggle complete for item:', itemId);
  };

  const handleEditItem = (itemId: string) => {
    console.log('Edit item:', itemId);
  };

  const handleDeleteItem = (itemId: string) => {
    console.log('Delete item:', itemId);
  };

  const handleAddItem = () => {
    if (newItemName.trim()) {
      console.log('Add new item:', newItemName);
      setNewItemName('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Shopping</Text>
        <Text style={styles.headerSubtitle}>
          {pendingItems.length} items • Est. ${totalEstimatedCost.toFixed(2)}
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
      </View>

      {/* Filters */}
      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
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
            <Text style={styles.filterLabel}>Priority:</Text>
            <View style={styles.filterChips}>
              {priorities.map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.filterChip,
                    selectedPriority === priority && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedPriority(priority)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedPriority === priority && styles.filterChipTextActive
                    ]}
                  >
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <ShoppingCart size={16} color={colors.primary[500]} />
          <Text style={styles.statNumber}>{pendingItems.length}</Text>
          <Text style={styles.statLabel}>To Buy</Text>
        </View>
        
        <View style={styles.statCard}>
          <Check size={16} color={colors.success[500]} />
          <Text style={styles.statNumber}>{completedItems.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <View style={styles.statCard}>
          <DollarSign size={16} color={colors.warning[500]} />
          <Text style={styles.statNumber}>${totalEstimatedCost.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Budget</Text>
        </View>
        
        <View style={styles.statCard}>
          <TrendingUp size={16} color={colors.accent[500]} />
          <Text style={styles.statNumber}>${totalActualCost.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
      </View>

      {/* Quick Add */}
      <View style={styles.quickAddContainer}>
        <TextInput
          style={styles.quickAddInput}
          placeholder="Add item to list..."
          value={newItemName}
          onChangeText={setNewItemName}
          placeholderTextColor={colors.neutral[400]}
          onSubmitEditing={handleAddItem}
        />
        <TouchableOpacity style={styles.quickAddButton} onPress={handleAddItem}>
          <Plus size={20} color={colors.neutral[0]} />
        </TouchableOpacity>
      </View>

      {/* Shopping List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              To Buy ({pendingItems.length})
            </Text>
            {pendingItems.map(item => (
              <ShoppingItem
                key={item.id}
                item={item}
                onToggleComplete={() => handleToggleComplete(item.id)}
                onEdit={() => handleEditItem(item.id)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
          </View>
        )}

        {/* Completed Items */}
        {showCompleted && completedItems.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowCompleted(!showCompleted)}
            >
              <Text style={styles.sectionTitle}>
                Completed ({completedItems.length})
              </Text>
            </TouchableOpacity>
            {completedItems.map(item => (
              <ShoppingItem
                key={item.id}
                item={item}
                onToggleComplete={() => handleToggleComplete(item.id)}
                onEdit={() => handleEditItem(item.id)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
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
  filtersContainer: {
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  filtersContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  filterSection: {
    marginRight: spacing.xl,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.neutral[100],
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  statNumber: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[800],
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[500],
  },
  quickAddContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[0],
    gap: spacing.md,
  },
  quickAddInput: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[800],
  },
  quickAddButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Poppins-SemiBold',
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  shoppingItem: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...shadows.md,
  },
  shoppingItemCompleted: {
    opacity: 0.7,
  },
  checkboxContainer: {
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.success[500],
    borderColor: colors.success[500],
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  itemName: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[800],
    flex: 1,
    marginRight: spacing.sm,
  },
  itemNameCompleted: {
    textDecorationLine: 'line-through',
    color: colors.neutral[500],
  },
  itemBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  couponBadge: {
    backgroundColor: colors.success[100],
    borderRadius: 8,
    padding: spacing.xs,
  },
  priorityBadge: {
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Bold',
    color: colors.neutral[0],
    textTransform: 'uppercase',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  itemBrand: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
  },
  itemQuantity: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
    textTransform: 'capitalize',
  },
  sustainabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  costContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  estimatedCost: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
  },
  actualCost: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.success[600],
  },
  nutritionGoal: {
    backgroundColor: colors.accent[50],
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  nutritionGoalText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    color: colors.accent[600],
  },
  itemNotes: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  alternatives: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  alternativesLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[500],
  },
  alternativesText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
  },
  itemActions: {
    marginLeft: spacing.sm,
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionButtonText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    color: colors.primary[600],
  },
  deleteButton: {
    backgroundColor: colors.error[50],
    borderRadius: 8,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});