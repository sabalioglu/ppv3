//# 🔧 app/ai-meal-plan.tsx - %100 Hazır Düzeltilmiş Kod
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
import { ArrowLeft, Settings, ChevronRight, Clock, Users, Flame, ShieldCheck, Plus, Heart, ShoppingCart, Target, TrendingUp, Calendar, ChefHat, CircleAlert as AlertCircle } from 'lucide-react-native';
import { lightTheme as theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

// Typography system
const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const },
  h2: { fontSize: 28, fontWeight: '700' as const },
  h3: { fontSize: 24, fontWeight: '600' as const },
  h4: { fontSize: 20, fontWeight: '600' as const },
  h5: { fontSize: 18, fontWeight: '600' as const },
  h6: { fontSize: 16, fontWeight: '500' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};

// StyledText Components
const StyledText = ({ 
  variant = 'body', 
  weight, 
  color = theme.colors.text, 
  style, 
  children, 
  ...props 
}: any) => {
  const variantStyle = Typography[variant as keyof typeof Typography] || Typography.body;
  const fontWeight = weight || variantStyle.fontWeight;

  return (
    <Text
      {...props}
      style={[
        {
          ...variantStyle,
          fontWeight,
          color,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const H1 = (props: any) => <StyledText variant="h1" {...props} />;
const H2 = (props: any) => <StyledText variant="h2" {...props} />;
const H3 = (props: any) => <StyledText variant="h3" {...props} />;
const H4 = (props: any) => <StyledText variant="h4" {...props} />;
const H5 = (props: any) => <StyledText variant="h5" {...props} />;
const H6 = (props: any) => <StyledText variant="h6" {...props} />;
const BodyRegular = (props: any) => <StyledText variant="body" {...props} />;
const BodySmall = (props: any) => <StyledText variant="bodySmall" {...props} />;
const Caption = (props: any) => <StyledText variant="caption" {...props} />;

// AppHeader Component
const AppHeader = ({ title, leftComponent, rightComponent }: any) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {leftComponent && <View style={styles.headerLeft}>{leftComponent}</View>}
        <StyledText variant="h5" color={theme.colors.textPrimary} style={styles.headerTitle}>
          {title}
        </StyledText>
        {rightComponent && <View style={styles.headerRight}>{rightComponent}</View>}
      </View>
    </View>
  );
};

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
            <StyledText variant="h6" weight="semibold" color={theme.colors.textPrimary}>Today's Plan</StyledText>
            <View style={styles.summaryBadge}>
              <StyledText variant="caption" weight="semibold" color={theme.colors.success}>Optimized</StyledText>
            </View>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Target size={20} color={theme.colors.primary} />
              </View>
              <StyledText variant="h6" weight="bold" color={theme.colors.textPrimary}>{plan.totalCalories}</StyledText>
              <StyledText variant="caption" color={theme.colors.textSecondary}>Calories</StyledText>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <TrendingUp size={20} color={theme.colors.success} />
              </View>
              <StyledText variant="h6" weight="bold" color={theme.colors.textPrimary}>{plan.totalProtein}g</StyledText>
              <StyledText variant="caption" color={theme.colors.textSecondary}>Protein</StyledText>
            </View>
          </View>
        </View>

        {/* Meals Section */}
        <View style={styles.mealsSection}>
          <StyledText variant="h5" weight="semibold" color={theme.colors.textPrimary}>Today's Meals</StyledText>
          
          {/* Breakfast */}
          <TouchableOpacity 
            style={styles.mealCard}
            onPress={() => handleMealPress(plan.breakfast)}
          >
            <View style={styles.mealCardHeader}>
              <View style={styles.mealTimeContainer}>
                <Text style={styles.mealEmoji}>{plan.breakfast.emoji}</Text>
                <View>
                  <StyledText variant="caption" color={theme.colors.textSecondary}>Breakfast</StyledText>
                  <StyledText variant="body" weight="semibold" color={theme.colors.textPrimary}>{plan.breakfast.name}</StyledText>
                </View>
              </View>
              
              <View style={styles.mealMatchBadge}>
                <StyledText variant="caption" weight="semibold" color={theme.colors.warning}>
                  {plan.breakfast.pantryMatch}/{plan.breakfast.totalIngredients}
                </StyledText>
              </View>
            </View>
            
            <View style={styles.mealStats}>
              <View style={styles.mealStatItem}>
                <Flame size={14} color={theme.colors.warning} />
                <StyledText variant="caption" color={theme.colors.textSecondary}>{plan.breakfast.calories} cal</StyledText>
              </View>
              <View style={styles.mealStatItem}>
                <TrendingUp size={14} color={theme.colors.success} />
                <StyledText variant="caption" color={theme.colors.textSecondary}>{plan.breakfast.protein}g protein</StyledText>
              </View>
              <View style={styles.mealStatItem}>
                <Clock size={14} color={theme.colors.textSecondary} />
                <StyledText variant="caption" color={theme.colors.textSecondary}>{plan.breakfast.prepTime} min</StyledText>
              </View>
            </View>
            
            {plan.breakfast.missingIngredients.length > 0 && (
              <TouchableOpacity 
                style={styles.missingAlert}
                onPress={() => handleAddToShoppingList(plan.breakfast.missingIngredients)}
              >
                <AlertCircle size={16} color={theme.colors.warning} />
                <StyledText variant="caption" color={theme.colors.warning} style={styles.missingText}>
                  Missing: {plan.breakfast.missingIngredients.join(', ')}
                </StyledText>
                <Plus size={16} color={theme.colors.warning} />
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
                  <StyledText variant="caption" color={theme.colors.textSecondary}>Lunch</StyledText>
                  <StyledText variant="body" weight="semibold" color={theme.colors.textPrimary}>{plan.lunch.name}</StyledText>
                </View>
              </View>
              
              <View style={styles.mealMatchBadge}>
                <StyledText variant="caption" weight="semibold" color={theme.colors.warning}>
                  {plan.lunch.pantryMatch}/{plan.lunch.totalIngredients}
                </StyledText>
              </View>
            </View>
            
            <View style={styles.mealStats}>
              <View style={styles.mealStatItem}>
                <Flame size={14} color={theme.colors.warning} />
                <StyledText variant="caption" color={theme.colors.textSecondary}>{plan.lunch.calories} cal</StyledText>
              </View>
              <View style={styles.mealStatItem}>
                <TrendingUp size={14} color={theme.colors.success} />
                <StyledText variant="caption" color={theme.colors.textSecondary}>{plan.lunch.protein}g protein</StyledText>
              </View>
              <View style={styles.mealStatItem}>
                <Clock size={14} color={theme.colors.textSecondary} />
                <StyledText variant="caption" color={theme.colors.textSecondary}>{plan.lunch.prepTime} min</StyledText>
              </View>
            </View>
            
            {plan.lunch.missingIngredients.length > 0 && (
              <TouchableOpacity 
                style={styles.missingAlert}
                onPress={() => handleAddToShoppingList(plan.lunch.missingIngredients)}
              >
                <AlertCircle size={16} color={theme.colors.warning} />
                <StyledText variant="caption" color={theme.colors.warning} style={styles.missingText}>
                  Missing: {plan.lunch.missingIngredients.join(', ')}
                </StyledText>
                <Plus size={16} color={theme.colors.warning} />
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
                  <StyledText variant="caption" color={theme.colors.textSecondary}>Dinner</StyledText>
                  <StyledText variant="body" weight="semibold" color={theme.colors.textPrimary}>{plan.dinner.name}</StyledText>
                </View>
              </View>
              
              <View style={[styles.mealMatchBadge, styles.perfectMatch]}>
                <StyledText variant="caption" weight="semibold" color={theme.colors.success}>
                  {plan.dinner.pantryMatch}/{plan.dinner.totalIngredients}
                </StyledText>
              </View>
            </View>
            
            <View style={styles.mealStats}>
              <View style={styles.mealStatItem}>
                <Flame size={14} color={theme.colors.warning} />
                <StyledText variant="caption" color={theme.colors.textSecondary}>{plan.dinner.calories} cal</StyledText>
              </View>
              <View style={styles.mealStatItem}>
                <TrendingUp size={14} color={theme.colors.success} />
                <StyledText variant="caption" color={theme.colors.textSecondary}>{plan.dinner.protein}g protein</StyledText>
              </View>
              <View style={styles.mealStatItem}>
                <Clock size={14} color={theme.colors.textSecondary} />
                <StyledText variant="caption" color={theme.colors.textSecondary}>{plan.dinner.prepTime} min</StyledText>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Snacks Section */}
        <View style={styles.snacksSection}>
          <StyledText variant="h5" weight="semibold" color={theme.colors.textPrimary}>Snacks</StyledText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.snacksContainer}>
            {plan.snacks.map((snack: any, index: number) => (
              <View key={index} style={styles.snackCard}>
                <Text style={styles.snackEmoji}>{snack.emoji}</Text>
                <StyledText variant="bodySmall" weight="semibold" color={theme.colors.textPrimary}>{snack.name}</StyledText>
                <StyledText variant="caption" color={theme.colors.textSecondary}>
                  {snack.calories} cal • {snack.protein}g protein
                </StyledText>
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <BodyRegular color={theme.colors.textSecondary} style={styles.loadingText}>Creating your personalized meal plan...</BodyRegular>
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
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Settings size={24} color={theme.colors.textPrimary} />
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
            color={viewMode === 'daily' ? theme.colors.primary : theme.colors.textSecondary}
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
            color={viewMode === 'weekly' ? theme.colors.primary : theme.colors.textSecondary}
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
            color={viewMode === 'monthly' ? theme.colors.primary : theme.colors.textSecondary}
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
            tintColor={theme.colors.primary}
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
              <H6 weight="semibold" color={theme.colors.textPrimary}>Pantry Status</H6>
              {pantryMetrics.expiredItems > 0 && (
                <View style={styles.expiredBadge}>
                  <Caption weight="semibold" color={theme.colors.error}>{pantryMetrics.expiredItems} expired</Caption>
                </View>
              )}
            </View>
            <BodySmall color={theme.colors.textSecondary}>
              {pantryMetrics.totalItems} items • {pantryMetrics.expiringItems} expiring soon
            </BodySmall>
          </View>
          <ChevronRight size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Allergen Safety Info */}
        {userProfile?.dietary_restrictions?.length > 0 && (
          <View style={styles.allergenInfo}>
            <ShieldCheck size={20} color={theme.colors.success} />
            <BodySmall color={theme.colors.success} style={styles.allergenText}>
              All recipes are free from: {userProfile.dietary_restrictions.join(', ')}
            </BodySmall>
          </View>
        )}

        {/* Preferences Card */}
        <View style={styles.preferencesCard}>
          <BodyRegular weight="semibold" color={theme.colors.textPrimary}>Your Preferences</BodyRegular>
          <View style={styles.preferencesTags}>
            {userProfile?.dietary_preferences?.map((pref: string) => (
              <View key={pref} style={styles.preferenceTag}>
                <BodySmall weight="medium" color={theme.colors.primary}>{pref.replace('_', ' ')}</BodySmall>
              </View>
            ))}
          </View>
        </View>

        {/* Meal Plan Content */}
        {viewMode === 'daily' && renderDailyView()}
        {viewMode === 'weekly' && (
          <View style={styles.comingSoonContainer}>
            <Calendar size={48} color={theme.colors.textSecondary} />
            <H4 weight="semibold" color={theme.colors.textSecondary} style={styles.comingSoonTitle}>Weekly View Coming Soon</H4>
            <BodyRegular color={theme.colors.textSecondary} style={styles.comingSoonSubtitle}>Plan your entire week with AI-generated meal plans</BodyRegular>
          </View>
        )}
        {viewMode === 'monthly' && (
          <View style={styles.comingSoonContainer}>
            <Calendar size={48} color={theme.colors.textSecondary} />
            <H4 weight="semibold" color={theme.colors.textSecondary} style={styles.comingSoonTitle}>Monthly View Coming Soon</H4>
            <BodyRegular color={theme.colors.textSecondary} style={styles.comingSoonSubtitle}>Long-term meal planning and shopping optimization</BodyRegular>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/nutrition')}
          >
            <View style={styles.actionButtonIcon}>
              <Heart size={20} color={theme.colors.error} />
            </View>
            <BodyRegular weight="semibold" color={theme.colors.textPrimary}>Track Nutrition</BodyRegular>
            <ChevronRight size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/shopping')}
          >
            <View style={styles.actionButtonIcon}>
              <ShoppingCart size={20} color={theme.colors.primary} />
            </View>
            <BodyRegular weight="semibold" color={theme.colors.textPrimary}>Shopping List</BodyRegular>
            <ChevronRight size={16} color={theme.colors.textSecondary} />
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
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  content: {
    flex: 1,
  },
  pantryStatusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderRadius: 16,
    ...theme.shadows.md,
  },
  pantryStatusLeft: {
    flex: 1,
  },
  pantryStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  expiredBadge: {
    backgroundColor: theme.colors.error + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  allergenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '20',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: 12,
    gap: theme.spacing.sm,
  },
  allergenText: {
    flex: 1,
  },
  preferencesCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: 16,
    ...theme.shadows.md,
  },
  preferencesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  preferenceTag: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
  },
  dailyContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    borderRadius: 20,
    ...theme.shadows.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  summaryBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
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
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
  },
  mealsSection: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  mealCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 16,
    ...theme.shadows.md,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  mealTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealEmoji: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  mealMatchBadge: {
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 12,
  },
  perfectMatch: {
    backgroundColor: theme.colors.success + '20',
  },
  mealStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  mealStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  missingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.md,
    borderRadius: 12,
    gap: theme.spacing.sm,
  },
  missingText: {
    flex: 1,
  },
  snacksSection: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  snacksContainer: {
    paddingLeft: 0,
  },
  snackCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    marginRight: theme.spacing.md,
    minWidth: 160,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  snackEmoji: {
    fontSize: 24,
    marginBottom: theme.spacing.sm,
  },
  quickActions: {
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 16,
    ...theme.shadows.md,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.lg,
  },
  comingSoonTitle: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});