import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TriangleAlert as AlertTriangle, Target, Award, ChevronRight, User, Activity, Heart, Coffee, Plus, X, CircleHelp as HelpCircle } from 'lucide-react-native';
import { colors, spacing, typography, shadows, gradients } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];

const COMMON_FOODS = [
  { id: 'f1', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: '100g' },
  { id: 'f2', name: 'Brown Rice', calories: 112, protein: 2.6, carbs: 22, fat: 0.9, unit: '100g' },
  { id: 'f3', name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: '1 medium' },
  { id: 'f4', name: 'Eggs', calories: 78, protein: 6, carbs: 0.6, fat: 5.3, unit: '1 large' },
  { id: 'f5', name: 'Oats', calories: 389, protein: 13, carbs: 66, fat: 6.9, unit: '100g' },
  { id: 'f6', name: 'Milk (whole)', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, unit: '100ml' },
  { id: 'f7', name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, unit: '1 medium' },
  { id: 'f8', name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, unit: '1 cup' },
  { id: 'f9', name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fat: 100, unit: '100ml' },
  { id: 'f10', name: 'Bread (whole wheat)', calories: 265, protein: 13, carbs: 49, fat: 3.6, unit: '100g' },
  { id: 'f11', name: 'Salmon', calories: 208, protein: 25, carbs: 0, fat: 12, unit: '100g' },
  { id: 'f12', name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, unit: '100g' },
  { id: 'f13', name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, unit: '100g' },
  { id: 'f14', name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, unit: '100g' },
  { id: 'f15', name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, unit: '100g' },
  { id: 'f16', name: 'Tuna (canned)', calories: 132, protein: 28, carbs: 0, fat: 1.3, unit: '100g' },
  { id: 'f17', name: 'Quinoa', calories: 368, protein: 14, carbs: 64, fat: 6, unit: '100g' },
  { id: 'f18', name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, unit: '1 medium' },
  { id: 'f19', name: 'Turkey Breast', calories: 135, protein: 30, carbs: 0, fat: 1, unit: '100g' },
  { id: 'f20', name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, unit: '100g' },
];

const EDUCATIONAL_CONTENT = {
  bmr: {
    title: "BMR - Basal Metabolic Rate",
    description: "Your body's minimum energy requirement to maintain basic life functions like breathing, circulation, and cell production while at complete rest.",
    calculation: "Calculated using the Mifflin-St Jeor equation based on your age, gender, height, and weight.",
    formula: "Men: 88.362 + (13.397 × weight kg) + (4.799 × height cm) - (5.677 × age)\nWomen: 447.593 + (9.247 × weight kg) + (3.098 × height cm) - (4.330 × age)"
  },
  tdee: {
    title: "TDEE - Total Daily Energy Expenditure", 
    description: "Your total calorie needs per day, including BMR plus calories burned through physical activity and daily movement.",
    calculation: "TDEE = BMR × Activity Level Factor",
    formula: "Activity Factors:\n• Sedentary (1.2): Little to no exercise\n• Lightly Active (1.375): Light exercise 1-3 days/week\n• Moderately Active (1.55): Moderate exercise 3-5 days/week\n• Very Active (1.725): Hard exercise 6-7 days/week\n• Extra Active (1.9): Very hard exercise + physical job"
  }
};

// Nutrition calculation helpers (AYNI KALIYOR)
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

// YENİ: Empty State Component - Manifestoya Uygun
const EmptyState = ({ 
  icon: Icon, 
  title, 
  message, 
  actionText, 
  onAction 
}: {
  icon: any;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}) => {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={48} color={colors.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionText && onAction && (
        <TouchableOpacity style={styles.emptyAction} onPress={onAction}>
          <Text style={styles.emptyActionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// StatCard Component - Empty State Desteği Eklendi
const StatCard = ({ title, current, target, color, unit }: any) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <TrendingUp size={16} color={color} />
      </View>
      
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{current}</Text>
        <Text style={styles.statTarget}>/ {target} {unit}</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: `${color}20` }]}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const InsightCard = ({ icon: Icon, title, description, type, value }: any) => {
  const getColor = () => {
    switch (type) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'info': return colors.info;
      default: return colors.primary;
    }
  };

  return (
    <TouchableOpacity style={styles.insightCard}>
      <View style={[styles.insightIcon, { backgroundColor: `${getColor()}20` }]}>
        <Icon size={24} color={getColor()} />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightDescription}>{description}</Text>
        {value && <Text style={[styles.insightValue, { color: getColor() }]}>{value}</Text>}
      </View>
      <ChevronRight size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

const ProfileSummaryCard = ({ profile }: any) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const bmr = calculateBMR(profile.age, profile.gender, profile.height_cm, profile.weight_kg);
  const tdee = calculateDailyCalories(bmr, profile.activity_level);
  
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <User size={20} color={colors.primary} />
        <Text style={styles.profileTitle}>Your Profile Summary</Text>
      </View>
      
      <View style={styles.profileGrid}>
        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Age</Text>
          <Text style={styles.profileValue}>{profile.age} years</Text>
        </View>
        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Height</Text>
          <Text style={styles.profileValue}>{profile.height_cm} cm</Text>
        </View>
        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Weight</Text>
          <Text style={styles.profileValue}>{profile.weight_kg} kg</Text>
        </View>
        <View style={styles.profileItem}>
          <View style={styles.labelWithInfo}>
            <Text style={styles.profileLabel}>BMR</Text>
            <TouchableOpacity onPress={() => setShowTooltip('bmr')} style={styles.helpButton}>
              <HelpCircle size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileValue}>{Math.round(bmr)} cal</Text>
        </View>
      </View>
      
      <View style={styles.tdeeContainer}>
        <View style={styles.labelWithInfo}>
          <Text style={styles.tdeeLabel}>Daily Calorie Target (TDEE)</Text>
          <TouchableOpacity onPress={() => setShowTooltip('tdee')} style={styles.helpButton}>
            <HelpCircle size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.tdeeValue}>{tdee} calories</Text>
      </View>
      
      {/* Educational Tooltips */}
      <EducationalTooltip type="bmr" visible={showTooltip === 'bmr'} onClose={() => setShowTooltip(null)} />
      <EducationalTooltip type="tdee" visible={showTooltip === 'tdee'} onClose={() => setShowTooltip(null)} />
    </View>
  );
};

export default function Dashboard() {
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [nutritionTargets, setNutritionTargets] = useState({
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 67,
  });
  
  // TEMİZLENDİ: Mock data yerine gerçek veri tracking
  const [todaysIntake, setTodaysIntake] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [hasNutritionData, setHasNutritionData] = useState(false);
  const [mealLogStatus, setMealLogStatus] = useState<{[key: string]: boolean}>({});
  const [showFoodLogModal, setShowFoodLogModal] = useState(false);
  const [selectedMealTypeForLog, setSelectedMealTypeForLog] = useState('');
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [logQuantity, setLogQuantity] = useState('1');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          setUserName(user.email?.split('@')[0] || 'User');
        } else {
          setUserProfile(profile);
          setUserName(profile.full_name || user.email?.split('@')[0] || 'User');
          
          if (profile.age && profile.gender && profile.height_cm && profile.weight_kg && profile.activity_level) {
            const bmr = calculateBMR(profile.age, profile.gender, profile.height_cm, profile.weight_kg);
            const dailyCalories = calculateDailyCalories(bmr, profile.activity_level);
            const macros = calculateMacros(dailyCalories, profile.health_goals || []);
            
            setNutritionTargets({
              calories: dailyCalories,
              protein: macros.protein,
              carbs: macros.carbs,
              fat: macros.fat,
            });
          }
          
          await loadTodaysIntake(user.id);
        }
      }
      
      setGreeting(getTimeBasedGreeting());
    } catch (error) {
      console.error('Error in loadUserData:', error);
      setUserName('User');
      setGreeting(getTimeBasedGreeting());
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysIntake = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: nutritionLogs, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today);

      if (error) {
        console.error('Error loading nutrition logs:', error);
        setHasNutritionData(false);
        return;
      }

      if (nutritionLogs && nutritionLogs.length > 0) {
        const totals = nutritionLogs.reduce((acc, log) => ({
          calories: acc.calories + (log.calories || 0),
          protein: acc.protein + (log.protein || 0),
          carbs: acc.carbs + (log.carbs || 0),
          fat: acc.fat + (log.fat || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        setTodaysIntake(totals);
        setHasNutritionData(true);

        // ✅ NEW: Track meal-specific status
        const status: {[key: string]: boolean} = {};
        MEAL_TYPES.forEach(mealType => {
          status[mealType] = nutritionLogs.some(log => log.meal_type === mealType);
        });
        setMealLogStatus(status);

      } else {
        setTodaysIntake({ calories: 0, protein: 0, carbs: 0, fat: 0 });
        setHasNutritionData(false);
        const status: {[key: string]: boolean} = {};
        MEAL_TYPES.forEach(mealType => status[mealType] = false);
        setMealLogStatus(status);
      }
    } catch (error) {
      console.error('Error in loadTodaysIntake:', error);
      setHasNutritionData(false);
    }
  };

  // TEMİZLENDİ: Sadece gerçek veri varsa insights göster
  const getHealthInsights = () => {
    if (!hasNutritionData) return [];
    
    const insights = [];
    
    const caloriePercentage = (todaysIntake.calories / nutritionTargets.calories) * 100;
    if (caloriePercentage < 50) {
      insights.push({
        icon: Target,
        title: 'Calorie Intake Low',
        description: `You've consumed ${todaysIntake.calories} calories today`,
        type: 'warning',
        value: `${Math.round(nutritionTargets.calories - todaysIntake.calories)} cal remaining`,
      });
    } else if (caloriePercentage > 90) {
      insights.push({
        icon: Award,
        title: 'Almost There!',
        description: 'You\'re close to your daily calorie goal',
        type: 'success',
        value: `${Math.round(caloriePercentage)}% complete`,
      });
    }

    const proteinPercentage = (todaysIntake.protein / nutritionTargets.protein) * 100;
    if (proteinPercentage < 60) {
      insights.push({
        icon: Activity,
        title: 'Boost Your Protein',
        description: 'Consider adding protein-rich foods',
        type: 'info',
        value: `${nutritionTargets.protein - todaysIntake.protein}g needed`,
      });
    }

    if (userProfile?.activity_level === 'sedentary') {
      insights.push({
        icon: Heart,
        title: 'Stay Active',
        description: 'Try to add some physical activity today',
        type: 'info',
      });
    }

    return insights;
  };

  // Educational Tooltip Component
  const EducationalTooltip = ({ type, visible, onClose }: { type: 'bmr' | 'tdee'; visible: boolean; onClose: () => void; }) => {
    if (!visible) return null;
    
    const content = EDUCATIONAL_CONTENT[type];
    
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.tooltipOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.tooltipContainer}>
            <View style={styles.tooltipHeader}>
              <Text style={styles.tooltipTitle}>{content.title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.tooltipCloseButton}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.tooltipDescription}>{content.description}</Text>
            <View style={styles.tooltipSection}>
              <Text style={styles.tooltipSectionTitle}>Calculation:</Text>
              <Text style={styles.tooltipSectionText}>{content.calculation}</Text>
            </View>
            <View style={styles.tooltipFormula}>
              <Text style={styles.tooltipFormulaTitle}>Formula:</Text>
              <Text style={styles.tooltipFormulaText}>{content.formula}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Meal Status Component
  const MealStatusRow = ({ mealType, isLogged, onAddMeal }: { mealType: string; isLogged: boolean; onAddMeal: (type: string) => void; }) => {
    const displayMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    return (
      <View style={styles.mealStatusItem}>
        <Text style={styles.mealStatusText}>{displayMealType}:</Text>
        {isLogged ? (
          <View style={styles.mealStatusLogged}>
            <Text style={styles.mealStatusLoggedText}>✅ Logged</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.mealStatusAddButton} onPress={() => onAddMeal(mealType)}>
            <Text style={styles.mealStatusAddButtonText}>➕ Add Meal</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Enhanced Food Logging Modal
  const FoodLoggingModal = () => {
    const filteredFoods = COMMON_FOODS.filter(food =>
      food.name.toLowerCase().includes(foodSearchQuery.toLowerCase())
    ).slice(0, 10);

    const handleLogFood = async () => {
      if (!selectedFood || !logQuantity || !selectedMealTypeForLog) {
        Alert.alert('Error', 'Please select a food, quantity, and meal type.');
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const quantityNum = parseFloat(logQuantity);
        if (isNaN(quantityNum) || quantityNum <= 0) {
          Alert.alert('Error', 'Quantity must be a positive number.');
          return;
        }

        const factor = selectedFood.unit.includes('100g') || selectedFood.unit.includes('100ml') ? quantityNum / 100 : quantityNum;

        const logData = {
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          meal_type: selectedMealTypeForLog,
          food_name: selectedFood.name,
          quantity: quantityNum,
          unit: selectedFood.unit,
          calories: Math.round(selectedFood.calories * factor),
          protein: Math.round(selectedFood.protein * factor * 10) / 10,
          carbs: Math.round(selectedFood.carbs * factor * 10) / 10,
          fat: Math.round(selectedFood.fat * factor * 10) / 10,
        };

        const { error } = await supabase.from('nutrition_logs').insert([logData]);
        if (error) throw error;

        Alert.alert('Success', `${selectedFood.name} logged for ${selectedMealTypeForLog}!`);
        setShowFoodLogModal(false);
        setFoodSearchQuery('');
        setSelectedFood(null);
        setLogQuantity('1');
        loadTodaysIntake(user.id);
      } catch (error: any) {
        console.error('Error logging food:', error);
        Alert.alert('Error', 'Could not log food: ' + error.message);
      }
    };

    return (
      <Modal
        visible={showFoodLogModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFoodLogModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Log {selectedMealTypeForLog ? selectedMealTypeForLog.charAt(0).toUpperCase() + selectedMealTypeForLog.slice(1) : 'Food'}
              </Text>
              <TouchableOpacity onPress={() => setShowFoodLogModal(false)} style={styles.modalCloseButton}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Search Food</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Chicken Breast, Rice"
                  placeholderTextColor={colors.textSecondary}
                  value={foodSearchQuery}
                  onChangeText={setFoodSearchQuery}
                />
                {foodSearchQuery.length > 0 && (
                  <View style={styles.searchResults}>
                    {filteredFoods.map(food => (
                      <TouchableOpacity 
                        key={food.id} 
                        style={styles.searchResultItem} 
                        onPress={() => {
                          setSelectedFood(food);
                          setFoodSearchQuery(food.name);
                        }}
                      >
                        <Text style={styles.searchResultText}>{food.name}</Text>
                        <Text style={styles.searchResultDetails}>{food.calories} kcal per {food.unit}</Text>
                      </TouchableOpacity>
                    ))}
                    {filteredFoods.length === 0 && (
                      <Text style={styles.searchResultText}>No results found.</Text>
                    )}
                  </View>
                )}
              </View>

              {selectedFood && (
                <View style={styles.selectedFoodInfo}>
                  <Text style={styles.selectedFoodText}>Selected: {selectedFood.name}</Text>
                  <Text style={styles.selectedFoodDetails}>
                    {selectedFood.calories} kcal, {selectedFood.protein}g protein, {selectedFood.carbs}g carbs, {selectedFood.fat}g fat (per {selectedFood.unit})
                  </Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={logQuantity}
                  onChangeText={setLogQuantity}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowFoodLogModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={handleLogFood}>
                  <Text style={styles.addButtonText}>Log Food</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Helper functions
  const handleAddMealPress = (mealType: string) => {
    setSelectedMealTypeForLog(mealType);
    setShowFoodLogModal(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header - LOGOUT BUTTON KALDIRILDI */}
      <LinearGradient
        colors={gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              {greeting}, {userName}!
            </Text>
            <Text style={styles.subtitle}>
              {userProfile?.health_goals?.includes('weight_loss') 
                ? "Let's achieve your weight loss goals"
                : userProfile?.health_goals?.includes('muscle_gain')
                ? "Time to build those muscles"
                : "Let's track your nutrition goals"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Profile Summary */}
      {userProfile && userProfile.age && (
        <View style={styles.section}>
          <ProfileSummaryCard profile={userProfile} />
        </View>
      )}

      {/* Today's Progress - ENHANCED WITH MEAL TRACKING */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Today's Progress</Text>
        </View>
        {hasNutritionData ? (
          <View>
            <View style={styles.statsGrid}>
              <StatCard
                title="Calories"
                current={todaysIntake.calories}
                target={nutritionTargets.calories}
                color={colors.success}
                unit="kcal"
              />
              <StatCard
                title="Protein"
                current={todaysIntake.protein}
                target={nutritionTargets.protein}
                color={colors.warning}
                unit="g"
              />
              <StatCard
                title="Carbs"
                current={todaysIntake.carbs}
                target={nutritionTargets.carbs}
                color={colors.info}
                unit="g"
              />
              <StatCard
                title="Fat"
                current={todaysIntake.fat}
                target={nutritionTargets.fat}
                color={colors.error}
                unit="g"
              />
            </View>
            <View style={styles.mealStatusGrid}>
              {MEAL_TYPES.map(mealType => (
                <MealStatusRow
                  key={mealType}
                  mealType={mealType}
                  isLogged={mealLogStatus[mealType]}
                  onAddMeal={handleAddMealPress}
                />
              ))}
            </View>
          </View>
        ) : (
          <EmptyState
            icon={Coffee}
            title="No nutrition data logged today"
            message="Start tracking your meals to see your progress here"
            actionText="Log your first meal"
            onAction={() => handleAddMealPress('breakfast')}
          />
        )}
      </View>

      {/* Insights - SADECE VERİ VARSA GÖSTER */}
      {hasNutritionData && getHealthInsights().length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Your Insights</Text>
          </View>
          
          <View style={styles.insightsList}>
            {getHealthInsights().map((insight, index) => (
              <InsightCard key={index} {...insight} />
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions - GERÇEK NAVİGATİON EKLENDİ */}
      <View style={[styles.section, { marginBottom: 100 }]}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/nutrition')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#10b98120' }]}>
              <Target size={24} color="#10b981" />
            </View>
            <Text style={styles.quickActionText}>Log Food</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/pantry')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#f5931920' }]}>
              <Plus size={24} color="#f59319" />
            </View>
            <Text style={styles.quickActionText}>Add Item</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/recipes')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#6366f120' }]}>
              <Award size={24} color="#6366f1" />
            </View>
            <Text style={styles.quickActionText}>Recipes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add modals at the end of ScrollView, before closing tag */}
      {FoodLoggingModal()}
      <EducationalTooltip type="bmr" visible={showTooltip === 'bmr'} onClose={() => setShowTooltip(null)} />
      <EducationalTooltip type="tdee" visible={showTooltip === 'tdee'} onClose={() => setShowTooltip(null)} />
    </ScrollView>
  );
}

// Styles - Empty State Stilleri Eklendi
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: spacing.lg,
    ...shadows.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  profileItem: {
    width: '50%',
    paddingVertical: spacing.sm,
  },
  profileLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tdeeContainer: {
    backgroundColor: '#10b98110',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  tdeeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  tdeeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: spacing.md,
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    ...shadows.sm,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statTarget: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  // YENİ: Empty State Stilleri
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: 'white',
    borderRadius: 16,
    ...shadows.sm,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.textSecondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  emptyAction: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  insightsList: {
    gap: spacing.sm,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.sm,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  insightDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral?.[100] || '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  input: {
    backgroundColor: colors.neutral?.[100] || '#f5f5f5',
    borderWidth: 1.5,
    borderColor: colors.border || '#e5e5e5',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  searchResults: {
    backgroundColor: colors.neutral?.[100] || '#f5f5f5',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border || '#e5e5e5',
    maxHeight: 200,
  },
  searchResultItem: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || '#e5e5e5',
  },
  searchResultText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  searchResultDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedFoodInfo: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  selectedFoodText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  selectedFoodDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border || '#e5e5e5',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: -0.3,
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    letterSpacing: -0.3,
  },
  // Meal status styles
  mealStatusGrid: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  mealStatusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.sm,
  },
  mealStatusText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  mealStatusLogged: {
    backgroundColor: colors.success + '15',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mealStatusLoggedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  mealStatusAddButton: {
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mealStatusAddButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  // Educational tooltip styles
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tooltipContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    maxWidth: '90%',
    maxHeight: '80%',
    ...shadows.lg,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  tooltipCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral?.[100] || '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  tooltipSection: {
    marginBottom: 16,
  },
  tooltipSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  tooltipSectionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tooltipFormula: {
    backgroundColor: colors.neutral?.[50] || '#fafafa',
    borderRadius: 8,
    padding: 12,
  },
  tooltipFormulaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  tooltipFormulaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  // Enhanced ProfileSummaryCard styles
  labelWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpButton: {
    marginLeft: 6,
    padding: 4,
  },
});