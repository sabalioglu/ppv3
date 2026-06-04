import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react-native';

import AuthLayout from '@/components/auth/AuthLayout';
import CustomAlert from '@/components/UI/CustomAlert';
import { Display, Eyebrow } from '@/components/UI/Display';
import { spacing, radius, fonts } from '@/lib/theme/index';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';

import Step1, { genderValues } from '@/components/onboarding/BasicInfo';
import Step2, {
  activityLevelValues,
} from '@/components/onboarding/PhysicalStats';
import {
  HealthGoalsMacrosKeys,
  HealthGoalsMicrosKeys,
  HealthGoalsMacros as Step3,
  HealthGoalsMicros as Step4,
  Allergens as Step5,
  DietaryPreferences as Step6,
  CuisinePreferences as Step7,
} from '@/components/onboarding/OnboardingLists';
import Step8, {
  cookingSkillValues,
} from '@/components/onboarding/CookingSkill';

import ThemedText from '@/components/UI/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { t } from '@/lib/i18n';

export const formSchema = z.object({
  fullName: z.string().min(1, 'Please enter your full name'),
  age: z
    .string()
    .min(1, 'Please enter your age')
    .refine((val) => !isNaN(parseInt(val)), {
      message: 'Age must be a number',
    }),
  gender: z.enum(genderValues, 'Please select your gender'),
  height: z
    .string()
    .min(1, 'Please enter your height')
    .refine((val) => !isNaN(parseInt(val)), {
      message: 'Height must be a number',
    }),
  weight: z
    .string()
    .min(1, 'Please enter your weight')
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Weight must be a number',
    }),
  activityLevel: z.enum(
    activityLevelValues,
    'Please select your activity level',
  ),
  healthGoalsMacros: z
    .array(z.enum(HealthGoalsMacrosKeys))
    .length(1, 'Please select exactly one health goal'),
  healthGoalsMicros: z.array(z.enum(HealthGoalsMicrosKeys)).optional(),
  dietaryRestrictions: z.array(z.string()).optional(), // This will store selected allergens
  dietaryPreferences: z.array(z.string()).optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  cookingSkillLevel: z.enum(cookingSkillValues).optional(),
});

const defaultFormValues: z.infer<typeof formSchema> = {
  fullName: '',
  age: '',
  gender: '',
  height: '',
  weight: '',
  activityLevel: 'moderately_active',
  healthGoalsMacros: [],
  healthGoalsMicros: [],
  dietaryRestrictions: [],
  dietaryPreferences: [],
  cuisinePreferences: [],
  cookingSkillLevel: '',
};

const steps: Record<
  number,
  { component: React.FC; fields: (keyof z.infer<typeof formSchema>)[] }
> = {
  1: { component: Step1, fields: ['fullName', 'age', 'gender'] },
  2: { component: Step2, fields: ['height', 'weight', 'activityLevel'] },
  3: { component: Step3, fields: ['healthGoalsMacros'] },
  4: { component: Step4, fields: ['healthGoalsMicros'] },
  5: { component: Step5, fields: ['dietaryRestrictions'] },
  6: { component: Step6, fields: ['dietaryPreferences'] },
  7: { component: Step7, fields: ['cuisinePreferences'] },
  8: { component: Step8, fields: ['cookingSkillLevel'] },
};

const TOTAL_STEPS = Object.keys(steps).length;

const stepTitle = (step: number) => ({
  kicker: t(`auth.step${step}Kicker`),
  title: t(`auth.step${step}Title`),
});

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const StepComponent = steps[currentStep].component;

  const { session, checkProfileCompletion } = useAuth();
  const { colors } = useTheme();
  const { visible, title, message, buttons, showAlert, hideAlert } =
    useCustomAlert();

  const formMethods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });
  const { handleSubmit, trigger } = formMethods;

  const progress = useMemo(
    () => (currentStep / TOTAL_STEPS) * 100,
    [currentStep],
  );

  const handleNext = async () => {
    const fieldsToValidate = steps[currentStep].fields;
    const isValid = await trigger(fieldsToValidate);

    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const isValid = await trigger();
    if (!isValid) return;
    try {
      setLoading(true);
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }
      const profileData = {
        id: session?.user.id,
        email: session?.user.email,
        full_name: data.fullName.trim(),
        age: parseInt(data.age),
        gender: data.gender,
        height_cm: parseInt(data.height),
        weight_kg: parseFloat(data.weight),
        activity_level: data.activityLevel,
        health_goals_macros: data.healthGoalsMacros,
        health_goals_micros: data.healthGoalsMicros,
        dietary_restrictions: data.dietaryRestrictions,
        dietary_preferences: data.dietaryPreferences,
        cuisine_preferences: data.cuisinePreferences,
        cooking_skill_level: data.cookingSkillLevel,
      };
      const { data: result, error } = await supabase
        .from('user_profiles')
        .upsert(profileData)
        .select();

      if (error) throw error;

      await checkProfileCompletion();
      router.replace('/');
    } catch (error: any) {
      showAlert(
        t('auth.profileSaveFailed'),
        error.message || t('auth.profileSaveFailedFallback'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...formMethods}>
      <AuthLayout>
        <SafeAreaView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.stepRow}>
              <Eyebrow>
                {t('auth.stepProgress', {
                  current: currentStep,
                  total: TOTAL_STEPS,
                })}
              </Eyebrow>
              {currentStep > 1 ? (
                <Pressable
                  onPress={handleBack}
                  hitSlop={8}
                  style={[styles.backChip, { borderColor: colors.border }]}
                >
                  <ArrowLeft size={14} color={colors.textSecondary} />
                  <ThemedText
                    style={[
                      styles.backChipText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t('common.back')}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
            <Eyebrow color={colors.primary} style={styles.stepKicker}>
              {stepTitle(currentStep).kicker}
            </Eyebrow>
            <Display size="xl" style={styles.title}>
              {stepTitle(currentStep).title}
            </Display>
            {/* Progress Bar */}
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.borderLight },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </View>

          {/* Steps Content */}
          <View style={{ marginVertical: spacing.sm }}>
            <StepComponent />
          </View>

          {currentStep === TOTAL_STEPS && (
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <View
                style={[
                  styles.summaryIcon,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Sparkles size={18} color="#fff" />
              </View>
              <View style={styles.summaryBody}>
                <Display
                  size="sm"
                  weight="displayBold"
                  style={styles.summaryTitle}
                >
                  {t('auth.almostReadyTitle')}
                </Display>
                <ThemedText
                  style={[styles.summaryText, { color: colors.textSecondary }]}
                >
                  {t('auth.almostReadyText')}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep < TOTAL_STEPS ? (
              <Pressable
                onPress={handleNext}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <ThemedText style={styles.primaryBtnText}>
                  {t('common.continue')}
                </ThemedText>
                <ArrowRight size={18} color="#fff" />
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSubmit(onSubmit)}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    opacity: loading ? 0.6 : pressed ? 0.92 : 1,
                  },
                ]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <ThemedText style={styles.primaryBtnText}>
                      {t('auth.completeProfile')}
                    </ThemedText>
                    <Sparkles size={18} color="#fff" />
                  </>
                )}
              </Pressable>
            )}
          </View>
          <CustomAlert
            visible={visible}
            title={title}
            message={message}
            buttons={buttons}
            onClose={hideAlert}
          />
        </SafeAreaView>
      </AuthLayout>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  header: {
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  backChipText: { fontFamily: fonts.bodyMedium, fontSize: 12.5 },
  stepKicker: { marginBottom: spacing.xs },
  title: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  summaryCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginVertical: spacing.lg,
    borderWidth: 1,
    shadowColor: '#3C2814',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBody: { flex: 1 },
  summaryTitle: {
    marginBottom: spacing.xs,
  },
  summaryText: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  primaryBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.2,
  },
});
