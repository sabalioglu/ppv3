import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  TextInput,
} from 'react-native';
import {
  Target,
  TrendingUp,
  Calendar,
  Plus,
  Droplets,
  Clock,
  Award,
  Camera,
  X,
  Trash2,
  HelpCircle,
  Edit3,
} from 'lucide-react-native';
import { Calendar as CalendarPicker } from 'react-native-calendars';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

// **BMR/TDEE Calculation Functions**
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

// **Enhanced Progress Bar Component**
interface ProgressBarProps {
  percentage: number;
  color: string;
  size?: 'small' | 'large';
  children?: React.ReactNode;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, color, size = 'large', children }) => {
  const isLarge = size === 'large';
  const containerSize = isLarge ? 120 : 80;
  const strokeWidth = isLarge ? 8 : 6;

  return (
    <View style={{
      width: containerSize,
      height: containerSize,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    }}>
      <View style={{
        position: 'absolute',
        width: containerSize,
        height: containerSize,
        borderRadius: containerSize / 2,
        borderWidth: strokeWidth,
        borderColor: `${color}20`,
      }} />
      <View style={{
        position: 'absolute',
        width: containerSize,
        height: containerSize,
        borderRadius: containerSize / 2,
        borderWidth: strokeWidth,
        borderColor: 'transparent',
        borderTopColor: color,
        transform: [{ rotate: `${(percentage * 3.6) - 90}deg` }],
      }} />
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {children}
      </View>
    </View>
  );
};

// **Mobile-Optimized Macro Card**
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
      <View style={styles.macroCircle}>
        <ProgressBar percentage={percentage} color={color} size="small">
          <Text style={styles.macroPercentage}>{percentage}%</Text>
        </ProgressBar>
      </View>
      <View style={styles.macroInfo}>
        <Text style={styles.macroTitle}>{title}</Text>
        <Text style={styles.macroValues}>
          {Math.round(current)} / {target} {unit}
        </Text>
      </View>
    </View>
  );
};

// **Enhanced Meal Card with Delete & AI Badge**
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
    source?: string;
  };
  onPress: () => void;
  onDelete: (id: string) => void;
}

const MealCard: React.FC<MealCardProps> = ({ meal, onPress, onDelete }) => {
  const handleDelete = () => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete ${meal.food_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(meal.id)
        }
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.mealCard} onPress={onPress}>
      <View style={styles.mealHeader}>
        <View style={styles.mealHeaderLeft}>
          <Text style={styles.mealType}>
            {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
          </Text>
          <Text style={styles.mealTime}>{meal.time}</Text>
          {meal.source === 'camera_ai' && (
            <View style={styles.aiTag}>
              <Camera size={12} color={colors.primary[600]} />
              <Text style={styles.aiTagText}>AI</Text>
            </View>
          )}
        </View>
        <View style={styles.mealHeaderRight}>
          <View style={styles.mealCalories}>
            <Text style={styles.mealCaloriesText}>{Math.round(meal.calories)}</Text>
            <Text style={styles.mealCaloriesLabel}>kcal</Text>
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Trash2 size={16} color={colors.error[500]} />
          </TouchableOpacity>
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

  // **Calendar & Modal States**
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTdeeTooltip, setShowTdeeTooltip] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  // **Manual Quick Add States**
  const [quickAddCalories, setQuickAddCalories] = useState('');
  const [quickAddFoodName, setQuickAddFoodName] = useState('');

  // **Celebration Animation States**
  const [showCelebration, setShowCelebration] = useState(false);
  const [waterGoalCelebrated, setWaterGoalCelebrated] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // **Camera Return Data Handling**
  const params = useLocalSearchParams();

  // **Helper Functions**
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (isoString: string): string => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // **NEW: Format selected date for display**
  const formatSelectedDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // **Smart Meal Type Detection**
  const getSmartMealType = (): string => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 16) return 'lunch';
    if (hour < 20) return 'dinner';
    return 'snacks';
  };

  // **Process Camera AI Data**
  const processCameraData = async (cameraData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const mealType = getSmartMealType();
      const foodName = cameraData.name || 'Unknown Food';
      const calories = cameraData.calories || 0;
      const nutrition = cameraData.nutrition || {};

      const { error } = await supabase.from('nutrition_logs').insert({
        user_id: user.id,
        date: formatDate(selectedDate),
        meal_type: mealType,
        food_name: foodName, // **AI detected food name (Pizza, Burger, etc.)**
        quantity: 1,
        unit: 'serving',
        calories: calories,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fat: nutrition.fat || 0,
        fiber: nutrition.fiber || 0,
        source: 'camera_ai',
      });

      if (error) {
        Alert.alert('Error', 'Failed to log food from camera');
        return;
      }

      Alert.alert(
        'Success! 🎉',
        `${foodName} (${calories} calories) added to your nutrition tracker!`
      );
      await loadNutritionData();
    } catch (error) {
      console.error('Error processing camera data:', error);
      Alert.alert('Error', 'Failed to process camera data');
    }
  };

  // **Main Data Loading Function**
  const loadNutritionData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in');
        return;
      }

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

      await loadTodaysNutrition(user.id, nutritionTargets);
      await Promise.all([
        loadTodaysMeals(user.id),
        loadWeeklyProgress(user.id, nutritionTargets.calories)
      ]);

      generateInsights(nutritionTargets);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
      Alert.alert('Error', 'Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
  };

  // **Load Today's Nutrition Totals**
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

    const totals = nutritionLogs?.reduce((acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fat: acc.fat + (log.fat || 0),
      fiber: acc.fiber + (log.fiber || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }) ||
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

    const waterLogs = nutritionLogs?.filter(log => log.meal_type === 'water') || [];
    const totalWater = waterLogs.reduce((sum, log) => sum + (log.quantity || 0), 0);

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
    setWaterGoalCelebrated(totalWater >= 2000);
  };

  // **Load Today's Meals**
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

    const formattedMeals = nutritionLogs?.map(log => ({
      id: log.id,
      meal_type: log.meal_type,
      time: formatTime(log.created_at),
      food_name: log.food_name, // **Real AI detected food name**
      calories: log.calories || 0,
      protein: log.protein || 0,
      carbs: log.carbs || 0,
      fat: log.fat || 0,
      fiber: log.fiber || 0,
      source: log.source || 'manual',
    })) || [];

    setMeals(formattedMeals);
  };

  // **Load Weekly Progress with Correct Calendar**
  const loadWeeklyProgress = async (userId: string, targetCalories: number) => {
    const today = new Date(selectedDate);
    const weekDays = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      weekDays.push(formatDate(date));
    }

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

    const dailyTotals: { [key: string]: number } = {};
    weeklyLogs?.forEach(log => {
      if (!dailyTotals[log.date]) {
        dailyTotals[log.date] = 0;
      }
      dailyTotals[log.date] += log.calories || 0;
    });

    const chartData = weekDays.map((dateString, index) => {
      const dateObj = new Date(dateString);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const isSelectedDate = formatDate(selectedDate) === dateString;
      const dayName = isSelectedDate ? 'Today' : dayNames[dateObj.getDay()];

      return {
        day: dayName,
        calories: Math.round(dailyTotals[dateString] || 0),
        target: targetCalories,
      };
    });

    setWeeklyProgress(chartData);
  };

  // **Generate Smart Insights**
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

    if (waterIntake < todaysNutrition.water.target) {
      insights.push({
        type: 'info',
        title: 'Hydration Reminder 💧',
        message: `Drink ${todaysNutrition.water.target - waterIntake}ml more water to reach your daily goal.`,
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

  // **Water Intake with 4 Options & Continuous Input**
  const addWater = async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const newWaterIntake = waterIntake + amount;
      const newPercentage = Math.min(Math.round((newWaterIntake / todaysNutrition.water.target) * 100), 100);

      setWaterIntake(newWaterIntake);
      setTodaysNutrition(prev => ({
        ...prev,
        water: {
          ...prev.water,
          current: newWaterIntake,
          percentage: newPercentage
        }
      }));

      if (!waterGoalCelebrated && newWaterIntake >= todaysNutrition.water.target && waterIntake < todaysNutrition.water.target) {
        triggerCelebration();
        setWaterGoalCelebrated(true);
      }

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
        setWaterIntake(waterIntake);
        setTodaysNutrition(prev => ({
          ...prev,
          water: {
            ...prev.water,
            current: waterIntake,
            percentage: Math.min(Math.round((waterIntake / prev.water.target) * 100), 100)
          }
        }));
        Alert.alert('Error', 'Failed to add water');
        return;
      }

      console.log(`✅ ${amount}ml water added successfully`);
    } catch (error) {
      console.error('Error adding water:', error);
      Alert.alert('Error', 'Failed to add water');
    }
  };

  // **Simple Celebration Animation**
  const triggerCelebration = () => {
    setShowCelebration(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      })
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          })
        ]).start(() => setShowCelebration(false));
      }, 2000);
    });
  };

  // **NEW: Manual Quick Add Function**
  const handleManualQuickAdd = async () => {
    if (!quickAddCalories || parseFloat(quickAddCalories) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid calorie value');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const calories = parseFloat(quickAddCalories);
      const foodName = quickAddFoodName.trim() || 'Quick Add';
      const mealType = getSmartMealType();

      const { error } = await supabase.from('nutrition_logs').insert({
        user_id: user.id,
        date: formatDate(selectedDate),
        meal_type: mealType,
        food_name: foodName,
        quantity: 1,
        unit: 'serving',
        calories: calories,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        source: 'manual',
      });

      if (error) {
        Alert.alert('Error', 'Failed to add food');
        return;
      }

      Alert.alert('Success! 🎯', `${foodName} (${calories} calories) added successfully!`);
      setQuickAddCalories('');
      setQuickAddFoodName('');
      setShowQuickAddModal(false);
      await loadNutritionData();
    } catch (error) {
      console.error('Error adding manual food:', error);
      Alert.alert('Error', 'Failed to add food');
    }
  };

  // **Camera Integration**
  const handleCameraAdd = () => {
    router.push({
      pathname: '/(tabs)/camera',
      params: {
        mode: 'calorie-counter',
        returnTo: 'nutrition',
        timestamp: Date.now().toString()
      }
    });
  };

  // **Delete Meal Function**
  const deleteMeal = async (mealId: string) => {
    try {
      const { error } = await supabase
        .from('nutrition_logs')
        .delete()
        .eq('id', mealId);

      if (error) {
        Alert.alert('Error', 'Failed to delete meal');
        return;
      }

      Alert.alert('Success', 'Meal deleted successfully');
      await loadNutritionData();
    } catch (error) {
      console.error('Error deleting meal:', error);
      Alert.alert('Error', 'Failed to delete meal');
    }
  };

  // **NEW: Calendar Date Selection Functions**
  const handleDateSelect = (day: any) => {
    const newDate = new Date(day.dateString);
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  const selectToday = () => {
    setSelectedDate(new Date());
    setShowDatePicker(false);
  };

  const selectYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(yesterday);
    setShowDatePicker(false);
  };

  const selectWeekAgo = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    setSelectedDate(weekAgo);
    setShowDatePicker(false);
  };

  // **Handle Camera Return Data**
  useEffect(() => {
    if (params.scanResult) {
      try {
        const scanResultData = JSON.parse(params.scanResult as string);
        if (scanResultData.type === 'calorie-counter' && scanResultData.data) {
          processCameraData(scanResultData.data);
        }
      } catch (error) {
        console.error('Error parsing camera data:', error);
      }
    }
  }, [params.scanResult]);

  useEffect(() => {
    loadNutritionData();
  }, [selectedDate]);

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
      {/* **Enhanced Header with Functional Calendar** */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Nutrition Tracker</Text>
          <Text style={styles.headerSubtitle}>
            {Math.round(todaysNutrition.calories.current)} / {todaysNutrition.calories.target} calories {formatSelectedDate(selectedDate).toLowerCase()}
          </Text>
          <Text style={styles.headerDate}>
            {formatDateForDisplay(selectedDate)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* **Mobile-Optimized Daily Overview** */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={20} color={colors.primary[500]} />
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <TouchableOpacity onPress={() => setShowTdeeTooltip(true)}>
            <HelpCircle size={16} color={colors.neutral[500]} />
          </TouchableOpacity>
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

          {/* **Mobile-Optimized Macros Grid** */}
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

      {/* **Enhanced Water Intake with 4 Options** */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Droplets size={20} color={colors.accent[500]} />
          <Text style={styles.sectionTitle}>Water Intake</Text>
          {todaysNutrition.water.percentage >= 100 && (
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>✅ Goal Reached!</Text>
            </View>
          )}
        </View>
        <View style={styles.waterContainer}>
          <View style={styles.waterProgress}>
            <ProgressBar
              percentage={todaysNutrition.water.percentage}
              color={todaysNutrition.water.percentage >= 100 ? colors.success[500] : colors.accent[500]}
              size="small"
            >
              <Droplets size={24} color={todaysNutrition.water.percentage >= 100 ? colors.success[500] : colors.accent[500]} />
            </ProgressBar>
            <View style={styles.waterInfo}>
              <Text style={styles.waterCurrent}>{Math.round(waterIntake)} ml</Text>
              <Text style={styles.waterTarget}>/ {todaysNutrition.water.target} ml</Text>
              {todaysNutrition.water.percentage >= 100 && (
                <Text style={styles.goalCompleteText}>Daily goal complete!</Text>
              )}
            </View>
          </View>
          <View style={styles.waterButtons}>
            <TouchableOpacity
              style={styles.waterButton}
              onPress={() => addWater(50)}
            >
              <Text style={styles.waterButtonText}>+50ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.waterButton}
              onPress={() => addWater(100)}
            >
              <Text style={styles.waterButtonText}>+100ml</Text>
            </TouchableOpacity>
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

      {/* **NEW: Enhanced Quick Add with Both Options** */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Add Food</Text>
        <View style={styles.quickAddContainer}>
          <TouchableOpacity
            style={styles.quickAddOption}
            onPress={handleCameraAdd}
          >
            <Camera size={24} color={colors.primary[500]} />
            <View style={styles.quickAddOptionText}>
              <Text style={styles.quickAddOptionTitle}>AI Camera</Text>
              <Text style={styles.quickAddOptionSubtitle}>Scan food automatically</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAddOption}
            onPress={() => setShowQuickAddModal(true)}
          >
            <Edit3 size={24} color={colors.secondary[500]} />
            <View style={styles.quickAddOptionText}>
              <Text style={styles.quickAddOptionTitle}>Manual Entry</Text>
              <Text style={styles.quickAddOptionSubtitle}>Enter calories manually</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* **Enhanced Today's Meals with Delete & AI Badge** */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Clock size={20} color={colors.secondary[500]} />
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <TouchableOpacity style={styles.sectionAction} onPress={() => setShowQuickAddModal(true)}>
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
                onDelete={deleteMeal}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No meals logged {formatSelectedDate(selectedDate).toLowerCase()}</Text>
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

      {/* **NEW: Full Calendar Picker Modal** */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDatePicker(false)}
              >
                <X size={24} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            {/* **Quick Access Buttons** */}
            <View style={styles.quickDateButtons}>
              <TouchableOpacity style={styles.quickDateButton} onPress={selectToday}>
                <Text style={styles.quickDateButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickDateButton} onPress={selectYesterday}>
                <Text style={styles.quickDateButtonText}>Yesterday</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickDateButton} onPress={selectWeekAgo}>
                <Text style={styles.quickDateButtonText}>Week Ago</Text>
              </TouchableOpacity>
            </View>

            {/* **Full Calendar Picker** */}
            <CalendarPicker
              maxDate={new Date()}
              onDayPress={handleDateSelect}
              markedDates={{
                [formatDate(selectedDate)]: {
                  selected: true,
                  selectedColor: colors.primary[500]
                }
              }}
              theme={{
                backgroundColor: colors.neutral[0],
                calendarBackground: colors.neutral[0],
                textSectionTitleColor: colors.neutral[600],
                selectedDayBackgroundColor: colors.primary[500],
                selectedDayTextColor: colors.neutral[0],
                todayTextColor: colors.primary[600],
                dayTextColor: colors.neutral[800],
                textDisabledColor: colors.neutral[300],
                dotColor: colors.primary[500],
                selectedDotColor: colors.neutral[0],
                arrowColor: colors.primary[500],
                monthTextColor: colors.neutral[800],
                indicatorColor: colors.primary[500],
                textDayFontFamily: 'Inter-Regular',
                textMonthFontFamily: 'Inter-SemiBold',
                textDayHeaderFontFamily: 'Inter-Medium',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
            />
          </View>
        </View>
      </Modal>

      {/* **NEW: Manual Quick Add Modal** */}
      <Modal
        visible={showQuickAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuickAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Food Manually</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowQuickAddModal(false)}
              >
                <X size={24} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.manualAddForm}>
              <Text style={styles.inputLabel}>Food Name (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Apple, Sandwich..."
                value={quickAddFoodName}
                onChangeText={setQuickAddFoodName}
                placeholderTextColor={colors.neutral[400]}
              />

              <Text style={styles.inputLabel}>Calories *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter calories..."
                value={quickAddCalories}
                onChangeText={setQuickAddCalories}
                keyboardType="numeric"
                placeholderTextColor={colors.neutral[400]}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowQuickAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={handleManualQuickAdd}
                >
                  <Text style={styles.addButtonText}>Add Food</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* **TDEE Tooltip Modal** */}
      <Modal
        transparent
        visible={showTdeeTooltip}
        animationType="fade"
        onRequestClose={() => setShowTdeeTooltip(false)}
      >
        <View style={styles.tooltipOverlay}>
          <View style={styles.tooltipContainer}>
            <View style={styles.tooltipHeader}>
              <Text style={styles.tooltipTitle}>TDEE (Total Daily Energy Expenditure)</Text>
              <TouchableOpacity onPress={() => setShowTdeeTooltip(false)}>
                <X size={24} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.tooltipText}>
              TDEE is the total number of calories you burn in a day, including your BMR plus calories burned through physical activity and digestion.
            </Text>
            <View style={styles.tooltipFormula}>
              <Text style={styles.tooltipFormulaTitle}>Formula:</Text>
              <Text style={styles.tooltipFormulaText}>
                TDEE = BMR × Activity Level Multiplier
                {'\n\n'}Activity Levels:
                {'\n'}• Sedentary: 1.2
                {'\n'}• Lightly Active: 1.375
                {'\n'}• Moderately Active: 1.55
                {'\n'}• Very Active: 1.725
                {'\n'}• Extra Active: 1.9
              </Text>
            </View>
            {userProfile && (
              <View style={styles.tooltipUserData}>
                <Text style={styles.tooltipUserTitle}>Your Data:</Text>
                <Text style={styles.tooltipUserText}>
                  BMR: {Math.round(calculateBMR(userProfile.age, userProfile.gender, userProfile.height_cm, userProfile.weight_kg))} calories
                  {'\n'}Activity Level: {userProfile.activity_level?.replace('_', ' ')}
                  {'\n'}TDEE: {todaysNutrition.calories.target} calories
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* **Simple Celebration Animation** */}
      {showCelebration && (
        <Animated.View style={[
          styles.celebrationOverlay,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>Congratulations!</Text>
            <Text style={styles.celebrationMessage}>You reached your water goal!</Text>
          </View>
        </Animated.View>
      )}
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
    marginBottom: 4,
  },
  headerDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.primary[600],
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
  // **Mobile-Optimized Macros Grid**
  macrosGrid: {
    width: '100%',
    marginTop: spacing.xl,
  },
  macroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    width: '100%',
    ...shadows.sm,
  },
  macroCircle: {
    marginRight: spacing.md,
  },
  macroPercentage: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[800],
  },
  macroInfo: {
    flex: 1,
  },
  macroTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[700],
    marginBottom: 4,
  },
  macroValues: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
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
  goalCompleteText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.success[600],
    marginTop: 4,
  },
  goalBadge: {
    backgroundColor: colors.success[500],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  goalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // **Water Buttons (4 options)**
  waterButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  waterButton: {
    flex: 1,
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  waterButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[0],
  },
  // **NEW: Enhanced Quick Add Styles**
  quickAddContainer: {
    gap: spacing.md,
  },
  quickAddOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing.lg,
    ...shadows.md,
  },
  quickAddOptionText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  quickAddOptionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  quickAddOptionSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
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
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  mealHeaderLeft: {
    flex: 1,
  },
  mealHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    marginTop: 2,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  aiTagText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary[600],
    marginLeft: 2,
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
  deleteButton: {
    padding: 4,
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
  // **NEW: Modal Styles**
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: 20,
    padding: spacing.lg,
    margin: spacing.lg,
    width: width - (spacing.lg * 2),
    maxHeight: '80%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Poppins-SemiBold',
    color: colors.neutral[800],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickDateButton: {
    flex: 1,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  quickDateButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary[600],
  },
  // **NEW: Manual Add Form Styles**
  manualAddForm: {
    gap: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[700],
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.neutral[100],
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[600],
  },
  addButton: {
    backgroundColor: colors.primary[500],
  },
  addButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[0],
  },
  // **Tooltip Styles**
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: spacing.lg,
    width: '90%',
    maxHeight: '80%',
    ...shadows.lg,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tooltipTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Poppins-SemiBold',
    color: colors.neutral[800],
    flex: 1,
  },
  tooltipText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  tooltipFormula: {
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  tooltipFormulaTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  tooltipFormulaText: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.neutral[700],
    lineHeight: 18,
  },
  tooltipUserData: {
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    padding: spacing.md,
  },
  tooltipUserTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary[700],
    marginBottom: spacing.xs,
  },
  tooltipUserText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.primary[600],
    lineHeight: 18,
  },
  // **Simple Celebration Animation**
  celebrationOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -75 }],
    backgroundColor: 'rgba(76, 175, 80, 0.95)',
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: 300,
    height: 150,
    zIndex: 1000,
    ...shadows.lg,
  },
  celebrationContent: {
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  celebrationTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  celebrationMessage: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
