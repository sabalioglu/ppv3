// app/ai-meal-plan.tsx - AI Meal Planner (Coming Soon Version)
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Settings,
  ChevronRight,
  Heart,
  ShoppingCart,
  ShieldCheck,
  Calendar,
  RefreshCw,
  Sparkles,
  Flame,
} from 'lucide-react-native';
import { spacing, radius, fonts } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import type { Colors } from '@/lib/theme/index';
import { Display, Eyebrow } from '@/components/UI/Display';
import { RecipeListCard } from '@/components/UI/RecipeCard';
import { SectionHeader } from '@/components/UI/SectionHeader';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { useMealPlanStore, useMealPlanAutoLoad } from '@/lib/meal-plan/store';

// ✅ DÜZELTME: types.ts'den import (api-clients/types değil)
import type {
  Meal,
  PantryItem,
  MealPlan,
  UserProfile,
} from '@/lib/meal-plan/types';

// ✅ DÜZELTME: PantryMetrics ve MealLoadingStates için ayrı tanımlama
interface PantryMetrics {
  totalItems: number;
  expiringItems: number;
  expiredItems: number;
  categories: Record<string, number>;
}

interface MealLoadingStates {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  snacks: boolean;
  initial: boolean;
}

// ✅ NEW: Enhanced meal plan interface
interface EnhancedMealPlanSummary {
  totalDiversityScore: number;
  totalPersonalizationScore: number;
  pantryUtilization: number;
  generationMethods: string[];
  insights?: {
    diversityTips: string[];
    personalizationAdaptations: string[];
    nextSuggestions: string[];
  };
}

// ✅ Utility imports düzeltildi
import {
  calculatePantryMetrics,
  generatePantryInsights,
} from '@/lib/meal-plan/pantry-analysis';

// ✅ Enhanced AI generation imports
import {
  generateAIMeal,
  generateAIMealWithQualityControl,
  calculateAverageMatchScore,
} from '@/lib/meal-plan/api-clients/ai-generation';

import { generateFallbackPlan } from '@/lib/meal-plan/utils';

// ✅ NEW: Enhanced generation imports
import {
  createEnhancedGenerator,
  generateEnhancedMealPlan,
} from '@/lib/meal-plan/enhanced-ai-generation';
import { createDiversityManager } from '@/lib/meal-plan/enhanced-diversity';
import { createPersonalizedGenerator } from '@/lib/meal-plan/personalized-generation';

// Insight group — Eyebrow kicker + bulleted tips
const InsightGroup = ({
  label,
  accent,
  items,
  colors,
}: {
  label: string;
  accent: string;
  items: string[];
  colors: Colors;
}) => {
  if (!items || items.length === 0) return null;
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Eyebrow color={accent} style={{ marginBottom: 8 }}>
        {label}
      </Eyebrow>
      {items.map((tip, index) => (
        <View
          key={index}
          style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}
        >
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: accent,
              marginTop: 7,
            }}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              fontFamily: fonts.body,
              lineHeight: 20,
              color: colors.textSecondary,
            }}
          >
            {tip}
          </Text>
        </View>
      ))}
    </View>
  );
};

// ✅ Enhanced insights modal
const EnhancedInsightsModal = ({ visible, onClose, insights, colors }: any) => {
  if (!visible || !insights) return null;

  return (
    <View style={overlayStyles.overlay}>
      <View
        style={[
          overlayStyles.sheet,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
        <View style={overlayStyles.sheetHeader}>
          <Eyebrow>{t('mealPlan.insightsKicker')}</Eyebrow>
          <Display size="md" style={{ marginTop: 4 }}>
            {t('mealPlan.insightsTitle')}
          </Display>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 360 }}
        >
          <InsightGroup
            label={t('mealPlan.diversityTips')}
            accent={colors.primary}
            items={insights.diversityTips}
            colors={colors}
          />
          <InsightGroup
            label={t('mealPlan.personalTouches')}
            accent={colors.secondary}
            items={(insights.personalizationAdaptations || []).slice(0, 3)}
            colors={colors}
          />
          <InsightGroup
            label={t('mealPlan.upNext')}
            accent={colors.accent}
            items={(insights.nextSuggestions || []).slice(0, 2)}
            colors={colors}
          />
        </ScrollView>

        <TouchableOpacity
          style={[
            overlayStyles.primaryBtn,
            { backgroundColor: colors.primary },
          ]}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={overlayStyles.primaryBtnText}>
            {t('mealPlan.gotIt')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MealDetailModal = ({
  visible,
  onClose,
  meal,
  onViewRecipe,
  colors,
}: any) => {
  if (!visible || !meal) return null;
  return (
    <View style={overlayStyles.overlay}>
      <View
        style={[
          overlayStyles.sheet,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
        <Eyebrow>{meal.category || t('mealPlan.recipeFallback')}</Eyebrow>
        <Display size="lg" style={{ marginTop: 4, marginBottom: 8 }}>
          {meal.name}
        </Display>
        <View style={overlayStyles.metaRow}>
          <View style={overlayStyles.metaItem}>
            <Flame size={14} color={colors.accent} />
            <Text
              style={[overlayStyles.metaText, { color: colors.textSecondary }]}
            >
              {t('mealPlan.kcal', { count: meal.calories })}
            </Text>
          </View>
          <Text
            style={[overlayStyles.metaText, { color: colors.textSecondary }]}
          >
            {t('mealPlan.proteinGrams', { count: meal.protein })}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            overlayStyles.primaryBtn,
            { backgroundColor: colors.primary },
          ]}
          onPress={() => onViewRecipe && onViewRecipe(meal)}
          activeOpacity={0.85}
        >
          <Text style={overlayStyles.primaryBtnText}>
            {t('mealPlan.viewRecipe')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[overlayStyles.ghostBtn, { borderColor: colors.border }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text
            style={[
              overlayStyles.ghostBtnText,
              { color: colors.textSecondary },
            ]}
          >
            {t('common.close')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MealCard = ({
  meal,
  mealType,
  mealKey,
  onPress,
  onRegenerate,
  isRegenerating,
  colors,
}: any) => (
  <TouchableOpacity
    style={[
      cardStyles.mealCard,
      { backgroundColor: colors.surface, borderColor: colors.borderLight },
    ]}
    onPress={() => onPress && onPress(meal)}
    activeOpacity={0.85}
  >
    <View style={cardStyles.mealCardRow}>
      <View style={{ flex: 1, gap: 4 }}>
        <Eyebrow color={colors.textSecondary}>{mealType}</Eyebrow>
        <Display size="sm" color={colors.textPrimary} numberOfLines={2}>
          {meal.name}
        </Display>
        <View style={overlayStyles.metaRow}>
          <View style={overlayStyles.metaItem}>
            <Flame size={13} color={colors.accent} />
            <Text
              style={[cardStyles.metaText, { color: colors.textSecondary }]}
            >
              {t('mealPlan.kcal', { count: meal.calories })}
            </Text>
          </View>
          <Text style={[cardStyles.metaText, { color: colors.textSecondary }]}>
            {t('mealPlan.proteinGrams', { count: meal.protein })}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          cardStyles.regenBtn,
          { backgroundColor: colors.primary + '14' },
        ]}
        onPress={() => onRegenerate && onRegenerate(mealKey)}
        disabled={isRegenerating}
      >
        {isRegenerating ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <RefreshCw size={16} color={colors.primary} />
        )}
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

function scoreColor(value: number, colors: Colors) {
  if (value >= 80) return colors.secondary;
  if (value >= 60) return colors.accent;
  return colors.error;
}

const MealPlanSummary = ({ plan, enhancedSummary, colors }: any) => (
  <View
    style={[
      cardStyles.summaryCard,
      { backgroundColor: colors.surface, borderColor: colors.borderLight },
    ]}
  >
    <Display
      size="md"
      color={colors.textPrimary}
      style={{ marginBottom: spacing.md }}
    >
      {t('mealPlan.todaySummary')}
    </Display>

    {/* ✅ Basic stats */}
    <View style={cardStyles.statsRow}>
      <View style={cardStyles.stat}>
        <Display size="lg" color={colors.primary}>
          {plan.totalCalories}
        </Display>
        <Eyebrow color={colors.textSecondary} style={cardStyles.statLabel}>
          {t('mealPlan.statCalories')}
        </Eyebrow>
      </View>
      <View style={cardStyles.stat}>
        <Display size="lg" color={colors.secondary}>
          {plan.totalProtein}g
        </Display>
        <Eyebrow color={colors.textSecondary} style={cardStyles.statLabel}>
          {t('mealPlan.statProtein')}
        </Eyebrow>
      </View>
      <View style={cardStyles.stat}>
        <Display size="lg" color={colors.accent}>
          {Math.round(plan.optimizationScore)}
        </Display>
        <Eyebrow color={colors.textSecondary} style={cardStyles.statLabel}>
          {t('mealPlan.statMatch')}
        </Eyebrow>
      </View>
    </View>

    {/* ✅ Enhanced stats if available */}
    {enhancedSummary && (
      <View
        style={[
          cardStyles.enhancedBlock,
          { borderTopColor: colors.borderLight },
        ]}
      >
        <View style={cardStyles.statsRow}>
          <View style={cardStyles.stat}>
            <Display
              size="sm"
              color={scoreColor(enhancedSummary.totalDiversityScore, colors)}
            >
              {enhancedSummary.totalDiversityScore}%
            </Display>
            <Eyebrow color={colors.textSecondary} style={cardStyles.statLabel}>
              {t('mealPlan.statDiversity')}
            </Eyebrow>
          </View>
          <View style={cardStyles.stat}>
            <Display
              size="sm"
              color={scoreColor(
                enhancedSummary.totalPersonalizationScore,
                colors,
              )}
            >
              {enhancedSummary.totalPersonalizationScore}%
            </Display>
            <Eyebrow color={colors.textSecondary} style={cardStyles.statLabel}>
              {t('mealPlan.statPersonal')}
            </Eyebrow>
          </View>
          <View style={cardStyles.stat}>
            <Display
              size="sm"
              color={scoreColor(enhancedSummary.pantryUtilization, colors)}
            >
              {enhancedSummary.pantryUtilization}%
            </Display>
            <Eyebrow color={colors.textSecondary} style={cardStyles.statLabel}>
              {t('mealPlan.statPantryUse')}
            </Eyebrow>
          </View>
        </View>

        {/* Generation methods indicator */}
        <View style={cardStyles.methodRow}>
          <View
            style={[
              cardStyles.methodPill,
              { backgroundColor: colors.accent + '1A' },
            ]}
          >
            <Sparkles size={12} color={colors.accent} />
            <Text style={[cardStyles.methodText, { color: colors.accent }]}>
              {enhancedSummary.generationMethods.includes('personalized')
                ? t('mealPlan.methodPersonalized')
                : t('mealPlan.methodEnhanced')}
            </Text>
          </View>
        </View>
      </View>
    )}
  </View>
);

const VIEW_MODES: { key: 'daily' | 'weekly' | 'monthly'; labelKey: string }[] =
  [
    { key: 'daily', labelKey: 'mealPlan.viewDaily' },
    { key: 'weekly', labelKey: 'mealPlan.viewWeekly' },
    { key: 'monthly', labelKey: 'mealPlan.viewMonthly' },
  ];

const ViewModeTabs = ({ viewMode, onViewModeChange, colors }: any) => (
  <View style={[cardStyles.tabBar, { backgroundColor: colors.surfaceVariant }]}>
    {VIEW_MODES.map(({ key, labelKey }) => {
      const active = viewMode === key;
      return (
        <TouchableOpacity
          key={key}
          style={[
            cardStyles.tab,
            active && { backgroundColor: colors.surface },
          ]}
          onPress={() => onViewModeChange(key)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              cardStyles.tabText,
              { color: active ? colors.primary : colors.textSecondary },
            ]}
          >
            {t(labelKey)}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default function AIMealPlan() {
  const router = useRouter();
  const { colors } = useTheme();

  // ✅ CRITICAL: Use the store hooks properly
  const isStoreLoaded = useMealPlanAutoLoad();
  const {
    currentMealPlan,
    setCurrentMealPlan,
    aiMeals,
    setAIMeal,
    loadingError,
  } = useMealPlanStore();

  // ✅ Enhanced loading states for individual meals
  const [loadingStates, setLoadingStates] = useState<MealLoadingStates>({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: false,
    initial: true,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>(
    'daily',
  );

  // ✅ NEW: Enhanced meal plan state
  const [enhancedPlanSummary, setEnhancedPlanSummary] =
    useState<EnhancedMealPlanSummary | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  // Modal states
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Pantry health metrics
  const [pantryMetrics, setPantryMetrics] = useState<PantryMetrics>({
    totalItems: 0,
    expiringItems: 0,
    expiredItems: 0,
    categories: {},
  });

  // ✅ Regeneration tracking
  const [regenerationAttempts, setRegenerationAttempts] = useState<{
    [key: string]: number;
  }>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snacks: 0,
  });

  // ✅ CRITICAL: Use currentMealPlan from store when available
  useEffect(() => {
    if (currentMealPlan && isStoreLoaded) {
      setMealPlan(currentMealPlan);
      console.log('✅ Meal plan loaded from store');
    }
  }, [currentMealPlan, isStoreLoaded]);

  useEffect(() => {
    loadAllData();
  }, []);

  // Real-time pantry updates listener
  useEffect(() => {
    const subscription = supabase
      .channel('pantry_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pantry_items' },
        (payload) => {
          console.log('Pantry updated:', payload);
          loadAllData();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadAllData = async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, initial: true }));
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let userProfileData: UserProfile = {
        id: user.id,
        dietary_restrictions: [],
        dietary_preferences: ['balanced'],
      };

      // Load user profile with error handling
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profile) {
          userProfileData = profile;
        }

        setUserProfile(userProfileData);
      } catch (profileError) {
        console.error('Profile error:', profileError);
        setUserProfile(userProfileData);
      }

      // Load pantry items with error handling
      try {
        const { data: pantry, error: pantryError } = await supabase
          .from('pantry_items')
          .select('*')
          .eq('user_id', user.id)
          .order('expiry_date', { ascending: true });

        if (pantryError) {
          throw pantryError;
        }

        const validPantryItems = pantry || [];
        setPantryItems(validPantryItems);

        // Calculate metrics
        const metrics = calculatePantryMetrics(validPantryItems);
        setPantryMetrics(metrics);

        // ✅ Generate AI meal plan if not already loaded from store
        if (!currentMealPlan) {
          await generateInitialMealPlan(validPantryItems, userProfileData);
        }
      } catch (pantryError) {
        console.error('Pantry error:', pantryError);

        // Use empty pantry as fallback
        setPantryItems([]);
        setPantryMetrics({
          totalItems: 0,
          expiringItems: 0,
          expiredItems: 0,
          categories: {},
        });
        if (!currentMealPlan) {
          const fallbackPlan = generateFallbackPlan();
          await setCurrentMealPlan(fallbackPlan);
          setMealPlan(fallbackPlan);
        }
      }

      setLoadingStates((prev) => ({ ...prev, initial: false }));
      setRefreshing(false);
    } catch (error) {
      console.error('Load data error:', error);
      setLoadingStates((prev) => ({ ...prev, initial: false }));
      setRefreshing(false);
    }
  };

  // ✅ ENHANCED: Generate initial AI meal plan with diversity and personalization
  const generateInitialMealPlan = async (
    pantryItems: PantryItem[],
    userProfile: UserProfile | null,
  ) => {
    try {
      if (pantryItems.length < 3) {
        console.log('⚠️ Insufficient pantry items, using fallback...');
        const fallbackPlan = generateFallbackPlan(pantryItems);
        await setCurrentMealPlan(fallbackPlan);
        setMealPlan(fallbackPlan);
        return;
      }

      console.log(
        '🌟 Generating enhanced AI meal plan with personalization and diversity...',
      );

      // ✅ Use enhanced generation system
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const enhancedResult = await generateEnhancedMealPlan(
        user.id,
        pantryItems,
        userProfile,
      );

      // Convert enhanced results to standard meal plan format
      const aiMeals = {
        breakfast: enhancedResult.breakfast?.meal || null,
        lunch: enhancedResult.lunch?.meal || null,
        dinner: enhancedResult.dinner?.meal || null,
        snacks: enhancedResult.snacks
          .map((s) => s.meal)
          .filter(Boolean) as Meal[],
      };

      const mealsForTotals = [
        aiMeals.breakfast,
        aiMeals.lunch,
        aiMeals.dinner,
      ].filter(Boolean) as Meal[];
      const totalCalories = mealsForTotals.reduce(
        (sum, meal) => sum + (meal.calories || 0),
        0,
      );
      const totalProtein = mealsForTotals.reduce(
        (sum, meal) => sum + (meal.protein || 0),
        0,
      );

      const plan: MealPlan = {
        daily: {
          ...aiMeals,
          totalCalories,
          totalProtein,
          optimizationScore: enhancedResult.summary.totalPersonalizationScore,
          generatedAt: new Date().toISOString(),
          regenerationHistory: {},
        },
      };

      // ✅ Store enhanced summary for insights
      setEnhancedPlanSummary({
        ...enhancedResult.summary,
        insights: {
          diversityTips: enhancedResult.breakfast?.insights.diversityTips || [],
          personalizationAdaptations: [
            ...(enhancedResult.breakfast?.insights.adaptations || []),
            ...(enhancedResult.lunch?.insights.adaptations || []),
            ...(enhancedResult.dinner?.insights.adaptations || []),
          ],
          nextSuggestions:
            enhancedResult.breakfast?.insights.nextSuggestions || [],
        },
      });

      // ✅ Save to store
      await setCurrentMealPlan(plan);
      setMealPlan(plan);

      console.log('✅ Enhanced AI meal plan generated successfully:', {
        diversityScore: enhancedResult.summary.totalDiversityScore,
        personalizationScore: enhancedResult.summary.totalPersonalizationScore,
        pantryUtilization: enhancedResult.summary.pantryUtilization,
        methods: enhancedResult.summary.generationMethods,
      });
    } catch (error) {
      console.error('Failed to generate enhanced AI meal plan:', error);
      console.log('🔄 Generating fallback meal plan...');

      // ✅ Enhanced fallback with basic diversity
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const generator = createEnhancedGenerator(user.id);
          const fallbackResult = await generator.generateEnhancedMeal(
            'lunch',
            pantryItems,
            userProfile,
            [],
            {
              allowFallback: true,
              maxAttempts: 1,
            },
          );

          const plan: MealPlan = {
            daily: {
              breakfast: null,
              lunch: fallbackResult.meal,
              dinner: null,
              snacks: [],
              totalCalories: fallbackResult.meal.calories,
              totalProtein: fallbackResult.meal.protein,
              optimizationScore: fallbackResult.personalizationScore,
              generatedAt: new Date().toISOString(),
              regenerationHistory: {},
            },
          };

          await setCurrentMealPlan(plan);
          setMealPlan(plan);
          return;
        }
      } catch (fallbackError) {
        console.error('Enhanced fallback also failed:', fallbackError);
      }

      // Final fallback
      const fallbackPlan = generateFallbackPlan(pantryItems);
      await setCurrentMealPlan(fallbackPlan);
      setMealPlan(fallbackPlan);
    }
  };

  // ✅ ENHANCED: Regenerate individual meal with diversity and personalization
  const regenerateMeal = async (
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
  ) => {
    if (!mealPlan || !userProfile) return;

    try {
      // Set loading state for this specific meal
      setLoadingStates((prev) => ({ ...prev, [mealType]: true }));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // ✅ Use enhanced generator for better variety and personalization
      const generator = createEnhancedGenerator(user.id);
      const existingMeals = Object.values(mealPlan.daily)
        .flat()
        .filter((meal) => meal && typeof meal === 'object') as Meal[];

      const enhancedResult = await generator.generateEnhancedMeal(
        mealType === 'snacks' ? 'snack' : mealType,
        pantryItems,
        userProfile,
        existingMeals,
        {
          prioritizeDiversity: true, // Focus on diversity for regeneration
          prioritizePersonalization: true,
          diversityThreshold: 60, // Lower threshold for regeneration
          maxAttempts: 2, // Faster regeneration
        },
      );

      const newMeal = enhancedResult.meal;

      // Update meal plan
      setMealPlan((prevPlan) => {
        if (!prevPlan) return prevPlan;

        const updatedDaily = { ...prevPlan.daily };

        if (mealType === 'snacks') {
          updatedDaily.snacks = [newMeal];
        } else {
          updatedDaily[mealType] = newMeal;
        }

        // Recalculate totals
        const totalCalories =
          (updatedDaily.breakfast?.calories || 0) +
          (updatedDaily.lunch?.calories || 0) +
          (updatedDaily.dinner?.calories || 0) +
          updatedDaily.snacks.reduce((sum, snack) => sum + snack.calories, 0);

        const totalProtein =
          (updatedDaily.breakfast?.protein || 0) +
          (updatedDaily.lunch?.protein || 0) +
          (updatedDaily.dinner?.protein || 0) +
          updatedDaily.snacks.reduce((sum, snack) => sum + snack.protein, 0);

        updatedDaily.totalCalories = totalCalories;
        updatedDaily.totalProtein = totalProtein;
        updatedDaily.optimizationScore = enhancedResult.personalizationScore;

        const updatedPlan = {
          ...prevPlan,
          daily: updatedDaily,
        };

        // ✅ Save to store using hook
        setCurrentMealPlan(updatedPlan);

        return updatedPlan;
      });

      // Update regeneration attempts
      setRegenerationAttempts((prev) => ({
        ...prev,
        [mealType]: prev[mealType] + 1,
      }));

      // ✅ Enhanced success message with insights
      const diversityInfo =
        enhancedResult.diversityScore > 80
          ? t('mealPlan.diversityGreat')
          : enhancedResult.diversityScore > 60
            ? t('mealPlan.diversityGood')
            : t('mealPlan.diversityMore');

      const generationInfo =
        enhancedResult.generationMethod === 'personalized'
          ? t('mealPlan.generationPersonalized')
          : t('mealPlan.generationCultural');

      Alert.alert(
        t('mealPlan.mealUpdatedTitle'),
        t('mealPlan.mealUpdatedMessage', {
          mealType,
          diversity: diversityInfo,
          generation: generationInfo,
        }),
        [
          {
            text: t('mealPlan.seeInsights'),
            onPress: () => setShowInsights(true),
          },
          {
            text: t('mealPlan.great'),
          },
        ],
      );
    } catch (error) {
      console.error(`Failed to regenerate ${mealType}:`, error);
      Alert.alert(
        t('mealPlan.generationFailedTitle'),
        t('mealPlan.generationFailedMessage'),
        [{ text: t('common.ok') }],
      );
    } finally {
      // Clear loading state
      setLoadingStates((prev) => ({ ...prev, [mealType]: false }));
    }
  };

  // ✅ ÇÖZÜM 1: Enhanced regenerate all meals
  const regenerateAllMeals = async () => {
    // Eğer modal açıksa kapatıp selectedMeal'ı temizle
    if (modalVisible) {
      setModalVisible(false);
      setSelectedMeal(null);
    }

    Alert.alert(
      t('mealPlan.regenerateAllTitle'),
      t('mealPlan.regenerateAllMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('mealPlan.regenerateAllConfirm'),
          style: 'default',
          onPress: async () => {
            // ✅ Reset any previous selection
            setSelectedMeal(null);

            setLoadingStates({
              breakfast: true,
              lunch: true,
              dinner: true,
              snacks: true,
              initial: false,
            });

            try {
              await generateInitialMealPlan(pantryItems, userProfile);

              // Reset regeneration attempts
              setRegenerationAttempts({
                breakfast: 0,
                lunch: 0,
                dinner: 0,
                snacks: 0,
              });

              Alert.alert(
                t('mealPlan.allMealsUpdatedTitle'),
                t('mealPlan.allMealsUpdatedMessage'),
                [{ text: t('mealPlan.awesome') }],
              );
            } catch (error) {
              console.error('Regenerate all meals error:', error);
              Alert.alert(
                t('mealPlan.generationFailedTitle'),
                t('mealPlan.regenerateAllFailedMessage'),
                [{ text: t('common.ok') }],
              );
            } finally {
              setLoadingStates({
                breakfast: false,
                lunch: false,
                dinner: false,
                snacks: false,
                initial: false,
              });
            }
          },
        },
      ],
    );
  };

  // Enhanced shopping list integration
  const handleAddToShoppingList = async (missingIngredients: string[]) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please log in to add items to shopping list');
      }

      if (!missingIngredients || missingIngredients.length === 0) {
        throw new Error('No ingredients to add');
      }

      const shoppingItems = missingIngredients.map((ingredient) => ({
        user_id: user.id,
        item_name: ingredient,
        category: 'general',
        quantity: 1,
        unit: 'unit',
        is_completed: false,
        priority: 'high',
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('shopping_list_items')
        .insert(shoppingItems);

      if (error) throw error;

      Alert.alert(
        t('common.success'),
        t('mealPlan.itemsAdded', { count: missingIngredients.length }),
        [
          {
            text: t('mealPlan.viewList'),
            onPress: () => router.push('/(tabs)/shopping-list'),
          },
          { text: t('common.ok') },
        ],
      );
    } catch (error) {
      console.error('Add to shopping list error:', error);
      Alert.alert(t('common.error'), t('mealPlan.addToShoppingFailed'));
    }
  };

  // Handle meal press
  const handleMealPress = (meal: Meal) => {
    setSelectedMeal(meal);
    setModalVisible(true);
  };

  // ✅ ÇÖZÜM 2: Navigate to recipe detail
  const navigateToRecipe = (meal: Meal) => {
    try {
      setModalVisible(false);
      setSelectedMeal(null); // ✅ Reset selected meal
      router.push(`/recipe/${meal.id}?source=meal_plan`);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(t('common.error'), t('mealPlan.navigateRecipeFailed'));
    }
  };

  // Add meal to nutrition log
  const addToNutritionLog = async (meal: Meal) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please log in to track nutrition');
      }

      const nutritionEntry = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        meal_type: meal.category,
        food_name: meal.name,
        quantity: 1,
        unit: 'serving',
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        fiber: meal.fiber || 0,
        sugar: meal.sugar || 0,
        sodium: meal.sodium || 0,
      };

      const { error } = await supabase
        .from('nutrition_logs')
        .insert([nutritionEntry]);

      if (error) throw error;

      setModalVisible(false);
      Alert.alert(t('common.success'), t('mealPlan.mealAddedNutrition'));
    } catch (error) {
      console.error('Add to nutrition error:', error);
      Alert.alert(t('common.error'), t('mealPlan.addToNutritionFailed'));
    }
  };

  const renderDailyView = () => {
    if (!mealPlan?.daily) return null;
    const plan = mealPlan.daily;
    const anyLoading = Object.values(loadingStates).some(Boolean);

    return (
      <View style={styles.dailyContent}>
        {/* Today's Summary Card */}
        <MealPlanSummary
          plan={plan}
          enhancedSummary={enhancedPlanSummary}
          colors={colors}
        />

        {/* ✅ Action buttons row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.regenerateAllButton,
              { flex: 1, backgroundColor: colors.accent + '1A' },
            ]}
            onPress={regenerateAllMeals}
            disabled={loadingStates.initial || anyLoading}
            activeOpacity={0.85}
          >
            <Sparkles size={17} color={colors.accent} />
            <Text style={[styles.regenerateAllText, { color: colors.accent }]}>
              {t('mealPlan.regenerateAll')}
            </Text>
            <RefreshCw size={14} color={colors.accent} />
          </TouchableOpacity>

          {/* ✅ Show insights button */}
          {enhancedPlanSummary?.insights && (
            <TouchableOpacity
              style={[
                styles.insightsButton,
                { backgroundColor: colors.primary + '14' },
              ]}
              onPress={() => setShowInsights(true)}
              activeOpacity={0.85}
            >
              <Sparkles size={14} color={colors.primary} />
              <Text
                style={[styles.insightsButtonText, { color: colors.primary }]}
              >
                {t('mealPlan.suggestions')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Meals Section */}
        <View style={styles.mealsSection}>
          <SectionHeader title={t('mealPlan.todaysMeals')} />

          {/* Breakfast */}
          {plan.breakfast && (
            <MealCard
              meal={plan.breakfast}
              mealType={t('mealPlan.breakfast')}
              mealKey="breakfast"
              onPress={handleMealPress}
              onRegenerate={regenerateMeal}
              isRegenerating={loadingStates.breakfast}
              colors={colors}
            />
          )}

          {/* Lunch */}
          {plan.lunch && (
            <MealCard
              meal={plan.lunch}
              mealType={t('mealPlan.lunch')}
              mealKey="lunch"
              onPress={handleMealPress}
              onRegenerate={regenerateMeal}
              isRegenerating={loadingStates.lunch}
              colors={colors}
            />
          )}

          {/* Dinner */}
          {plan.dinner && (
            <MealCard
              meal={plan.dinner}
              mealType={t('mealPlan.dinner')}
              mealKey="dinner"
              onPress={handleMealPress}
              onRegenerate={regenerateMeal}
              isRegenerating={loadingStates.dinner}
              colors={colors}
            />
          )}
        </View>

        {/* Snacks Section */}
        <View style={styles.snacksSection}>
          <View style={styles.snacksHeader}>
            <Display size="md" color={colors.textPrimary}>
              {t('mealPlan.snacks')}
            </Display>
            {/* ✅ Regenerate Snacks Button */}
            <TouchableOpacity
              style={[
                styles.regenerateSnacksButton,
                { backgroundColor: colors.primary + '14' },
              ]}
              onPress={() => regenerateMeal('snacks')}
              disabled={loadingStates.snacks}
            >
              {loadingStates.snacks ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <RefreshCw size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {plan.snacks.map((snack, index) => (
            <RecipeListCard
              key={index}
              title={snack.name}
              kicker={
                snack.source === 'ai_generated'
                  ? t('mealPlan.snackKickerAi')
                  : t('mealPlan.snackKicker')
              }
              imageUrl={(snack as any).image_url ?? null}
              onPress={() => handleMealPress(snack)}
            />
          ))}
        </View>
      </View>
    );
  };

  if (loadingStates.initial) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Display size="md" style={styles.loadingTitle}>
          {t('mealPlan.loadingTitle')}
        </Display>
        <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
          {t('mealPlan.loadingSubtitle')}
        </Text>
        {loadingError && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {t('mealPlan.storage', { error: loadingError })}
          </Text>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* ✅ Enhanced insights modal */}
      <EnhancedInsightsModal
        visible={showInsights}
        insights={enhancedPlanSummary?.insights}
        onClose={() => setShowInsights(false)}
        colors={colors}
      />

      {/* ✅ ÇÖZÜM 3: Modal with proper onClose handler */}
      <MealDetailModal
        visible={modalVisible}
        meal={selectedMeal}
        onClose={() => {
          setModalVisible(false);
          setSelectedMeal(null); // ✅ Reset selected meal
        }}
        onViewRecipe={navigateToRecipe}
        onAddToNutrition={addToNutritionLog}
        onAddToShopping={(ingredients: string[]) => {
          setModalVisible(false);
          setSelectedMeal(null); // ✅ Reset selected meal when closing
          handleAddToShoppingList(ingredients);
        }}
        colors={colors}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.iconButton,
            { backgroundColor: colors.surfaceVariant },
          ]}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Display size="md" color={colors.textPrimary}>
          {t('mealPlan.title')}
        </Display>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={[
            styles.iconButton,
            { backgroundColor: colors.surfaceVariant },
          ]}
        >
          <Settings size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* View Mode Tabs */}
      <ViewModeTabs
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        colors={colors}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadAllData}
            tintColor={colors.primary}
          />
        }
      >
        {/* Pantry Status Card */}
        <TouchableOpacity
          style={[
            styles.pantryStatusCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
          onPress={() => router.push('/(tabs)/pantry')}
          activeOpacity={0.85}
        >
          <View style={styles.pantryStatusLeft}>
            <View style={styles.pantryStatusHeader}>
              <Display size="sm" color={colors.textPrimary}>
                {t('mealPlan.pantryStatus')}
              </Display>
              {pantryMetrics.expiredItems > 0 && (
                <View
                  style={[
                    styles.expiredBadge,
                    { backgroundColor: colors.error + '14' },
                  ]}
                >
                  <Text
                    style={[styles.expiredBadgeText, { color: colors.error }]}
                  >
                    {t('mealPlan.pantryFinished', {
                      count: pantryMetrics.expiredItems,
                    })}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.pantryStatusSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              {t('mealPlan.pantrySubtitle', {
                total: pantryMetrics.totalItems,
                expiring: pantryMetrics.expiringItems,
              })}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Allergen Safety Info */}
        {userProfile?.dietary_restrictions &&
          userProfile.dietary_restrictions.length > 0 && (
            <View
              style={[
                styles.allergenInfo,
                { backgroundColor: colors.secondary + '14' },
              ]}
            >
              <ShieldCheck size={20} color={colors.secondary} />
              <Text style={[styles.allergenText, { color: colors.secondary }]}>
                {t('mealPlan.allergenFree', {
                  list: userProfile.dietary_restrictions.join(', '),
                })}
              </Text>
            </View>
          )}

        {/* Preferences Card */}
        {userProfile && (
          <View
            style={[
              styles.preferencesCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Eyebrow style={styles.preferencesTitle}>
              {t('mealPlan.yourPreferences')}
            </Eyebrow>
            <View style={styles.preferencesTags}>
              {userProfile.dietary_preferences?.map((pref) => (
                <View
                  key={pref}
                  style={[
                    styles.preferenceTag,
                    { backgroundColor: colors.primary + '12' },
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceTagText,
                      { color: colors.primary },
                    ]}
                  >
                    {pref.replace('_', ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Meal Plan Content - ACTIVATED */}
        {viewMode === 'daily' && renderDailyView()}
        {viewMode === 'weekly' && (
          <View style={styles.comingSoonContainer}>
            <Calendar size={44} color={colors.textSecondary} />
            <Display size="md" style={styles.comingSoonTitle}>
              {t('mealPlan.weeklyComingTitle')}
            </Display>
            <Text
              style={[
                styles.comingSoonSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              {t('mealPlan.weeklyComingSubtitle')}
            </Text>
          </View>
        )}
        {viewMode === 'monthly' && (
          <View style={styles.comingSoonContainer}>
            <Calendar size={44} color={colors.textSecondary} />
            <Display size="md" style={styles.comingSoonTitle}>
              {t('mealPlan.monthlyComingTitle')}
            </Display>
            <Text
              style={[
                styles.comingSoonSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              {t('mealPlan.monthlyComingSubtitle')}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
            onPress={() => router.push('/(tabs)/nutrition')}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.actionButtonIcon,
                { backgroundColor: colors.error + '14' },
              ]}
            >
              <Heart size={19} color={colors.error} />
            </View>
            <Text
              style={[styles.actionButtonText, { color: colors.textPrimary }]}
            >
              {t('mealPlan.nutritionTracking')}
            </Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
            onPress={() => router.push('/(tabs)/shopping-list')}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.actionButtonIcon,
                { backgroundColor: colors.primary + '14' },
              ]}
            >
              <ShoppingCart size={19} color={colors.primary} />
            </View>
            <Text
              style={[styles.actionButtonText, { color: colors.textPrimary }]}
            >
              {t('mealPlan.shoppingList')}
            </Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const WARM_SHADOW = {
  shadowColor: '#3C2814',
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingTitle: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    fontFamily: fonts.body,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  pantryStatusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...WARM_SHADOW,
  },
  pantryStatusLeft: {
    flex: 1,
  },
  pantryStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  expiredBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  expiredBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bodySemibold,
  },
  pantryStatusSubtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
  },
  allergenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
  },
  allergenText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    marginLeft: spacing.sm,
    flex: 1,
  },
  preferencesCard: {
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...WARM_SHADOW,
  },
  preferencesTitle: {
    marginBottom: spacing.md,
  },
  preferencesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  preferenceTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  preferenceTagText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    textTransform: 'capitalize',
  },
  dailyContent: {
    paddingHorizontal: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  regenerateAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  regenerateAllText: {
    fontSize: 14,
    fontFamily: fonts.bodySemibold,
  },
  insightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    justifyContent: 'center',
  },
  insightsButtonText: {
    fontSize: 13,
    fontFamily: fonts.bodySemibold,
  },
  mealsSection: {
    marginTop: spacing.xl,
  },
  snacksSection: {
    marginTop: spacing.xl,
  },
  snacksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  regenerateSnacksButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...WARM_SHADOW,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    flex: 1,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  comingSoonTitle: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

const overlayStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18,11,7,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 1000,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...{
      shadowColor: '#241710',
      shadowOpacity: 0.25,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 8,
    },
  },
  sheetHeader: {
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: '#fff',
  },
  ghostBtn: {
    height: 50,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
});

const cardStyles = StyleSheet.create({
  mealCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    ...WARM_SHADOW,
  },
  mealCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaText: {
    fontSize: 12.5,
    fontFamily: fonts.bodyMedium,
  },
  regenBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    ...WARM_SHADOW,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 9.5,
    letterSpacing: 1,
    textAlign: 'center',
  },
  enhancedBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  methodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  methodText: {
    fontSize: 10.5,
    fontFamily: fonts.bodySemibold,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: radius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13.5,
    fontFamily: fonts.bodySemibold,
  },
});
