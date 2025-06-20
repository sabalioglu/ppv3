import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  AlertTriangle,
  Target,
  Award,
  ChevronRight,
  LogOut,
  User,
  Activity,
  Heart,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows, gradients } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

// Nutrition calculation helpers
const calculateBMR = (age: number, gender: string, height: number, weight: number): number => {
  // Mifflin-St Jeor Equation
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

  // Adjust based on goals
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
    protein: Math.round((calories * proteinRatio) / 4), // 4 cal per gram
    carbs: Math.round((calories * carbRatio) / 4), // 4 cal per gram
    fat: Math.round((calories * fatRatio) / 9), // 9 cal per gram
  };
};

// Components
const StatCard = ({ title, current, target, color, unit }: any) => {
  const percentage = Math.min((current / target) * 100, 100);
  
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
          <Text style={styles.profileLabel}>BMR</Text>
          <Text style={styles.profileValue}>{Math.round(bmr)} cal</Text>
        </View>
      </View>
      
      <View style={styles.tdeeContainer}>
        <Text style={styles.tdeeLabel}>Daily Calorie Target (TDEE)</Text>
        <Text style={styles.tdeeValue}>{tdee} calories</Text>
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
  const [todaysIntake, setTodaysIntake] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

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
        // Fetch complete profile
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
          
          // Calculate nutrition targets based on profile
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
          
          // Load today's intake (will be implemented with nutrition logs)
          loadTodaysIntake(user.id);
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
    // For now, using mock data
    // TODO: Implement real nutrition log fetching
    const mockIntake = {
      calories: Math.floor(Math.random() * 1000) + 800,
      protein: Math.floor(Math.random() * 60) + 40,
      carbs: Math.floor(Math.random() * 150) + 100,
      fat: Math.floor(Math.random() * 40) + 30,
    };
    setTodaysIntake(mockIntake);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                Alert.alert('Logout Error', error.message);
              }
            } catch (error: any) {
              Alert.alert('Logout Error', 'An error occurred during logout');
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const getHealthInsights = () => {
    const insights = [];
    
    // Calorie insight
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

    // Protein insight
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

    // Activity insight based on profile
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
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Dynamic Greeting */}
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
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Profile Summary (if profile complete) */}
      {userProfile && userProfile.age && (
        <View style={styles.section}>
          <ProfileSummaryCard profile={userProfile} />
        </View>
      )}

      {/* Today's Progress */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Today's Progress</Text>
        </View>
        
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
      </View>

      {/* Personalized Insights */}
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

      {/* Quick Actions */}
      <View style={[styles.section, { marginBottom: 100 }]}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#10b98120' }]}>
              <Target size={24} color="#10b981" />
            </View>
            <Text style={styles.quickActionText}>Log Food</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#f5931920' }]}>
              <AlertTriangle size={24} color="#f59319" />
            </View>
            <Text style={styles.quickActionText}>Add Item</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#6366f120' }]}>
              <Award size={24} color="#6366f1" />
            </View>
            <Text style={styles.quickActionText}>Recipes</Text>
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
  logoutButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
});
