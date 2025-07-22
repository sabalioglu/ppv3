import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Settings, 
  ChevronRight,
  Clock,
  Users,
  Flame,
  ShieldCheck,
  Plus,
  Heart,
  ShoppingCart,
  Target,
  TrendingUp,
  Calendar,
  ChefHat,
  AlertCircle,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

export default function AIMealPlan() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [pantryItems, setPantryItems] = useState<any[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<any[]>([]);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Pantry health metrics
  const [pantryMetrics, setPantryMetrics] = useState({
    totalItems: 0,
    expiringItems: 0,
    expiredItems: 0,
    categories: {} as Record<string, number>,
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      // Mock data for now
      setUserProfile({
        dietary_restrictions: ['gluten'],
        dietary_preferences: ['carnivore', 'low_carb', 'low_fat'],
      });

      setPantryItems([
        { id: 1, name: 'Chicken', category: 'protein', expiry_date: '2024-01-15' },
        { id: 2, name: 'Eggs', category: 'protein', expiry_date: '2024-01-10' },
        { id: 3, name: 'Spinach', category: 'vegetables', expiry_date: '2024-01-08' },
        { id: 4, name: 'Olive Oil', category: 'fats', expiry_date: '2024-06-01' },
        { id: 5, name: 'Tomatoes', category: 'vegetables', expiry_date: '2024-01-05' },
        { id: 6, name: 'Cheese', category: 'dairy', expiry_date: '2024-01-12' },
      ]);

      calculatePantryMetrics([
        { id: 1, name: 'Chicken', category: 'protein', expiry_date: '2024-01-15' },
        { id: 2, name: 'Eggs', category: 'protein', expiry_date: '2024-01-10' },
        { id: 3, name: 'Spinach', category: 'vegetables', expiry_date: '2024-01-08' },
        { id: 4, name: 'Olive Oil', category: 'fats', expiry_date: '2024-06-01' },
        { id: 5, name: 'Tomatoes', category: 'vegetables', expiry_date: '2024-01-05' },
        { id: 6, name: 'Cheese', category: 'dairy', expiry_date: '2024-01-12' },
      ]);

      // Generate meal plan
      await generateMealPlan();

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load meal plan data');
    }
  };

  const calculatePantryMetrics = (items: any[]) => {
    const today = new Date();
    let expiringCount = 0;
    let expiredCount = 0;
    const categoryCount: Record<string, number> = {};

    items.forEach(item => {
      // Category counting
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;

      // Expiry checking
      if (item.expiry_date) {
        const expiryDate = new Date(item.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          expiredCount++;
        } else if (daysUntilExpiry <= 3) {
          expiringCount++;
        }
      }
    });

    setPantryMetrics({
      totalItems: items.length,
      expiringItems: expiringCount,
      expiredItems: expiredCount,
      categories: categoryCount,
    });
  };

  const generateMealPlan = async () => {
    // Mock meal plan
    const mockPlan = {
      daily: {
        breakfast: {
          name: "Protein Omelette",
          calories: 450,
          protein: 30,
          pantryMatch: 5,
          totalIngredients: 6,
          missingIngredients: ["Fresh herbs"],
          allergenSafe: true,
          prepTime: 15,
          emoji: "🍳"
        },
        lunch: {
          name: "Mediterranean Bowl",
          calories: 650,
          protein: 35,
          pantryMatch: 7,
          totalIngredients: 8,
          missingIngredients: ["Feta cheese"],
          allergenSafe: true,
          prepTime: 20,
          emoji: "🥗"
        },
        dinner: {
          name: "Grilled Chicken & Veggies",
          calories: 750,
          protein: 45,
          pantryMatch: 8,
          totalIngredients: 8,
          missingIngredients: [],
          allergenSafe: true,
          prepTime: 30,
          emoji: "🍗"
        },
        snacks: [
          {
            name: "Greek Yogurt with Berries",
            calories: 200,
            protein: 15,
            emoji: "🥛"
          },
          {
            name: "Energy Balls",
            calories: 150,
            protein: 5,
            emoji: "🟤"
          }
        ],
        totalCalories: 2200,
        totalProtein: 130,
      }
    };

    setMealPlan(mockPlan);
  };

  const handleMealPress = (meal: any) => {
    Alert.alert(
      meal.name,
      `${meal.calories} calories • ${meal.protein}g protein`,
      [
        { text: 'View Recipe', onPress: () => console.log('View recipe') },
        { text: 'Add to Today', onPress: () => console.log('Add to nutrition') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleAddToShoppingList = (missingIngredients: string[]) => {
    Alert.alert(
      'Add to Shopping List',
      `Add ${missingIngredients.length} missing ingredients?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Items', 
          onPress: () => {
            Alert.alert('Success', 'Items added to shopping list');
          }
        }
      ]
    );
  };

  const renderDailyView = () => {
    if (!mealPlan?.daily) return null;
    const plan = mealPlan.daily;

    return (
      <View style={styles.dailyContent}>
        {/* Today's Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Today's Plan</Text>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>Optimized</Text>
            </View>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Target size={20} color={colors.primary[500]} />
              </View>
              <Text style={styles.statValue}>{plan.totalCalories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <TrendingUp size={20} color={colors.success[500]} />
              </View>
              <Text style={styles.statValue}>{plan.totalProtein}g</Text>
              <Text style={styles.statLabel}>Protein</Text>
            </View>
          </View>
        </View>

        {/* Meals Section */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          
          {/* Breakfast */}
          <TouchableOpacity 
            style={styles.mealCard}
            onPress={() => handleMealPress(plan.breakfast)}
          >
            <View style={styles.mealCardHeader}>
              <View style={styles.mealTimeContainer}>
                <Text style={styles.mealEmoji}>{plan.breakfast.emoji}</Text>
                <View>
                  <Text style={styles.mealTime}>Breakfast</Text>
                  <Text style={styles.mealName}>{plan.breakfast.name}</Text>
                </View>
              </View>
              
              <View style={styles.mealMatchBadge}>
                <Text style={styles.mealMatchText}>
                  {plan.breakfast.pantryMatch}/{plan.breakfast.totalIngredients}
                </Text>
              </View>
            </View>
            
            <View style={styles.mealStats}>
              <View style={styles.mealStatItem}>
                <Flame size={14} color={colors.warning[500]} />
                <Text style={styles.mealStatText}>{plan.breakfast.calories} cal</Text>
              </View>
              <View style={styles.mealStatItem}>
                <TrendingUp size={14} color={colors.success[500]} />
                <Text style={styles.mealStatText}>{plan.breakfast.protein}g protein</Text>
              </View>
              <View style={styles.mealStatItem}>
                <Clock size={14} color={colors.neutral[500]} />
                <Text style={styles.mealStatText}>{plan.breakfast.prepTime} min</Text>
              </View>
            </View>
            
            {plan.breakfast.missingIngredients.length > 0 && (
              <TouchableOpacity 
                style={styles.missingAlert}
                onPress={() => handleAddToShoppingList(plan.breakfast.missingIngredients)}
              >
                <AlertCircle size={16} color={colors.warning[600]} />
                <Text style={styles.missingText}>
                  Missing: {plan.breakfast.missingIngredients.join(', ')}
                </Text>
                <Plus size={16} color={colors.warning[600]} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Lunch */}
          <TouchableOpacity 
            style={styles.mealCard}
            onPress={() => handleMealPress(plan.lunch)}
          >
            <View style={styles.mealCardHeader}>
              <View style={styles.mealTimeContainer}>
                <Text style={styles.mealEmoji}>{plan.lunch.emoji}</Text>
                <View>
                  <Text style={styles.mealTime}>Lunch</Text>
                  <Text style={styles.mealName}>{plan.lunch.name}</Text>
                </View>
              </View>
              
              <View style={styles.mealMatchBadge}>
                <Text style={styles.mealMatchText}>
                  {plan.lunch.pantryMatch}/{plan.lunch.totalIngredients}
                </Text>
              </View>
            </View>
            
            <View style={styles.mealStats}>
              <View style={styles.mealStatItem}>
                <Flame size={14} color={colors.warning[500]} />
                <Text style={styles.mealStatText}>{plan.lunch.calories} cal</Text>
              </View>
              <View style={styles.mealStatItem}>
                <TrendingUp size={14} color={colors.success[500]} />
                <Text style={styles.mealStatText}>{plan.lunch.protein}g protein</Text>
              </View>
              <View style={styles.mealStatItem}>
                <Clock size={14} color={colors.neutral[500]} />
                <Text style={styles.mealStatText}>{plan.lunch.prepTime} min</Text>
              </View>
            </View>
            
            {plan.lunch.missingIngredients.length > 0 && (
              <TouchableOpacity 
                style={styles.missingAlert}
                onPress={() => handleAddToShoppingList(plan.lunch.missingIngredients)}
              >
                <AlertCircle size={16} color={colors.warning[600]} />
                <Text style={styles.missingText}>
                  Missing: {plan.lunch.missingIngredients.join(', ')}
                </Text>
                <Plus size={16} color={colors.warning[600]} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Dinner */}
          <TouchableOpacity 
            style={styles.mealCard}
            onPress={() => handleMealPress(plan.dinner)}
          >
            <View style={styles.mealCardHeader}>
              <View style={styles.mealTimeContainer}>
                <Text style={styles.mealEmoji}>{plan.dinner.emoji}</Text>
                <View>
                  <Text style={styles.mealTime}>Dinner</Text>
                  <Text style={styles.mealName}>{plan.dinner.name}</Text>
                </View>
              </View>
              
              <View style={[styles.mealMatchBadge, styles.perfectMatch]}>
                <Text style={[styles.mealMatchText, styles.perfectMatchText]}>
                  {plan.dinner.pantryMatch}/{plan.dinner.totalIngredients}
                </Text>
              </View>
            </View>
            
            <View style={styles.mealStats}>
              <View style={styles.mealStatItem}>
                <Flame size={14} color={colors.warning[500]} />
                <Text style={styles.mealStatText}>{plan.dinner.calories} cal</Text>
              </View>
              <View style={styles.mealStatItem}>
                <TrendingUp size={14} color={colors.success[500]} />
                <Text style={styles.mealStatText}>{plan.dinner.protein}g protein</Text>
              </View>
              <View style={styles.mealStatItem}>
                <Clock size={14} color={colors.neutral[500]} />
                <Text style={styles.mealStatText}>{plan.dinner.prepTime} min</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Snacks Section */}
        <View style={styles.snacksSection}>
          <Text style={styles.sectionTitle}>Snacks</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.snacksContainer}>
            {plan.snacks.map((snack, index) => (
              <View key={index} style={styles.snackCard}>
                <Text style={styles.snackEmoji}>{snack.emoji}</Text>
                <Text style={styles.snackName}>{snack.name}</Text>
                <Text style={styles.snackStats}>
                  {snack.calories} cal • {snack.protein}g protein
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Creating your personalized meal plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Meal Plan</Text>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
          <Settings size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
      </View>

      {/* View Mode Tabs */}
      <View style={styles.viewModeTabs}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'daily' && styles.activeTab]}
          onPress={() => setViewMode('daily')}
        >
          <Text style={[styles.tabText, viewMode === 'daily' && styles.activeTabText]}>
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'weekly' && styles.activeTab]}
          onPress={() => setViewMode('weekly')}
        >
          <Text style={[styles.tabText, viewMode === 'weekly' && styles.activeTabText]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'monthly' && styles.activeTab]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[styles.tabText, viewMode === 'monthly' && styles.activeTabText]}>
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadAllData}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Pantry Status Card */}
        <TouchableOpacity 
          style={styles.pantryStatusCard}
          onPress={() => router.push('/(tabs)/pantry')}
        >
          <View style={styles.pantryStatusLeft}>
            <View style={styles.pantryStatusHeader}>
              <Text style={styles.pantryStatusTitle}>Pantry Status</Text>
              {pantryMetrics.expiredItems > 0 && (
                <View style={styles.expiredBadge}>
                  <Text style={styles.expiredBadgeText}>{pantryMetrics.expiredItems} expired</Text>
                </View>
              )}
            </View>
            <Text style={styles.pantryStatusSubtitle}>
              {pantryMetrics.totalItems} items • {pantryMetrics.expiringItems} expiring soon
            </Text>
          </View>
          <ChevronRight size={20} color={colors.neutral[400]} />
        </TouchableOpacity>

        {/* Allergen Safety Info */}
        {userProfile?.dietary_restrictions?.length > 0 && (
          <View style={styles.allergenInfo}>
            <ShieldCheck size={20} color={colors.success[600]} />
            <Text style={styles.allergenText}>
              All recipes are free from: {userProfile.dietary_restrictions.join(', ')}
            </Text>
          </View>
        )}

        {/* Preferences Card */}
        <View style={styles.preferencesCard}>
          <Text style={styles.preferencesTitle}>Your Preferences</Text>
          <View style={styles.preferencesTags}>
            {userProfile?.dietary_preferences?.map((pref: string) => (
              <View key={pref} style={styles.preferenceTag}>
                <Text style={styles.preferenceTagText}>{pref.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Meal Plan Content */}
        {viewMode === 'daily' && renderDailyView()}
        {viewMode === 'weekly' && (
          <View style={styles.comingSoonContainer}>
            <Calendar size={48} color={colors.neutral[400]} />
            <Text style={styles.comingSoonTitle}>Weekly View Coming Soon</Text>
            <Text style={styles.comingSoonSubtitle}>Plan your entire week with AI-generated meal plans</Text>
          </View>
        )}
        {viewMode === 'monthly' && (
          <View style={styles.comingSoonContainer}>
            <Calendar size={48} color={colors.neutral[400]} />
            <Text style={styles.comingSoonTitle}>Monthly View Coming Soon</Text>
            <Text style={styles.comingSoonSubtitle}>Long-term meal planning and shopping optimization</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/nutrition')}
          >
            <View style={styles.actionButtonIcon}>
              <Heart size={20} color={colors.error[500]} />
            </View>
            <Text style={styles.actionButtonText}>Track Nutrition</Text>
            <ChevronRight size={16} color={colors.neutral[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/shopping')}
          >
            <View style={styles.actionButtonIcon}>
              <ShoppingCart size={20} color={colors.primary[500]} />
            </View>
            <Text style={styles.actionButtonText}>Shopping List</Text>
            <ChevronRight size={16} color={colors.neutral[400]} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary[600],
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  pantryStatusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 16,
    ...shadows.sm,
  },
  pantryStatusLeft: {
    flex: 1,
  },
  pantryStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pantryStatusTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
    marginRight: spacing.md,
  },
  expiredBadge: {
    backgroundColor: colors.error[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  expiredBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.error[600],
    fontWeight: '600',
  },
  pantryStatusSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
  allergenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 12,
  },
  allergenText: {
    fontSize: typography.fontSize.sm,
    color: colors.success[700],
    marginLeft: spacing.sm,
    flex: 1,
  },
  preferencesCard: {
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 16,
    ...shadows.sm,
  },
  preferencesTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.md,
  },
  preferencesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  preferenceTag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  preferenceTagText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  dailyContent: {
    paddingHorizontal: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.neutral[0],
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: 20,
    ...shadows.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.neutral[800],
  },
  summaryBadge: {
    backgroundColor: colors.success[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  summaryBadgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.success[700],
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing.lg,
  },
  mealsSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: spacing.lg,
  },
  mealCard: {
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mealTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  mealTime: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
  mealName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  mealMatchBadge: {
    backgroundColor: colors.warning[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  perfectMatch: {
    backgroundColor: colors.success[50],
  },
  mealMatchText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
    fontWeight: '600',
  },
  perfectMatchText: {
    color: colors.success[700],
  },
  mealStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  mealStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mealStatText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
  missingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  missingText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
    flex: 1,
  },
  snacksSection: {
    marginTop: spacing.xl,
  },
  snacksContainer: {
    paddingLeft: 0,
  },
  snackCard: {
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    borderRadius: 12,
    marginRight: spacing.md,
    minWidth: 160,
    alignItems: 'center',
    ...shadows.sm,
  },
  snackEmoji: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  snackName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  snackStats: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  quickActions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    borderRadius: 16,
    ...shadows.sm,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    flex: 1,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  comingSoonTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.neutral[600],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});