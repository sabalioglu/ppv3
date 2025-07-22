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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TriangleAlert as AlertTriangle, Target, Award, ChevronRight, User, Activity, Heart, Coffee, Plus } from 'lucide-react-native';
import { colors, spacing, typography, shadows, gradients } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { StyledText, H1, H2, H3, H5, BodyRegular, BodySmall, Caption } from '@/components/common/StyledText';
import { AppHeader } from '@/components/common/AppHeader';

const { width } = Dimensions.get('window');

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
      <H3 color={colors.textPrimary}>{title}</H3>
      <BodyRegular color={colors.textSecondary} style={styles.emptyMessage}>{message}</BodyRegular>
      {actionText && onAction && (
        <TouchableOpacity style={styles.emptyAction} onPress={onAction}>
          <StyledText variant="button" color={colors.neutral[0]}>{actionText}</StyledText>
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
        <Caption color={color}>{title}</Caption>
        <TrendingUp size={16} color={color} />
      </View>
      
      <View style={styles.statContent}>
        <H3 color={theme.colors.textPrimary}>{current}</H3>
        <BodySmall color={theme.colors.textSecondary}>/ {target} {unit}</BodySmall>
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
        <StyledText variant="bodyRegular" weight="semibold" color={theme.colors.textPrimary}>{title}</StyledText>
        <BodySmall color={theme.colors.textSecondary}>{description}</BodySmall>
        {value && <BodySmall weight="semibold" color={getColor()}>{value}</BodySmall>}
      </View>
      <ChevronRight size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

const ProfileSummaryCard = ({ profile }: any) => {
  const bmr = calculateBMR(profile.age, profile.gender, profile.height_cm, profile.weight_kg);
  const tdee = calculateDailyCalories(bmr, profile.activity_level);
  
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <User size={20} color={colors.primary} />
        <StyledText variant="bodyRegular" weight="semibold" color={theme.colors.textPrimary}>Your Profile Summary</StyledText>
      </View>
      
      <View style={styles.profileGrid}>
        <View style={styles.profileItem}>
          <Caption color={theme.colors.textSecondary}>Age</Caption>
          <StyledText variant="bodyRegular" weight="semibold" color={theme.colors.textPrimary}>{profile.age} years</StyledText>
        </View>
        <View style={styles.profileItem}>
          <Caption color={theme.colors.textSecondary}>Height</Caption>
          <StyledText variant="bodyRegular" weight="semibold" color={theme.colors.textPrimary}>{profile.height_cm} cm</StyledText>
        </View>
        <View style={styles.profileItem}>
          <Caption color={theme.colors.textSecondary}>Weight</Caption>
          <StyledText variant="bodyRegular" weight="semibold" color={theme.colors.textPrimary}>{profile.weight_kg} kg</StyledText>
        </View>
        <View style={styles.profileItem}>
          <Caption color={theme.colors.textSecondary}>BMR</Caption>
          <StyledText variant="bodyRegular" weight="semibold" color={theme.colors.textPrimary}>{Math.round(bmr)} cal</StyledText>
        </View>
      </View>
      
      <View style={styles.tdeeContainer}>
        <BodySmall color={theme.colors.textSecondary}>Daily Calorie Target (TDEE)</BodySmall>
        <H3 weight="bold" color="#10b981">{tdee} calories</H3>
      </View>
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

  // TEMİZLENDİ: Mock Data Kaldırıldı - Gerçek Supabase Entegrasyonu
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
      } else {
        setTodaysIntake({ calories: 0, protein: 0, carbs: 0, fat: 0 });
        setHasNutritionData(false);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <BodyRegular color={colors.textSecondary} style={styles.loadingText}>Loading your dashboard...</BodyRegular>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <H2 color="white">
              {greeting}, {userName}!
            </H2>
            <BodyRegular color="rgba(255, 255, 255, 0.8)">
              {userProfile?.health_goals?.includes('weight_loss') 
                ? "Let's achieve your weight loss goals"
                : userProfile?.health_goals?.includes('muscle_gain')
                ? "Time to build those muscles"
                : "Let's track your nutrition goals"}
            </BodyRegular>
          </View>
        </View>
      </LinearGradient>

      {/* Profile Summary */}
      {userProfile && userProfile.age && (
        <View style={styles.section}>
          <ProfileSummaryCard profile={userProfile} />
        </View>
      )}

      {/* Today's Progress - MOCK DATA TEMİZLENDİ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={20} color={colors.primary} />
          <StyledText variant="h5" weight="semibold" color={colors.textPrimary} style={styles.sectionTitle}>Today's Progress</StyledText>
        </View>
        
        {hasNutritionData ? (
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
        ) : (
          <EmptyState
            icon={Coffee}
            title="No nutrition data logged today"
            message="Start tracking your meals to see your progress here"
            actionText="Log your first meal"
            onAction={() => router.push('/(tabs)/nutrition')}
          />
        )}
      </View>

      {/* Insights - SADECE VERİ VARSA GÖSTER */}
      {hasNutritionData && getHealthInsights().length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={colors.primary} />
            <StyledText variant="h5" weight="semibold" color={colors.textPrimary} style={styles.sectionTitle}>Your Insights</StyledText>
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
        <H5 weight="semibold" color={colors.textPrimary}>Quick Actions</H5>
        
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/nutrition')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#10b98120' }]}>
              <Target size={24} color="#10b981" />
            </View>
            <BodySmall weight="medium" color={colors.textPrimary}>Log Food</BodySmall>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/pantry')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#f5931920' }]}>
              <Plus size={24} color="#f59319" />
            </View>
            <BodySmall weight="medium" color={colors.textPrimary}>Add Item</BodySmall>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/recipes')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#6366f120' }]}>
              <Award size={24} color="#6366f1" />
            </View>
            <BodySmall weight="medium" color={colors.textPrimary}>Recipes</BodySmall>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

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
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
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
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  profileItem: {
    width: '50%',
    paddingVertical: spacing.sm,
  },
  tdeeContainer: {
    backgroundColor: '#10b98110',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
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
  statContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
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
  emptyMessage: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyAction: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
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
});