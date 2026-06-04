import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import FormInput from '@/components/auth/FormInput';
import OptionCard from '@/components/onboarding/OptionCard';
import { Eyebrow } from '@/components/UI/Display';
import ThemedText from '@/components/UI/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, fonts } from '@/lib/theme/index';
import { t } from '@/lib/i18n';

// Stored values must stay verbatim — only displayed labels are translated.
const activityLevelOptions = [
  {
    value: 'sedentary',
    label: () => t('auth.onboarding.activitySedentary'),
    desc: () => t('auth.onboarding.activitySedentaryDesc'),
  },
  {
    value: 'lightly_active',
    label: () => t('auth.onboarding.activityLightly'),
    desc: () => t('auth.onboarding.activityLightlyDesc'),
  },
  {
    value: 'moderately_active',
    label: () => t('auth.onboarding.activityModerately'),
    desc: () => t('auth.onboarding.activityModeratelyDesc'),
  },
  {
    value: 'very_active',
    label: () => t('auth.onboarding.activityVery'),
    desc: () => t('auth.onboarding.activityVeryDesc'),
  },
  {
    value: 'extra_active',
    label: () => t('auth.onboarding.activityExtra'),
    desc: () => t('auth.onboarding.activityExtraDesc'),
  },
] as const;

export const activityLevelValues = activityLevelOptions.map((opt) => opt.value);

export default function PhysicalStats() {
  const { control } = useFormContext();
  const { colors } = useTheme();

  return (
    <View style={styles.form}>
      <ThemedText style={[styles.helper, { color: colors.textSecondary }]}>
        {t('auth.onboarding.physicalHelper')}
      </ThemedText>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Eyebrow color={colors.textSecondary} style={styles.label}>
            {t('auth.onboarding.heightLabel')}
          </Eyebrow>
          <FormInput
            control={control}
            name="height"
            placeholder={t('auth.onboarding.heightPlaceholder')}
            keyboardType="numeric"
            unit={t('auth.onboarding.heightUnit')}
          />
        </View>

        <View style={styles.halfWidth}>
          <Eyebrow color={colors.textSecondary} style={styles.label}>
            {t('auth.onboarding.weightLabel')}
          </Eyebrow>
          <FormInput
            control={control}
            name="weight"
            placeholder={t('auth.onboarding.weightPlaceholder')}
            keyboardType="numeric"
            unit={t('auth.onboarding.weightUnit')}
          />
        </View>
      </View>

      <Eyebrow color={colors.textSecondary} style={styles.label}>
        {t('auth.onboarding.activityLabel')}
      </Eyebrow>
      <Controller
        control={control}
        name="activityLevel"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            {activityLevelOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                title={opt.label()}
                description={opt.desc()}
                selected={value === opt.value}
                onPress={() => onChange(opt.value)}
              />
            ))}
            {error && (
              <ThemedText
                type="caption"
                style={[styles.error, { color: colors.error }]}
              >
                {error.message}
              </ThemedText>
            )}
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    marginBottom: spacing.lg,
  },
  helper: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  error: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
