import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Target,
  Trendinimport { Target, TrendingUp, Calendar, Plus, Droplets, Clock, Award, Camera, X, Trash2, CircleHelp as HelpCircle } from 'lucide-react-native' shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

// **BMR/TDEE Calculation Functions (Adapted from Dashboard)**
const calculateBMR = (age: number, gender: string, height: number, weight: number): number => {
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
};

const getActivityMultiplier = (activityLevel: string): number => {
  const multipliers: { [key: string]: number } = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'moderately_active': 1.55,
    'very_active': 1.725,
    'extra_active': 1.9,
  };
  return multipliers[activityLevel] || 1.55;
};

const calculateDailyCalories = (bmr: number, activityLevel: string): number => {
  return Math.round(bmr * getActivityMultiplier(activityLevel));
};

const calculateMacros = (calories: number, goals: string[]) => {
  let proteinRatio = 0.25;
  let carbRatio = 0.45;
  let fatRatio = 0.30;

  if (goals.includes('muscle_gain')) {
    proteinRatio = 0.30;
    carbRatio = 0.40;
    fatRatio = 0.30;
  } else if (goals.includes('weight_loss')) {
    proteinRatio = 0.30;
    carbRatio = 0.35;
    fatRatio = 0.35;
  }

  return {
    protein: Math.round((calories * proteinRatio) / 4),
    carbs: Math.round((calories * carbRatio) / 4),
    fat: Math.round((calories * fatRatio) / 9),
  };
};

// **Enhanced Progress Bar Component (Instead of CircularProgress)**
interface ProgressBarProps {
  percentage: number;
  color: string;
  size?: 'small' | 'large';
  children?: React.ReactNode;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, color, size = 'large', children }) => {
  const isLarge = size === 'large';
  const containerSize = isLarge ? 120 : 80;
  
  return (
    <View style={{ 
      width: containerSize, 
      height: containerSize, 
      justifyContent: 'center', 
      alignItems: 'center',
      position: 'relative' 
    }}>
      <View style={{
        width: containerSize - 20,
        height: containerSize - 20,
        borderRadius: (containerSize - 20) / 2,
        borderWidth: 8,
        borderColor: `${color}20`,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}>
        <View style={{
          position: 'absolute',
          top: -8,
          left: -8,
          width: containerSize - 4,
          height: containerSize - 4,
          borderRadius: (containerSize - 4) / 2,
          borderWidth: 8,
          borderColor: 'transparent',
          borderTopColor: color,
          transform: [{ rotate: `${(percentage * 3.6) - 90}deg` }],
        }} />
        {children}
      </View>
    </View>
  );
};

interface MacroCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  percentage: number;
}

const MacroCard: React.FC<MacroCardProps> = ({
  title,
  current,
  target,
  unit,
  color,
  percentage,
}) => {
  return (
    <View style={styles.macroCard}>
      <ProgressBar percentage={percentage} color={color} size="small">
        <Text style={styles.macroPercentage}>{percentage}%</Text>
      </ProgressBar>
      <View style={styles.macroInfo}>
        <Text style={styles.macroTitle}>{title}</Text>
        <Text style={styles.macroValues}>
          {Math.round(current)} / {target} {unit}
        </Text>
        <View style={styles.macroProgressBar}>
          <View
            style={[
              styles.macroProgressFill,
              { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }
            ]}
          />
        </View>
      </View>
    </View>
  );
};

interface MealCardProps {
  meal: {
    id: string;
    meal_type: string;
    time: string;
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  onPress: () => void;
}

const MealCard: React.FC<MealCardProps> = ({ meal, onPress }) => {
  return (
    <TouchableOpacity style={styles.mealCard} onPress={onPress}>
      <View style={styles.mealHeader}>
        <View>
          <Text style={styles.mealType}>
            {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
          </Text>
          <Text style={styles.mealTime}>{meal.time}</Text>
        </View>
        <View style={styles.mealCalories}>
          <Text style={styles.mealCaloriesText}>{Math.round(meal.calories)}</Text>
          <Text style={styles.mealCaloriesLabel}>kcal</Text>
        </View>
      </View>
      <Text style={styles.mealName}>{meal.food_name}</Text>
      <View style={styles.mealMacros}>
        <View style={styles.mealMacro}>
          <Text style={styles.mealMacroValue}>{Math.round(meal.protein)}g</Text>
          <Text style={styles.mealMacroLabel}>Protein</Text>
        </View>
        <View style={styles.mealMacro}>
          <Text style={styles.mealMacroValue}>{Math.round(meal.carbs)}g</Text>
          <Text style={styles.mealMacroLabel}>Carbs</Text>
        </View>
        <View style={styles.mealMacro}>
          <Text style={styles.mealMacroValue}>{Math.round(meal.fat)}g</Text>
          <Text style={styles.mealMacroLabel}>Fat</Text>
        </View>
        <View style={styles.mealMacro}>
          <Text style={styles.mealMacroValue}>{Math.round(meal.fiber)}g</Text>
          <Text style={styles.mealMacroLabel}>Fiber</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function Nutrition() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // **Real nutrition data states**
  const [todaysNutrition, setTodaysNutrition] = useState({
    calories: { current: 0, target: 2000, percentage: 0 },
    protein: { current: 0, target: 120, percentage: 0 },
    carbs: { current: 0, target: 250, percentage: 0 },
    fat: { current: 0, target: 67, percentage: 0 },
    fiber: { current: 0, target: 25, percentage: 0 },
    water: { current: 0, target: 2000, percentage: 0 },
  });
  
  const [meals, setMeals] = useState<any[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [quickAddCalories, setQuickAddCalories] = useState('');

  // **Helper function: Format date to YYYY-MM-DD**
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // **Helper function: Format time from ISO string**
  const formatTime = (isoString: string): string => {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // **Main data loading function**
  const loadNutritionData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Please log in');
        return;
      }

      // **Load user profile for targets**
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile loading error:', profileError);
        Alert.alert('Error', 'Failed to load user profile');
        return;
      }

      setUserProfile(profile);

      // **Calculate user's nutrition targets**
      let nutritionTargets = {
        calories: 2000,
        protein: 120,
        carbs: 250,
        fat: 67,
      };

      if (profile.age && profile.gender && profile.height_cm && profile.weight_kg && profile.activity_level) {
        const bmr = calculateBMR(profile.age, profile.gender, profile.height_cm, profile.weight_kg);
        const dailyCalories = calculateDailyCalories(bmr, profile.activity_level);
        const macros = calculateMacros(dailyCalories, profile.health_goals || []);

        nutritionTargets = {
          calories: dailyCalories,
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
        };
      }

      // **Load today's nutrition data**
      await loadTodaysNutrition(user.id, nutritionTargets);
      
      // **Load meals and weekly progress**
      await Promise.all([
        loadTodaysMeals(user.id),
        loadWeeklyProgress(user.id, nutritionTargets.calories)
      ]);

      // **Generate insights**
      generateInsights(nutritionTargets);

    } catch (error) {
      console.error('Error loading nutrition data:', error);
      Alert.alert('Error', 'Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
  };

  // **Load today's nutrition totals**
  const loadTodaysNutrition = async (userId: string, targets: any) => {
    const today = formatDate(selectedDate);
    
    const { data: nutritionLogs, error } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);

    if (error) {
      console.error('Error loading nutrition logs:', error);
      return;
    }

    // **Calculate totals**
    const totals = nutritionLogs?.reduce((acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fat: acc.fat + (log.fat || 0),
      fiber: acc.fiber + (log.fiber || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }) || 
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

    // **Calculate water intake (assuming water logs have meal_type: 'water')**
    const waterLogs = nutritionLogs?.filter(log => log.meal_type === 'water') || [];
    const totalWater = waterLogs.reduce((sum, log) => sum + (log.quantity || 0), 0);

    // **Calculate percentages**
    const calculatePercentage = (current: number, target: number) => 
      target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

    const nutritionData = {
      calories: {
        current: totals.calories,
        target: targets.calories,
        percentage: calculatePercentage(totals.calories, targets.calories)
      },
      protein: {
        current: totals.protein,
        target: targets.protein,
        percentage: calculatePercentage(totals.protein, targets.protein)
      },
      carbs: {
        current: totals.carbs,
        target: targets.carbs,
        percentage: calculatePercentage(totals.carbs, targets.carbs)
      },
      fat: {
        current: totals.fat,
        target: targets.fat,
        percentage: calculatePercentage(totals.fat, targets.fat)
      },
      fiber: {
        current: totals.fiber,
        target: 25,
        percentage: calculatePercentage(totals.fiber, 25)
      },
      water: {
        current: totalWater,
        target: 2000,
        percentage: calculatePercentage(totalWater, 2000)
      }
    };

    setTodaysNutrition(nutritionData);
    setWaterIntake(totalWater);
  };

  // **Load today's meals**
  const loadTodaysMeals = async (userId: string) => {
    const today = formatDate(selectedDate);
    
    const { data: nutritionLogs, error } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .neq('meal_type', 'water')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading meals:', error);
      return;
    }

    // **Format meals for display**
    const formattedMeals = nutritionLogs?.map(log => ({
      id: log.id,
      meal_type: log.meal_type,
      time: formatTime(log.created_at),
      food_name: log.food_name,
      calories: log.calories || 0,
      protein: log.protein || 0,
      carbs: log.carbs || 0,
      fat: log.fat || 0,
      fiber: log.fiber || 0,
    })) || [];

    setMeals(formattedMeals);
  };

  // **Load weekly progress (optimized)**
  const loadWeeklyProgress = async (userId: string, targetCalories: number) => {
    const today = new Date();
    const weekDays = [];
    
    // **Generate last 7 days**
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      weekDays.push(formatDate(date));
    }

    // **Single query for all week data**
    const { data: weeklyLogs, error } = await supabase
      .from('nutrition_logs')
      .select('date, calories')
      .eq('user_id', userId)
      .in('date', weekDays)
      .neq('meal_type', 'water');

    if (error) {
      console.error('Error loading weekly progress:', error);
      return;
    }

    // **Calculate daily totals**
    const dailyTotals: { [key: string]: number } = {};
    weeklyLogs?.forEach(log => {
      if (!dailyTotals[log.date]) {
        dailyTotals[log.date] = 0;
      }
      dailyTotals[log.date] += log.calories || 0;
    });

    // **Format for chart**
    const chartData = weekDays.map((date, index) => {
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayName = index === 6 ? 'Today' : dayNames[new Date(date).getDay()];
      
      return {
        day: dayName,
        calories: Math.round(dailyTotals[date] || 0),
        target: targetCalories,
      };
    });

    setWeeklyProgress(chartData);
  };

  // **Generate smart insights**
  const generateInsights = (targets: any) => {
    const insights = [];
    const { calories, protein, fiber } = todaysNutrition;

    if (protein.percentage >= 80) {
      insights.push({
        type: 'success',
        title: 'Great Protein Intake! 💪',
        message: 'You\'re doing excellent with your protein goals for muscle building!',
      });
    } else if (protein.percentage < 50) {
      insights.push({
        type: 'warning',
        title: 'Boost Your Protein',
        message: 'Try consuming more protein for muscle development and satiety.',
      });
    }

    if (fiber.percentage < 60) {
      insights.push({
        type: 'warning',
        title: 'Low Fiber Intake',
        message: 'Eat more vegetables and whole grains for digestive health.',
      });
    }

    if (waterIntake < 1600) {
      insights.push({
        type: 'info',
        title: 'Hydration Reminder 💧',
        message: `Drink ${2000 - waterIntake}ml more water to reach your daily goal.`,
      });
    }

    if (calories.percentage > 110) {
      insights.push({
        type: 'warning',
        title: 'Exceeded Calorie Goal',
        message: 'Consider lighter choices for dinner.',
      });
    } else if (calories.percentage >= 90) {
      insights.push({
        type: 'success',
        title: 'Perfect Calorie Balance! 🎯',
        message: 'You\'re very close to your daily goal, keep it up!',
      });
    }

    setInsights(insights);
  };

  // **Water intake function**
  const addWater = async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase.from('nutrition_logs').insert({
        user_id: user.id,
        date: formatDate(selectedDate),
        meal_type: 'water',
        food_name: 'Water',
        quantity: amount,
        unit: 'ml',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      });

      if (error) {
        Alert.alert('Error', 'Failed to add water');
        return;
      }

      Alert.alert('Success! 💧', `${amount}ml water added`);
      await loadNutritionData();
      
    } catch (error) {
      console.error('Error adding water:', error);
      Alert.alert('Error', 'Failed to add water');
    }
  };

  // **Quick add calories function**
  const handleQuickAdd = async () => {
    if (!quickAddCalories || parseFloat(quickAddCalories) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid calorie value');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const calories = parseFloat(quickAddCalories);
      const { error } = await supabase.from('nutrition_logs').insert({
        user_id: user.id,
        date: formatDate(selectedDate),
        meal_type: 'snacks',
        food_name: 'Quick Add',
        quantity: 1,
        unit: 'serving',
        calories: calories,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      });

      if (error) {
        Alert.alert('Error', 'Failed to add calories');
        return;
      }

      Alert.alert('Success! 🎯', `${calories} calories added`);
      setQuickAddCalories('');
      await loadNutritionData();
      
    } catch (error) {
      console.error('Error adding quick calories:', error);
      Alert.alert('Error', 'Failed to add calories');
    }
  };

  // **Component lifecycle**
  useEffect(() => {
    loadNutritionData();
  }, [selectedDate]);

  // **Loading state**
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading nutrition data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* **Header** */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Nutrition Tracker</Text>
          <Text style={styles.headerSubtitle}>
            {Math.round(todaysNutrition.calories.current)} / {todaysNutrition.calories.target} calories today
          </Text>
        </View>
        <TouchableOpacity style={styles.calendarButton}>
          <Calendar size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* **Daily Overview** */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={20} color={colors.primary[500]} />
          <Text style={styles.sectionTitle}>Today's Progress</Text>
        </View>
        <View style={styles.caloriesOverview}>
          <ProgressBar
            percentage={todaysNutrition.calories.percentage}
            color={colors.primary[500]}
          >
            <View style={styles.caloriesContent}>
              <Text style={styles.caloriesCurrent}>
                {Math.round(todaysNutrition.calories.current)}
              </Text>
              <Text style={styles.caloriesLabel}>calories</Text>
              <Text style={styles.caloriesRemaining}>
                {Math.round(todaysNutrition.calories.target - todaysNutrition.calories.current)} left
              </Text>
            </View>
          </ProgressBar>
          <View style={styles.macrosGrid}>
            <MacroCard
              title="Protein"
              current={todaysNutrition.protein.current}
              target={todaysNutrition.protein.target}
              unit="g"
              color={colors.secondary[500]}
              percentage={todaysNutrition.protein.percentage}
            />
            <MacroCard
              title="Carbs"
              current={todaysNutrition.carbs.current}
              target={todaysNutrition.carbs.target}
              unit="g"
              color={colors.accent[500]}
              percentage={todaysNutrition.carbs.percentage}
            />
            <MacroCard
              title="Fat"
              current={todaysNutrition.fat.current}
              target={todaysNutrition.fat.target}
              unit="g"
              color={colors.error[500]}
              percentage={todaysNutrition.fat.percentage}
            />
            <MacroCard
              title="Fiber"
              current={todaysNutrition.fiber.current}
              target={todaysNutrition.fiber.target}
              unit="g"
              color={colors.success[500]}
              percentage={todaysNutrition.fiber.percentage}
            />
          </View>
        </View>
      </View>

      {/* **Water Intake** */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Droplets size={20} color={colors.accent[500]} />
          <Text style={styles.sectionTitle}>Water Intake</Text>
        </View>
        <View style={styles.waterContainer}>
          <View style={styles.waterProgress}>
            <ProgressBar
              percentage={todaysNutrition.water.percentage}
              color={colors.accent[500]}
              size="small"
            >
              <Droplets size={24} color={colors.accent[500]} />
            </ProgressBar>
            <View style={styles.waterInfo}>
              <Text style={styles.waterCurrent}>{Math.round(waterIntake)} ml</Text>
              <Text style={styles.waterTarget}>/ {todaysNutrition.water.target} ml</Text>
            </View>
          </View>
          <View style={styles.waterButtons}>
            <TouchableOpacity
              style={styles.waterButton}
              onPress={() => addWater(250)}
            >
              <Text style={styles.waterButtonText}>+250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.waterButton}
              onPress={() => addWater(500)}
            >
              <Text style={styles.waterButtonText}>+500ml</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* **Quick Add** */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Add</Text>
        <View style={styles.quickAddContainer}>
          <TextInput
            style={styles.quickAddInput}
            placeholder="Enter calories..."
            value={quickAddCalories}
            onChangeText={setQuickAddCalories}
            keyboardType="numeric"
            placeholderTextColor={colors.neutral[400]}
          />
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={handleQuickAdd}
          >
            <Plus size={20} color={colors.neutral[0]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* **Today's Meals** */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Clock size={20} color={colors.secondary[500]} />
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <TouchableOpacity style={styles.sectionAction}>
            <Plus size={16} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
        <View style={styles.mealsContainer}>
          {meals.length > 0 ? (
            meals.map(meal => (
              <MealCard
                key={meal.id}
                meal={meal}
                onPress={() => console.log('Meal pressed:', meal.food_name)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No meals logged today</Text>
              <Text style={styles.emptyStateSubtext}>Start tracking your nutrition!</Text>
            </View>
          )}
        </View>
      </View>

      {/* **Weekly Progress** */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={20} color={colors.success[500]} />
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
        </View>
        <View style={styles.weeklyChart}>
          {weeklyProgress.map((day, index) => {
            const percentage = (day.calories / day.target) * 100;
            const isToday = day.day === 'Today';
            return (
              <View key={index} style={styles.chartDay}>
                <View style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: `${Math.min(percentage, 100)}%`,
                        backgroundColor: isToday ? colors.primary[500] : colors.neutral[300],
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.chartDayLabel, isToday && styles.chartDayLabelToday]}>
                  {day.day}
                </Text>
                <Text style={styles.chartDayValue}>{day.calories}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* **Insights** */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Award size={20} color={colors.warning[500]} />
          <Text style={styles.sectionTitle}>Insights & Tips</Text>
        </View>
        <View style={styles.insightsContainer}>
          {insights.length > 0 ? (
            insights.map((insight, index) => {
              const getInsightColors = (type: string) => {
                switch (type) {
                  case 'success':
                    return { bg: colors.success[50], border: colors.success[200], text: colors.success[700] };
                  case 'warning':
                    return { bg: colors.warning[50], border: colors.warning[200], text: colors.warning[700] };
                  case 'info':
                    return { bg: colors.accent[50], border: colors.accent[200], text: colors.accent[700] };
                  default:
                    return { bg: colors.accent[50], border: colors.accent[200], text: colors.accent[700] };
                }
              };
              const insightColors = getInsightColors(insight.type);
              return (
                <View
                  key={index}
                  style={[
                    styles.insightCard,
                    {
                      backgroundColor: insightColors.bg,
                      borderColor: insightColors.border,
                    }
                  ]}
                >
                  <Text style={[styles.insightTitle, { color: insightColors.text }]}>
                    {insight.title}
                  </Text>
                  <Text style={styles.insightMessage}>{insight.message}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No insights available</Text>
              <Text style={styles.emptyStateSubtext}>Log some meals to get personalized tips!</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
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
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    marginTop: spacing.md,
    fontFamily: 'Inter-Regular',
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
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Poppins-SemiBold',
    color: colors.neutral[800],
    marginLeft: spacing.sm,
    flex: 1,
  },
  sectionAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  caloriesOverview: {
    backgroundColor: colors.neutral[0],
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  caloriesContent: {
    alignItems: 'center',
  },
  caloriesCurrent: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[800],
  },
  caloriesLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
  },
  caloriesRemaining: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    color: colors.primary[600],
    marginTop: spacing.xs,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  macroCard: {
    width: (width - spacing.lg * 2 - spacing.lg * 2 - spacing.md) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing.md,
  },
  macroContent: {
    alignItems: 'center',
  },
  macroPercentage: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[800],
  },
  macroInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  macroTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  macroValues: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
  macroProgressBar: {
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  waterContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing.lg,
    ...shadows.md,
  },
  waterProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  waterInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  waterCurrent: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[800],
  },
  waterTarget: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
  },
  waterButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  waterButton: {
    flex: 1,
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  waterButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[0],
  },
  quickAddContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing.sm,
    gap: spacing.sm,
    ...shadows.md,
  },
  quickAddInput: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[800],
  },
  quickAddButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealsContainer: {
    gap: spacing.md,
  },
  mealCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing.lg,
    ...shadows.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mealType: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary[600],
  },
  mealTime: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
  },
  mealCalories: {
    alignItems: 'center',
  },
  mealCaloriesText: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[800],
  },
  mealCaloriesLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
  },
  mealName: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  mealMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealMacro: {
    alignItems: 'center',
  },
  mealMacroValue: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Poppins-SemiBold',
    color: colors.neutral[700],
  },
  mealMacroLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
  },
  weeklyChart: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    ...shadows.md,
  },
  chartDay: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    height: 120,
    backgroundColor: colors.neutral[100],
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 10,
    minHeight: 4,
  },
  chartDayLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
  chartDayLabelToday: {
    color: colors.primary[600],
  },
  chartDayValue: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[400],
  },
  insightsContainer: {
    gap: spacing.md,
  },
  insightCard: {
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
  },
  insightTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
  },
  insightMessage: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
  },
});