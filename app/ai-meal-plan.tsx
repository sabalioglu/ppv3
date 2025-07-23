// app/ai-meal-plan.tsx
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
  Info,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

// Meal database - Real recipes with ingredients
const MEAL_DATABASE = {
  breakfast: [
    {
      name: "Scrambled Eggs with Toast",
      ingredients: ["eggs", "butter", "bread", "salt", "pepper"],
      calories: 350,
      protein: 20,
      prepTime: 10,
      emoji: "🍳",
      category: "breakfast"
    },
    {
      name: "Oatmeal with Berries",
      ingredients: ["oats", "milk", "berries", "honey"],
      calories: 280,
      protein: 8,
      prepTime: 5,
      emoji: "🥣",
      category: "breakfast"
    },
    {
      name: "Yogurt Parfait",
      ingredients: ["yogurt", "granola", "honey", "berries"],
      calories: 320,
      protein: 15,
      prepTime: 5,
      emoji: "🥛",
      category: "breakfast"
    }
  ],
  lunch: [
    {
      name: "Chicken Salad",
      ingredients: ["chicken", "lettuce", "tomatoes", "cucumber", "olive oil", "lemon"],
      calories: 450,
      protein: 35,
      prepTime: 15,
      emoji: "🥗",
      category: "lunch"
    },
    {
      name: "Tuna Sandwich",
      ingredients: ["tuna", "bread", "mayonnaise", "lettuce", "tomatoes"],
      calories: 420,
      protein: 30,
      prepTime: 10,
      emoji: "🥪",
      category: "lunch"
    },
    {
      name: "Vegetable Stir Fry",
      ingredients: ["rice", "mixed vegetables", "soy sauce", "garlic", "ginger", "oil"],
      calories: 380,
      protein: 12,
      prepTime: 20,
      emoji: "🍜",
      category: "lunch"
    }
  ],
  dinner: [
    {
      name: "Grilled Chicken with Vegetables",
      ingredients: ["chicken", "broccoli", "carrots", "olive oil", "garlic", "herbs"],
      calories: 550,
      protein: 45,
      prepTime: 30,
      emoji: "🍗",
      category: "dinner"
    },
    {
      name: "Pasta Bolognese",
      ingredients: ["pasta", "ground beef", "tomato sauce", "onion", "garlic", "cheese"],
      calories: 650,
      protein: 35,
      prepTime: 25,
      emoji: "🍝",
      category: "dinner"
    },
    {
      name: "Salmon with Quinoa",
      ingredients: ["salmon", "quinoa", "asparagus", "lemon", "olive oil"],
      calories: 520,
      protein: 40,
      prepTime: 25,
      emoji: "🐟",
      category: "dinner"
    }
  ],
  snacks: [
    {
      name: "Apple with Peanut Butter",
      ingredients: ["apple", "peanut butter"],
      calories: 200,
      protein: 6,
      emoji: "🍎",
      category: "snack"
    },
    {
      name: "Greek Yogurt",
      ingredients: ["greek yogurt", "honey"],
      calories: 150,
      protein: 15,
      emoji: "🥛",
      category: "snack"
    },
    {
      name: "Mixed Nuts",
      ingredients: ["almonds", "walnuts", "cashews"],
      calories: 180,
      protein: 5,
      emoji: "🥜",
      category: "snack"
    }
  ]
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
  const [pantryInsights, setPantryInsights] = useState<any[]>([]);

  // Pantry health metrics
  const [pantryMetrics, setPantryMetrics] = useState({
    totalItems: 0,
    expiringItems: 0,
    expiredItems: 0,
    categories: {} as Record<string, number>,
  });

  // Pantry cache for performance
  const [pantryCache, setPantryCache] = useState<{
    data: any[],
    lastUpdated: Date,
    metrics: any
  }>({
    data: [],
    lastUpdated: new Date(),
    metrics: {}
  });

  useEffect(() => {
    loadAllData();
  }, []);

  // Real-time pantry updates listener
  useEffect(() => {
    const subscription = supabase
      .channel('pantry_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pantry_items' },
        (payload) => {
          console.log('Pantry updated:', payload);
          loadAllData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Cache refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - pantryCache.lastUpdated.getTime() > 5 * 60 * 1000) {
        loadAllData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [pantryCache.lastUpdated]);

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
      
      // Update cache
      setPantryCache({
        data: pantryItemsData,
        lastUpdated: new Date(),
        metrics: pantryMetrics
      });

      // Generate pantry insights
      const insights = generatePantryInsights(pantryItemsData);
      setPantryInsights(insights);

      // Generate meal plan based on pantry
      await generateMealPlan(pantryItemsData, profile);

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load meal plan data');
    }
  };

  const calculatePantryMetrics = (items: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let expiringCount = 0;
    let expiredCount = 0;
    const categoryCount: Record<string, number> = {};

    items.forEach(item => {
      // Category counting
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;

      // Expiry checking
      if (item.expiry_date) {
        const expiryDate = new Date(item.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);
        
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

  // Get items expiring soon
  const getExpiringItems = (items: any[]) => {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    return items.filter(item => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date);
      return expiryDate >= today && expiryDate <= threeDaysFromNow;
    });
  };

  // Calculate pantry match for a meal
  const calculatePantryMatch = (mealIngredients: string[], pantryItems: any[]) => {
    const pantryIngredientNames = pantryItems.map(item => 
      item.name.toLowerCase().trim()
    );
    
    let matchCount = 0;
    const missingIngredients: string[] = [];
    
    mealIngredients.forEach(ingredient => {
      const ingredientLower = ingredient.toLowerCase().trim();
      const found = pantryIngredientNames.some(pantryItem => 
        pantryItem.includes(ingredientLower) || 
        ingredientLower.includes(pantryItem) ||
        // Fuzzy matching for common variations
        (pantryItem.includes('chicken') && ingredientLower.includes('chicken')) ||
        (pantryItem.includes('beef') && ingredientLower.includes('beef')) ||
        (pantryItem.includes('milk') && ingredientLower.includes('milk'))
      );
      
      if (found) {
        matchCount++;
      } else {
        missingIngredients.push(ingredient);
      }
    });

    return {
      matchCount,
      totalIngredients: mealIngredients.length,
      matchPercentage: (matchCount / mealIngredients.length) * 100,
      missingIngredients
    };
  };

  // Find best meal match based on pantry
  const findBestMealMatch = (mealType: string, pantryItems: any[], userProfile: any) => {
    const meals = MEAL_DATABASE[mealType] || [];
    let bestMeal = null;
    let bestMatchScore = -1;

    meals.forEach(meal => {
      // Check dietary restrictions
      if (userProfile?.dietary_restrictions?.length > 0) {
        const hasRestriction = userProfile.dietary_restrictions.some((restriction: string) =>
          meal.ingredients.some((ingredient: string) => 
            ingredient.toLowerCase().includes(restriction.toLowerCase())
          )
        );
        if (hasRestriction) return;
      }

      const match = calculatePantryMatch(meal.ingredients, pantryItems);
      
      // Prioritize meals that use expiring items
      const expiringItems = getExpiringItems(pantryItems);
      let expiringBonus = 0;
      
      expiringItems.forEach(item => {
        if (meal.ingredients.some(ing => 
          item.name.toLowerCase().includes(ing.toLowerCase()) ||
          ing.toLowerCase().includes(item.name.toLowerCase())
        )) {
          expiringBonus += 20; // Bonus points for using expiring items
        }
      });

      const totalScore = match.matchPercentage + expiringBonus;

      if (totalScore > bestMatchScore) {
        bestMatchScore = totalScore;
        bestMeal = {
          ...meal,
          pantryMatch: match.matchCount,
          totalIngredients: match.totalIngredients,
          missingIngredients: match.missingIngredients,
          matchPercentage: match.matchPercentage,
          allergenSafe: true
        };
      }
    });

    return bestMeal;
  };

  // Generate meal plan based on pantry
  const generateMealPlan = async (pantryItems: any[], userProfile: any) => {
    try {
      // Find best matches for each meal
      const breakfast = findBestMealMatch('breakfast', pantryItems, userProfile);
      const lunch = findBestMealMatch('lunch', pantryItems, userProfile);
      const dinner = findBestMealMatch('dinner', pantryItems, userProfile);
      
      // Select snacks based on availability
      const snacks = MEAL_DATABASE.snacks
        .map(snack => {
          const match = calculatePantryMatch(snack.ingredients, pantryItems);
          return {
            ...snack,
            matchPercentage: match.matchPercentage,
            available: match.matchPercentage > 50
          };
        })
        .filter(snack => snack.available)
        .slice(0, 2);

      // Calculate totals
      const totalCalories = 
        (breakfast?.calories || 0) + 
        (lunch?.calories || 0) + 
        (dinner?.calories || 0) +
        snacks.reduce((sum, snack) => sum + snack.calories, 0);

      const totalProtein = 
        (breakfast?.protein || 0) + 
        (lunch?.protein || 0) + 
        (dinner?.protein || 0) +
        snacks.reduce((sum, snack) => sum + snack.protein, 0);

      const plan = {
        daily: {
          breakfast: breakfast || generateFallbackMeal('breakfast'),
          lunch: lunch || generateFallbackMeal('lunch'),
          dinner: dinner || generateFallbackMeal('dinner'),
          snacks: snacks.length > 0 ? snacks : generateFallbackSnacks(),
          totalCalories,
          totalProtein,
          optimizationScore: calculateOptimizationScore(breakfast, lunch, dinner, pantryItems)
        }
      };

      setMealPlan(plan);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      // Set fallback meal plan
      setMealPlan(generateFallbackPlan());
    }
  };

  // Calculate optimization score
  const calculateOptimizationScore = (breakfast: any, lunch: any, dinner: any, pantryItems: any[]) => {
    const meals = [breakfast, lunch, dinner].filter(Boolean);
    if (meals.length === 0) return 0;

    const avgMatchPercentage = meals.reduce((sum, meal) => 
      sum + (meal.matchPercentage || 0), 0
    ) / meals.length;

    const expiringItems = getExpiringItems(pantryItems);
    const expiringItemsUsed = expiringItems.filter(item =>
      meals.some(meal => 
        meal.ingredients.some((ing: string) =>
          item.name.toLowerCase().includes(ing.toLowerCase())
        )
      )
    ).length;

    const expiringUsageScore = expiringItems.length > 0 
      ? (expiringItemsUsed / expiringItems.length) * 100 
      : 100;

    return Math.round((avgMatchPercentage + expiringUsageScore) / 2);
  };

  // Generate pantry insights
  const generatePantryInsights = (pantryItems: any[]) => {
    const insights = [];
    
    // Expiring items warning
    if (pantryMetrics.expiringItems > 0) {
      const expiringItems = getExpiringItems(pantryItems);
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Items Expiring Soon',
        message: `${pantryMetrics.expiringItems} items expiring in the next 3 days`,
        items: expiringItems.map(item => item.name).slice(0, 3),
        action: 'Use these items first in your meals'
      });
    }
    
    // Category balance check
    const categories = Object.keys(pantryMetrics.categories);
    if (!categories.includes('Protein') || pantryMetrics.categories['Protein'] < 3) {
      insights.push({
        type: 'suggestion',
        icon: Info,
        title: 'Low on Protein',
        message: 'Consider adding more protein sources to your pantry',
        action: 'Add to shopping list'
      });
    }
    
    if (!categories.includes('Vegetables') || pantryMetrics.categories['Vegetables'] < 5) {
      insights.push({
        type: 'suggestion',
        icon: Info,
        title: 'Need More Vegetables',
        message: 'A variety of vegetables ensures balanced nutrition',
        action: 'Shop for vegetables'
      });
    }

    // Expired items alert
    if (pantryMetrics.expiredItems > 0) {
      insights.push({
        type: 'error',
        icon: AlertCircle,
        title: 'Expired Items Found',
        message: `${pantryMetrics.expiredItems} items have expired and should be removed`,
        action: 'Clean pantry'
      });
    }
    
    return insights;
  };

  // Fallback meal generators
  const generateFallbackMeal = (mealType: string) => {
    const fallbacks = {
      breakfast: {
        name: "Simple Toast and Eggs",
        calories: 300,
        protein: 15,
        pantryMatch: 0,
        totalIngredients: 3,
        missingIngredients: ["bread", "eggs", "butter"],
        allergenSafe: true,
        prepTime: 10,
        emoji: "🍞"
      },
      lunch: {
        name: "Basic Salad",
        calories: 350,
        protein: 10,
        pantryMatch: 0,
        totalIngredients: 5,
        missingIngredients: ["lettuce", "tomatoes", "cucumber", "dressing"],
        allergenSafe: true,
        prepTime: 10,
        emoji: "🥗"
      },
      dinner: {
        name: "Simple Pasta",
        calories: 500,
        protein: 15,
        pantryMatch: 0,
        totalIngredients: 4,
        missingIngredients: ["pasta", "tomato sauce", "cheese"],
        allergenSafe: true,
        prepTime: 20,
        emoji: "🍝"
      }
    };
    
    return fallbacks[mealType] || fallbacks.lunch;
  };

  const generateFallbackSnacks = () => {
    return [
      {
        name: "Fresh Fruit",
        calories: 80,
        protein: 1,
        emoji: "🍎"
      },
      {
        name: "Nuts",
        calories: 170,
        protein: 6,
        emoji: "🥜"
      }
    ];
  };

  const generateFallbackPlan = () => {
    return {
      daily: {
        breakfast: generateFallbackMeal('breakfast'),
        lunch: generateFallbackMeal('lunch'),
        dinner: generateFallbackMeal('dinner'),
        snacks: generateFallbackSnacks(),
        totalCalories: 1400,
        totalProtein: 60,
        optimizationScore: 0
      }
    };
  };

  // Add missing ingredients to shopping list
  const handleAddToShoppingList = async (missingIngredients: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Categorize ingredients
      const categorizeIngredient = (ingredient: string) => {
        const categories = {
          'Protein': ['chicken', 'beef', 'fish', 'eggs', 'tofu', 'beans'],
          'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
          'Grains': ['rice', 'pasta', 'bread', 'oats', 'quinoa'],
          'Vegetables': ['lettuce', 'tomato', 'cucumber', 'carrot', 'broccoli'],
          'Fruits': ['apple', 'banana', 'berries', 'orange', 'grapes'],
          'Condiments': ['oil', 'sauce', 'dressing', 'spices', 'herbs']
        };

        for (const [category, keywords] of Object.entries(categories)) {
          if (keywords.some(keyword => ingredient.toLowerCase().includes(keyword))) {
            return category;
          }
        }
        return 'Other';
      };

      const shoppingItems = missingIngredients.map(ingredient => ({
        user_id: user.id,
        name: ingredient,
        category: categorizeIngredient(ingredient),
        quantity: 1,
        unit: 'unit',
        is_checked: false,
        source: 'meal_plan',
        priority: 'high',
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('shopping_items')
        .insert(shoppingItems);

      if (error) throw error;

      Alert.alert(
        'Success',
        `Added ${missingIngredients.length} items to your shopping list`,
        [
          { text: 'View List', onPress: () => router.push('/(tabs)/shopping') },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      Alert.alert('Error', 'Failed to add items to shopping list');
    }
  };

  const handleMealPress = (meal: any) => {
    Alert.alert(
      meal.name,
      `${meal.calories} calories • ${meal.protein}g protein\n\nIngredients: ${meal.ingredients?.join(', ') || 'N/A'}\n\nPantry Match: ${meal.matchPercentage?.toFixed(0) || 0}%`,
      [
        { text: 'View Recipe', onPress: () => console.log('View recipe') },
        { text: 'Add to Today', onPress: () => console.log('Add to nutrition') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderDailyView = () => {
    if (!mealPlan?.daily) return null;
    const plan = mealPlan.daily;

    return (
      <View style={styles.dailyContent}>
        {/* Pantry Insights */}
        {pantryInsights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>Pantry Insights</Text>
            {pantryInsights.map((insight, index) => (
              <View key={index} style={[
                styles.insightCard,
                insight.type === 'warning' && styles.warningCard,
                insight.type === 'error' && styles.errorCard
              ]}>
                <insight.icon size={20} color={
                  insight.type === 'error' ? colors.error[600] :
                  insight.type === 'warning' ? colors.warning[600] :
                  colors.info
                } />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightMessage}>{insight.message}</Text>
                  {insight.items && (
                    <Text style={styles.insightItems}>
                      {insight.items.join(', ')}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Today's Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Today's Plan</Text>
            <View style={[
              styles.summaryBadge,
              plan.optimizationScore > 70 && styles.optimizedBadge,
              plan.optimizationScore < 40 && styles.lowMatchBadge
            ]}>
              <Text style={styles.summaryBadgeText}>
                {plan.optimizationScore > 70 ? 'Optimized' : 
                 plan.optimizationScore > 40 ? 'Good Match' : 
                 'Low Match'}
              </Text>
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

            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <ChefHat size={20} color={colors.accent[500]} />
              </View>
              <Text style={styles.statValue}>{plan.optimizationScore}%</Text>
              <Text style={styles.statLabel}>Match Score</Text>
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
              
              <View style={[
                styles.mealMatchBadge,
                plan.breakfast.matchPercentage > 80 && styles.perfectMatch,
                plan.breakfast.matchPercentage < 50 && styles.lowMatch
              ]}>
                <Text style={[
                  styles.mealMatchText,
                  plan.breakfast.matchPercentage > 80 && styles.perfectMatchText
                ]}>
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
              
              <View style={[
                styles.mealMatchBadge,
                plan.lunch.matchPercentage > 80 && styles.perfectMatch,
                plan.lunch.matchPercentage < 50 && styles.lowMatch
              ]}>
                <Text style={[
                  styles.mealMatchText,
                  plan.lunch.matchPercentage > 80 && styles.perfectMatchText
                ]}>
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
              
              <View style={[
                styles.mealMatchBadge,
                plan.dinner.matchPercentage > 80 && styles.perfectMatch,
                plan.dinner.matchPercentage < 50 && styles.lowMatch
              ]}>
                <Text style={[
                  styles.mealMatchText,
                  plan.dinner.matchPercentage > 80 && styles.perfectMatchText
                ]}>
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

            {plan.dinner.missingIngredients.length > 0 && (
              <TouchableOpacity 
                style={styles.missingAlert}
                onPress={() => handleAddToShoppingList(plan.dinner.missingIngredients)}
              >
                <AlertCircle size={16} color={colors.warning[600]} />
                <Text style={styles.missingText}>
                  Missing: {plan.dinner.missingIngredients.join(', ')}
                </Text>
                <Plus size={16} color={colors.warning[600]} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Snacks Section */}
        <View style={styles.snacksSection}>
          <Text style={styles.sectionTitle}>Snacks</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.snacksContainer}>
            {plan.snacks.map((snack: any, index: number) => (
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
  insightsSection: {
    marginTop: spacing.lg,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutral[0],
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  warningCard: {
    backgroundColor: colors.warning[50],
  },
  errorCard: {
    backgroundColor: colors.error[50],
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  insightMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
  insightItems: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontStyle: 'italic',
    marginTop: spacing.xs,
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
    backgroundColor: colors.warning[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  optimizedBadge: {
    backgroundColor: colors.success[50],
  },
  lowMatchBadge: {
    backgroundColor: colors.error[50],
  },
  summaryBadgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
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
  lowMatch: {
    backgroundColor: colors.error[50],
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
    marginHorizontal: spacing.lg,
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