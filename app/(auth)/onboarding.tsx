import React, { useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthLayout from '@/components/auth/AuthLayout';
import CustomAlert from '@/components/UI/CustomAlert';
import { spacing, radius } from '@/lib/theme/index';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';

import Step1, { genderValues } from '@/components/onboarding/BasicInfo';
import Step2, {
  activityLevelValues,
} from '@/components/onboarding/PhysicalStats';
import {
  HealthGoals as Step3,
  Allergens as Step4,
  DietaryPreferences as Step5,
  CuisinePreferences as Step6,
} from '@/components/onboarding/OnboardingLists';
import Step7, {
  cookingSkillValues,
} from '@/components/onboarding/CookingSkill';

import ThemedText from '@/components/UI/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';

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
    'Please select your activity level'
  ),
  healthGoals: z
    .array(z.string())
    .min(1, 'Please select at least one health goal'),
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
  activityLevel: '',
  healthGoals: [],
  dietaryRestrictions: [],
  dietaryPreferences: [],
  cuisinePreferences: [],
  cookingSkillLevel: '',
};

const TOTAL_STEPS = 7;

const steps: Record<
  number,
  { component: React.FC; fields: (keyof z.infer<typeof formSchema>)[] }
> = {
  1: { component: Step1, fields: ['fullName', 'age', 'gender'] },
  2: { component: Step2, fields: ['height', 'weight', 'activityLevel'] },
  3: { component: Step3, fields: ['healthGoals'] },
  4: { component: Step4, fields: ['dietaryRestrictions'] },
  5: { component: Step5, fields: ['dietaryPreferences'] },
  6: { component: Step6, fields: ['cuisinePreferences'] },
  7: { component: Step7, fields: ['cookingSkillLevel'] },
};

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
    [currentStep]
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
        health_goals: data.healthGoals,
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
      showAlert('❌ Profile save failed', error.message || 'Please try again.');
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
            <ThemedText bold type="heading" style={styles.title}>
              🍽 Complete Your Profile
            </ThemedText>
            <ThemedText type="subheading" style={styles.subtitle}>
              Step {currentStep} of {TOTAL_STEPS}
            </ThemedText>
            {/* Progress Bar */}
            <View
              style={[styles.progressBar, { backgroundColor: colors.border }]}
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
                  backgroundColor: colors.success,
                  borderColor: colors.primary,
                },
              ]}
            >
              <ThemedText bold style={styles.summaryTitle}>
                🎉 Almost Done!
              </ThemedText>
              <ThemedText type="muted" style={styles.summaryText}>
                We'll calculate your daily nutrition goals automatically based
                on your information and keep you safe from allergens.
              </ThemedText>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity
                onPress={handleBack}
                style={[styles.backButton, { backgroundColor: colors.border }]}
              >
                <ThemedText bold type="label">
                  ← Back
                </ThemedText>
              </TouchableOpacity>
            )}
            {currentStep < TOTAL_STEPS ? (
              <TouchableOpacity
                onPress={handleNext}
                style={[
                  styles.nextButton,
                  { backgroundColor: colors.buttonPrimary },
                ]}
              >
                <ThemedText bold type="label">
                  {' '}
                  Next →
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                style={[
                  styles.completeButton,
                  { backgroundColor: colors.buttonPrimary },
                  loading && { backgroundColor: colors.border },
                ]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <ThemedText type="label" bold>
                    Complete Profile 🚀
                  </ThemedText>
                )}
              </TouchableOpacity>
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
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontSize: 24,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  progressBar: {
    height: spacing.xs,
    borderRadius: radius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.xs,
  },
  summaryCard: {
    borderRadius: radius.md,
    padding: spacing.lg,
    marginVertical: spacing.lg,
    borderWidth: 1,
  },
  summaryTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  summaryText: {
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  nextButton: {
    flex: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  completeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
  },
});
