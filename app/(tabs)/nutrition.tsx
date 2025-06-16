import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from 'react-native';
import {
  Target,
  TrendingUp,
  Calendar,
  Plus,
  Droplets,
  Activity,
  Clock,
  Award,
  ChevronRight,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/lib/theme';

const { width } = Dimensions.get('window');

// Mock data
const mockNutritionData = {
  today: {
    calories: { current: 1850, target: 2200, percentage: 84 },
    protein: { current: 85, target: 120, percentage: 71 },
    carbs: { current: 180, target: 275, percentage: 65 },
    fat: { current: 75, target: 85, percentage: 88 },
    fiber: { current: 18, target: 25, percentage: 72 },
    water: { current: 1600, target: 2000, percentage: 80 },
  },
  meals: [
    {
      id: '1',
      type: 'Breakfast',
      time: '08:30',
      name: 'Overnight Oats with Berries',
      calories: 420,
      protein: 15,
      carbs: 65,
      fat: 12,
      fiber: 8,
    },
    {
      id: '2',
      type: 'Lunch',
      time: '13:15',
      name: 'Grilled Chicken Salad',
      calories: 580,
      protein: 45,
      carbs: 25,
      fat: 28,
      fiber: 6,
    },
    {
      id: '3',
      type: 'Snack',
      time: '16:00',
      name: 'Apple with Almonds',
      calories: 190,
      protein: 6,
      carbs: 20,
      fat: 12,
      fiber: 4,
    },
  ],
  weeklyProgress: [
    { day: 'Mon', calories: 2100, target: 2200 },
    { day: 'Tue', calories: 2050, target: 2200 },
    { day: 'Wed', calories: 2180, target: 2200 },
    { day: 'Thu', calories: 1950, target: 2200 },
    { day: 'Fri', calories: 2220, target: 2200 },
    { day: 'Sat', calories: 2300, target: 2200 },
    { day: 'Today', calories: 1850, target: 2200 },
  ],
  insights: [
    {
      type: 'success',
      title: 'Great Protein Intake!',
      message: 'You\'re on track with your protein goals for muscle building.',
    },
    {
      type: 'warning',
      title: 'Low Fiber',
      message: 'Add more vegetables and whole grains to reach your fiber goal.',
    },
    {
      type: 'info',
      title: 'Hydration Reminder',
      message: 'Drink 400ml more water to reach your daily goal.',
    },
  ],
};

interface CircularProgressProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size,
  strokeWidth,
  color,
  backgroundColor = colors.neutral[200],
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Background circle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
        }}
      />
      {/* Progress circle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderStyle: 'solid',
          transform: [{ rotate: '-90deg' }],
        }}
      />
      {/* Content */}
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
      <CircularProgress
        percentage={percentage}
        size={80}
        strokeWidth={6}
        color={color}
      >
        <View style={styles.macroContent}>
          <Text style={styles.macroPercentage}>{percentage}%</Text>
        </View>
      </CircularProgress>
      
      <View style={styles.macroInfo}>
        <Text style={styles.macroTitle}>{title}</Text>
        <Text style={styles.macroValues}>
          {current} / {target} {unit}
        </Text>
        <View style={styles.macroProgressBar}>
          <View
            style={[
              styles.macroProgressFill,
              { width: `${percentage}%`, backgroundColor: color }
            ]}
          />
        </View>
      </View>
    </View>
  );
};

interface MealCardProps {
  meal: typeof mockNutritionData.meals[0];
  onPress: () => void;
}

const MealCard: React.FC<MealCardProps> = ({ meal, onPress }) => {
  return (
    <TouchableOpacity style={styles.mealCard} onPress={onPress}>
      <View style={styles.mealHeader}>
        <View>
          <Text style={styles.mealType}>{meal.type}</Text>
          <Text style={styles.mealTime}>{meal.time}</Text>
        </View>
        <View style={styles.mealCalories}>
          <Text style={styles.mealCaloriesText}>{meal.calories}</Text>
          <Text style={styles.mealCaloriesLabel}>kcal</Text>
        </View>
      </View>
      
      <Text style={styles.mealName}>{meal.name}</Text>
      
      <View style={styles.mealMacros}>
        <View style={styles.mealMacro}>
          <Text style={styles.mealMacroValue}>{meal.protein}g</Text>
          <Text style={styles.mealMacroLabel}>Protein</Text>
        </View>
        <View style={styles.mealMacro}>
          <Text style={styles.mealMacroValue}>{meal.carbs}g</Text>
          <Text style={styles.mealMacroLabel}>Carbs</Text>
        </View>
        <View style={styles.mealMacro}>
          <Text style={styles.mealMacroValue}>{meal.fat}g</Text>
          <Text style={styles.mealMacroLabel}>Fat</Text>
        </View>
        <View style={styles.mealMacro}>
          <Text style={styles.mealMacroValue}>{meal.fiber}g</Text>
          <Text style={styles.mealMacroLabel}>Fiber</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function Nutrition() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [waterIntake, setWaterIntake] = useState(mockNutritionData.today.water.current);
  const [quickAddCalories, setQuickAddCalories] = useState('');

  const { today, meals, weeklyProgress, insights } = mockNutritionData;

  const addWater = (amount: number) => {
    setWaterIntake(prev => Math.min(prev + amount, today.water.target));
  };

  const handleQuickAdd = () => {
    if (quickAddCalories) {
      // Add quick calories logic here
      setQuickAddCalories('');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Nutrition Tracker</Text>
          <Text style={styles.headerSubtitle}>
            {today.calories.current} / {today.calories.target} calories today
          </Text>
        </View>
        <TouchableOpacity style={styles.calendarButton}>
          <Calendar size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Daily Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={20} color={colors.primary[500]} />
          <Text style={styles.sectionTitle}>Today's Progress</Text>
        </View>
        
        <View style={styles.caloriesOverview}>
          <CircularProgress
            percentage={today.calories.percentage}
            size={120}
            strokeWidth={8}
            color={colors.primary[500]}
          >
            <View style={styles.caloriesContent}>
              <Text style={styles.caloriesCurrent}>{today.calories.current}</Text>
              <Text style={styles.caloriesLabel}>calories</Text>
              <Text style={styles.caloriesRemaining}>
                {today.calories.target - today.calories.current} left
              </Text>
            </View>
          </CircularProgress>
          
          <View style={styles.macrosGrid}>
            <MacroCard
              title="Protein"
              current={today.protein.current}
              target={today.protein.target}
              unit="g"
              color={colors.secondary[500]}
              percentage={today.protein.percentage}
            />
            <MacroCard
              title="Carbs"
              current={today.carbs.current}
              target={today.carbs.target}
              unit="g"
              color={colors.accent[500]}
              percentage={today.carbs.percentage}
            />
            <MacroCard
              title="Fat"
              current={today.fat.current}
              target={today.fat.target}
              unit="g"
              color={colors.error[500]}
              percentage={today.fat.percentage}
            />
            <MacroCard
              title="Fiber"
              current={today.fiber.current}
              target={today.fiber.target}
              unit="g"
              color={colors.success[500]}
              percentage={today.fiber.percentage}
            />
          </View>
        </View>
      </View>

      {/* Water Intake */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Droplets size={20} color={colors.accent[500]} />
          <Text style={styles.sectionTitle}>Water Intake</Text>
        </View>
        
        <View style={styles.waterContainer}>
          <View style={styles.waterProgress}>
            <CircularProgress
              percentage={today.water.percentage}
              size={80}
              strokeWidth={6}
              color={colors.accent[500]}
            >
              <Droplets size={24} color={colors.accent[500]} />
            </CircularProgress>
            
            <View style={styles.waterInfo}>
              <Text style={styles.waterCurrent}>{waterIntake} ml</Text>
              <Text style={styles.waterTarget}>/ {today.water.target} ml</Text>
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

      {/* Quick Add */}
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

      {/* Today's Meals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Clock size={20} color={colors.secondary[500]} />
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <TouchableOpacity style={styles.sectionAction}>
            <Plus size={16} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.mealsContainer}>
          {meals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              onPress={() => console.log('Meal pressed:', meal.name)}
            />
          ))}
        </View>
      </View>

      {/* Weekly Progress */}
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

      {/* Insights */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Award size={20} color={colors.warning[500]} />
          <Text style={styles.sectionTitle}>Insights & Tips</Text>
        </View>
        
        <View style={styles.insightsContainer}>
          {insights.map((insight, index) => {
            const getInsightColors = (type: string) => {
              switch (type) {
                case 'success':
                  return { bg: colors.success[50], border: colors.success[200], text: colors.success[700] };
                case 'warning':
                  return { bg: colors.warning[50], border: colors.warning[200], text: colors.warning[700] };
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
          })}
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
});