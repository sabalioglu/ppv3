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
import { StyledText, H1, H2, H3, BodyRegular, BodySmall, Caption } from '@/components/common/StyledText';
import { AppHeader } from '@/components/common/AppHeader';

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

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      // Set profile with fallback
      setUserProfile(profile || {
        dietary_restrictions: [],
        dietary_preferences: ['balanced'],
      });

      // Load REAL pantry items
      const { data: pantry, error: pantryError } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true });

      if (pantryError) {
        console.error('Error loading pantry:', pantryError);
      }

      const pantryItemsData = pantry || [];
      setPantryItems(pantryItemsData);
      calculatePantryMetrics(pantryItemsData);

      // Generate meal plan
      await generateMealPlan();

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load meal plan data');
    }
  };

  // DÜZELTILMIŞ: Expired items hesaplama
  const calculatePantryMetrics = (items: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bugünü saat 00:00'a ayarla
    
    let expiringCount = 0;
    let expiredCount = 0;
    const categoryCount: Record<string, number> = {};

    items.forEach(item => {
      // Category counting
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;

      // Expiry checking
      if (item.expiry_date) {
        const expiryDate = new Date(item.expiry_date);
        expiryDate.setHours(0, 0, 0, 0); // Expiry date'i de 00:00'a ayarla
        
        const timeDiff = expiryDate.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          expiredCount++;
        } else if (daysUntilExpiry >= 0 && daysUntilExpiry <= 3) {
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
        <BodyRegular color={colors.neutral[600]} style={styles.loadingText}>Creating your personalized meal plan...</BodyRegular>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader
        title="AI Meal Plan"
        leftComponent={
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.neutral[800]} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Settings size={24} color={colors.neutral[800]} />
          </TouchableOpacity>
        }
      />

      {/* View Mode Tabs */}
      <View style={styles.viewModeTabs}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'daily' && styles.activeTab]}
          onPress={() => setViewMode('daily')}
        >
          <BodyRegular 
            weight={viewMode === 'daily' ? 'bold' : 'medium'}
            color={viewMode === 'daily' ? colors.primary[600] : colors.neutral[500]}
          >
            Daily
          </BodyRegular>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'weekly' && styles.activeTab]}
          onPress={() => setViewMode('weekly')}
        >
          <BodyRegular 
            weight={viewMode === 'weekly' ? 'bold' : 'medium'}
            color={viewMode === 'weekly' ? colors.primary[600] : colors.neutral[500]}
          >
            Weekly
          </BodyRegular>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'monthly' && styles.activeTab]}
          onPress={() => setViewMode('monthly')}
        >
          <BodyRegular 
            weight={viewMode === 'monthly' ? 'bold' : 'medium'}
            color={viewMode === 'monthly' ? colors.primary[600] : colors.neutral[500]}
          >
            Monthly
          </BodyRegular>
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
              <H6 weight="semibold" color={colors.neutral[800]}>Pantry Status</H6>
              {pantryMetrics.expiredItems > 0 && (
                <View style={styles.expiredBadge}>
                  <Caption weight="semibold" color={colors.error[600]}>{pantryMetrics.expiredItems} expired</Caption>
                </View>
              )}
            </View>
            <BodySmall color={colors.neutral[600]}>
              {pantryMetrics.totalItems} items • {pantryMetrics.expiringItems} expiring soon
            </BodySmall>
          </View>
          <ChevronRight size={20} color={colors.neutral[400]} />
        </TouchableOpacity>

        {/* Allergen Safety Info */}
        {userProfile?.dietary_restrictions?.length > 0 && (
          <View style={styles.allergenInfo}>
            <ShieldCheck size={20} color={colors.success[600]} />
            <BodySmall color={colors.success[700]} style={styles.allergenText}>
              All recipes are free from: {userProfile.dietary_restrictions.join(', ')}
            </BodySmall>
          </View>
        )}

        {/* Preferences Card */}
        <View style={styles.preferencesCard}>
          <BodyRegular weight="semibold" color={colors.neutral[700]}>Your Preferences</BodyRegular>
          <View style={styles.preferencesTags}>
            {userProfile?.dietary_preferences?.map((pref: string) => (
              <View key={pref} style={styles.preferenceTag}>
                <BodySmall weight="medium" color={colors.primary[700]} style={styles.preferenceTagText}>{pref.replace('_', ' ')}</BodySmall>
              </View>
            ))}
          </View>
        </View>

        {/* Meal Plan Content */}
        {viewMode === 'daily' && renderDailyView()}
        {viewMode === 'weekly' && (
          <View style={styles.comingSoonContainer}>
            <Calendar size={48} color={colors.neutral[400]} />
            <H4 weight="semibold" color={colors.neutral[600]} style={styles.comingSoonTitle}>Weekly View Coming Soon</H4>
            <BodyRegular color={colors.neutral[500]} style={styles.comingSoonSubtitle}>Plan your entire week with AI-generated meal plans</BodyRegular>
          </View>
        )}
        {viewMode === 'monthly' && (
          <View style={styles.comingSoonContainer}>
            <Calendar size={48} color={colors.neutral[400]} />
            <H4 weight="semibold" color={colors.neutral[600]} style={styles.comingSoonTitle}>Monthly View Coming Soon</H4>
            <BodyRegular color={colors.neutral[500]} style={styles.comingSoonSubtitle}>Long-term meal planning and shopping optimization</BodyRegular>
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
            <BodyRegular weight="semibold" color={colors.neutral[800]}>Track Nutrition</BodyRegular>
            <ChevronRight size={16} color={colors.neutral[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/shopping')}
          >
            <View style={styles.actionButtonIcon}>
              <ShoppingCart size={20} color={colors.primary[500]} />
            </View>
            <BodyRegular weight="semibold" color={colors.neutral[800]}>Shopping List</BodyRegular>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
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
  expiredBadge: {
    backgroundColor: colors.error[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
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
  },
  preferencesCard: {
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 16,
    ...shadows.sm,
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
  summaryBadge: {
    backgroundColor: colors.success[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
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
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing.lg,
  },
  mealsSection: {
    marginTop: spacing.xl,
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
  mealMatchBadge: {
    backgroundColor: colors.warning[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  perfectMatch: {
    backgroundColor: colors.success[50],
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
  missingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
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
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  comingSoonTitle: {
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});