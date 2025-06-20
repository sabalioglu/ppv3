import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  TrendingUp,
  AlertTriangle,
  Target,
  Award,
  Plus,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows, gradients } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

// Mock data - replace with real data from Supabase
const mockData = {
  todayNutrition: {
    calories: { current: 1850, target: 2200 },
    protein: { current: 85, target: 120 },
    carbs: { current: 180, target: 275 },
    fat: { current: 75, target: 85 },
  },
  expiringItems: [
    { name: 'Greek Yogurt', daysLeft: 2, category: 'Dairy' },
    { name: 'Baby Spinach', daysLeft: 3, category: 'Vegetables' },
    { name: 'Chicken Breast', daysLeft: 1, category: 'Proteins' },
  ],
  todaysMeals: [
    { type: 'Breakfast', name: 'Overnight Oats with Berries', calories: 420 },
    { type: 'Lunch', name: 'Grilled Chicken Salad', calories: 580 },
    { type: 'Snack', name: 'Apple with Almonds', calories: 190 },
  ],
  achievements: [
    { name: 'Nutrition Goal Streak', current: 7, target: 7, completed: true },
    { name: 'Zero Waste Week', current: 6, target: 7, completed: false },
    { name: 'Recipe Explorer', current: 3, target: 5, completed: false },
  ],
  insights: [
    {
      type: 'success',
      title: 'Great Progress!',
      message: 'You\'re 84% towards your daily calorie goal.',
    },
    {
      type: 'warning',
      title: 'Low Fiber',
      message: 'Consider adding more vegetables to reach your fiber goal.',
    },
  ],
};

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size,
  strokeWidth,
  color,
  backgroundColor = colors.neutral[200],
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
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
    </View>
  );
};

interface StatCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  current,
  target,
  unit,
  color,
  icon,
}) => {
  const progress = Math.min((current / target) * 100, 100);

  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={styles.statIcon}>
          {icon}
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <View style={styles.statContent}>
        <ProgressRing
          progress={progress}
          size={60}
          strokeWidth={4}
          color={color}
        />
        <View style={styles.statNumbers}>
          <Text style={styles.statCurrent}>{current}</Text>
          <Text style={styles.statTarget}>/ {target} {unit}</Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

interface InsightCardProps {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ type, title, message }) => {
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

  const insightColors = getInsightColors(type);

  return (
    <View style={[styles.insightCard, { backgroundColor: insightColors.bg, borderColor: insightColors.border }]}>
      <Text style={[styles.insightTitle, { color: insightColors.text }]}>{title}</Text>
      <Text style={styles.insightMessage}>{message}</Text>
    </View>
  );
};

export default function Dashboard() {
  const [greeting, setGreeting] = useState('');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Greeting setup based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // ✨ USER DATA FETCH
    const fetchUserData = async () => {
      try {
        console.log('📊 Dashboard: Fetching user data...');
        
        // Current user'ı al
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        console.log('✅ Dashboard: User fetched:', user?.email);
        setUser(user);

        // User profile'ı al (daha detaylı bilgi için)
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();
          
          if (!profileError && profile) {
            console.log('✅ Dashboard: Profile fetched:', profile.full_name);
            setUserProfile(profile);
          } else {
            console.log('⚠️ Dashboard: Profile not found, using user email');
          }
        }
      } catch (error) {
        console.error('❌ Dashboard: Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // ✨ LOGOUT FUNCTION
  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Dashboard: Logging out...');
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              
              console.log('✅ Dashboard: Logout successful');
              
              // Web'de sayfa yenileme (clean transition için)
              if (typeof window !== 'undefined') {
                setTimeout(() => {
                  window.location.reload();
                }, 300);
              }
            } catch (error) {
              console.error('❌ Dashboard: Logout error:', error);
              Alert.alert('Logout Error', 'An error occurred during logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  // ✨ PERSONALIZED GREETING LOGIC
  const getPersonalizedGreeting = () => {
    let name = 'there'; // Default fallback
    
    if (userProfile?.full_name) {
      // Profile'dan tam isim varsa, ilk kelimeyi al
      name = userProfile.full_name.split(' ')[0];
    } else if (user?.email) {
      // Email'den isim çıkar (@ işaretinden önceki kısım)
      name = user.email.split('@')[0];
      // İlk harfi büyük yap
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    return `${greeting}, ${name}!`;
  };

  const { todayNutrition, expiringItems, todaysMeals, achievements, insights } = mockData;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ✨ PERSONALIZED HEADER WITH LOGOUT */}
      <LinearGradient colors={gradients.health} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>{getPersonalizedGreeting()}</Text>
            <Text style={styles.subtitle}>Let's track your nutrition goals</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.addButton}>
              <Plus size={24} color={colors.neutral[0]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color={colors.neutral[0]} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Today's Nutrition Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Today's Progress</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Calories"
              current={todayNutrition.calories.current}
              target={todayNutrition.calories.target}
              unit="kcal"
              color={colors.primary[500]}
              icon={<TrendingUp size={16} color={colors.primary[500]} />}
            />
            <StatCard
              title="Protein"
              current={todayNutrition.protein.current}
              target={todayNutrition.protein.target}
              unit="g"
              color={colors.secondary[500]}
              icon={<TrendingUp size={16} color={colors.secondary[500]} />}
            />
            <StatCard
              title="Carbs"
              current={todayNutrition.carbs.current}
              target={todayNutrition.carbs.target}
              unit="g"
              color={colors.accent[500]}
              icon={<TrendingUp size={16} color={colors.accent[500]} />}
            />
            <StatCard
              title="Fat"
              current={todayNutrition.fat.current}
              target={todayNutrition.fat.target}
              unit="g"
              color={colors.error[500]}
              icon={<TrendingUp size={16} color={colors.error[500]} />}
            />
          </View>
        </View>

        {/* Expiring Items Alert */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color={colors.warning[500]} />
            <Text style={styles.sectionTitle}>Expiring Soon</Text>
            <TouchableOpacity style={styles.sectionAction}>
              <ChevronRight size={16} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>
          <View style={styles.expiringContainer}>
            {expiringItems.map((item, index) => (
              <View key={index} style={styles.expiringItem}>
                <View style={styles.expiringInfo}>
                  <Text style={styles.expiringName}>{item.name}</Text>
                  <Text style={styles.expiringCategory}>{item.category}</Text>
                </View>
                <View style={[styles.expiringBadge, item.daysLeft <= 1 && styles.expiringUrgent]}>
                  <Text style={[styles.expiringDays, item.daysLeft <= 1 && styles.expiringDaysUrgent]}>
                    {item.daysLeft}d
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Today's Meals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={colors.accent[500]} />
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <TouchableOpacity style={styles.sectionAction}>
              <ChevronRight size={16} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>
          <View style={styles.mealsContainer}>
            {todaysMeals.map((meal, index) => (
              <View key={index} style={styles.mealItem}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealType}>{meal.type}</Text>
                  <Text style={styles.mealName}>{meal.name}</Text>
                </View>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color={colors.secondary[500]} />
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity style={styles.sectionAction}>
              <ChevronRight size={16} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>
          <View style={styles.achievementsContainer}>
            {achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementProgress}>
                    {achievement.current}/{achievement.target}
                  </Text>
                </View>
                <View style={styles.achievementProgressBar}>
                  <View
                    style={[
                      styles.achievementProgressFill,
                      {
                        width: `${(achievement.current / achievement.target) * 100}%`,
                        backgroundColor: achievement.completed ? colors.success[500] : colors.neutral[300],
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights & Tips</Text>
          <View style={styles.insightsContainer}>
            {insights.map((insight, index) => (
              <InsightCard
                key={index}
                type={insight.type as 'success' | 'warning' | 'info'}
                title={insight.title}
                message={insight.message}
              />
            ))}
          </View>
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
    paddingTop: 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[0],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[100],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
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
    padding: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  statCard: {
    width: (width - spacing.lg * 2 - spacing.xs * 2) / 2,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.md,
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing.md,
    ...shadows.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIcon: {
    marginRight: spacing.xs,
  },
  statTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[600],
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statNumbers: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  statCurrent: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[800],
  },
  statTarget: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  expiringContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing.md,
    ...shadows.md,
  },
  expiringItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  expiringInfo: {
    flex: 1,
  },
  expiringName: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[800],
  },
  expiringCategory: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
  },
  expiringBadge: {
    backgroundColor: colors.warning[100],
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  expiringUrgent: {
    backgroundColor: colors.error[100],
  },
  expiringDays: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Bold',
    color: colors.warning[700],
  },
  expiringDaysUrgent: {
    color: colors.error[700],
  },
  mealsContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing.md,
    ...shadows.md,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.accent[600],
  },
  mealName: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[800],
  },
  mealCalories: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Bold',
    color: colors.neutral[600],
  },
  achievementsContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing.md,
    ...shadows.md,
  },
  achievementItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  achievementInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  achievementName: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[800],
  },
  achievementProgress: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Bold',
    color: colors.neutral[600],
  },
  achievementProgressBar: {
    height: 6,
    backgroundColor: colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 3,
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
