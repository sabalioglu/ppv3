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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

      // Load user profile with preferences
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      // Load pantry items
      const { data: pantry } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true });

      setPantryItems(pantry || []);
      calculatePantryMetrics(pantry || []);

      // Load today's nutrition logs
      const today = new Date().toISOString().split('T')[0];
      const { data: logs } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today);

      setNutritionLogs(logs || []);

      // Generate meal plan
      if (profile && pantry) {
        await generateMealPlan(profile, pantry);
      }

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

  const generateMealPlan = async (profile: any, pantryItems: any[]) => {
    // TODO: Call AI API to generate meal plan based on:
    // - User profile (allergens, preferences, goals)
    // - Pantry items (available ingredients)
    // - Nutrition targets (TDEE, macros)
    // - Expiring items priority

    // Mock meal plan for now
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
        },
        snacks: [
          {
            name: "Greek Yogurt with Berries",
            calories: 200,
            protein: 15,
          },
          {
            name: "Energy Balls",
            calories: 150,
            protein: 5,
          }
        ],
        totalCalories: 2200,
        totalProtein: 130,
      }
    };

    setMealPlan(mockPlan);
  };

  const handleMealPress = (meal: any) => {
    // Navigate to recipe detail or show options
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
            // TODO: Add to shopping list
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
      <View>
        {/* Daily Summary */}
        <View style={styles.dailySummary}>
          <Text style={styles.summaryTitle}>Today's Plan</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{plan.totalCalories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{plan.totalProtein}g</Text>
              <Text style={styles.statLabel}>Protein</Text>
            </View>
          </View>
        </View>

        {/* Meals */}
        <View style={styles.mealsContainer}>
          {/* Breakfast */}
          <TouchableOpacity 
            style={styles.mealCard}
            onPress={() => handleMealPress(plan.breakfast)}
          >
            <View style={styles.mealHeader}>
              <View>
                <Text style={styles.mealTime}>🌅 Breakfast</Text>
                <Text style={styles.mealName}>{plan.breakfast.name}</Text>
              </View>
              <View style={styles.mealBadge}>
                <Text style={styles.mealBadgeText}>
                  {plan.breakfast.pantryMatch}/{plan.breakfast.totalIngredients}
                </Text>
              </View>
            </View>
            
            <View style={styles.mealInfo}>
              <Text style={styles.mealStats}>
                {plan.breakfast.calories} cal • {plan.breakfast.protein}g protein • {plan.breakfast.prepTime} min
              </Text>
              
              {plan.breakfast.missingIngredients.length > 0 && (
                <TouchableOpacity 
                  style={styles.missingAlert}
                  onPress={() => handleAddToShoppingList(plan.breakfast.missingIngredients)}
                >
                  <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                  <Text style={styles.missingText}>
                    Missing: {plan.breakfast.missingIngredients.join(', ')}
                  </Text>
                  <Ionicons name="add-circle-outline" size={16} color="#F59E0B" />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>

          {/* Similar cards for Lunch and Dinner */}
        </View>

        {/* Snacks */}
        <View style={styles.snacksSection}>
          <Text style={styles.snacksTitle}>Snacks</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {plan.snacks.map((snack, index) => (
              <View key={index} style={styles.snackCard}>
                <Text style={styles.snackName}>{snack.name}</Text>
                <Text style={styles.snackStats}>
                  {snack.calories} cal • {snack.protein}g
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
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Creating your personalized meal plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Meal Plan</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color="#1a1a1a" />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadAllData}
          />
        }
      >
        {/* Pantry Status */}
        <TouchableOpacity 
          style={styles.pantryStatus}
          onPress={() => router.push('/(tabs)/pantry')}
        >
          <View style={styles.pantryStatusLeft}>
            <Text style={styles.pantryStatusTitle}>Pantry Status</Text>
            <Text style={styles.pantryStatusSubtitle}>
              {pantryMetrics.totalItems} items • {pantryMetrics.expiringItems} expiring soon
            </Text>
          </View>
          <View style={styles.pantryStatusRight}>
            {pantryMetrics.expiredItems > 0 && (
              <View style={styles.expiredBadge}>
                <Text style={styles.expiredBadgeText}>{pantryMetrics.expiredItems} expired</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
        </TouchableOpacity>

        {/* Allergen Info */}
        {userProfile?.dietary_restrictions?.length > 0 && (
          <View style={styles.allergenInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.allergenText}>
              All recipes are free from: {userProfile.dietary_restrictions.join(', ')}
            </Text>
          </View>
        )}

        {/* Preferences Summary */}
        <View style={styles.preferencesInfo}>
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
          <Text style={styles.comingSoon}>Weekly view coming soon...</Text>
        )}
        {viewMode === 'monthly' && (
          <Text style={styles.comingSoon}>Monthly view coming soon...</Text>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/nutrition')}
          >
            <Ionicons name="nutrition" size={20} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Track Nutrition</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/shopping')}
          >
            <Ionicons name="cart" size={20} color="#2196F3" />
            <Text style={styles.actionButtonText}>Shopping List</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... style kodları eklenecek
});
