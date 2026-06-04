import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import FormInput from '@/components/auth/FormInput';
import { Eyebrow } from '@/components/UI/Display';
import ThemedText from '@/components/UI/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, radius, fonts } from '@/lib/theme/index';
import { t } from '@/lib/i18n';

// NOTE: stored values ('male'|'female'|'other') must not change — only labels.
const genderOptions = [
  { label: () => t('auth.onboarding.genderMale'), value: 'male' },
  { label: () => t('auth.onboarding.genderFemale'), value: 'female' },
  { label: () => t('auth.onboarding.genderOther'), value: 'other' },
];

export const genderValues = genderOptions.map((option) => option.value);

export default function BasicInfo() {
  const { control } = useFormContext();
  const { colors } = useTheme();

  return (
    <View style={styles.form}>
      <ThemedText style={[styles.helper, { color: colors.textSecondary }]}>
        {t('auth.onboarding.basicHelper')}
      </ThemedText>

      <Eyebrow color={colors.textSecondary} style={styles.label}>
        {t('auth.onboarding.fullNameLabel')}
      </Eyebrow>
      <FormInput
        control={control}
        name="fullName"
        placeholder={t('auth.onboarding.fullNamePlaceholder')}
        autoCapitalize="words"
      />

      <Eyebrow color={colors.textSecondary} style={styles.label}>
        {t('auth.onboarding.ageLabel')}
      </Eyebrow>
      <FormInput
        control={control}
        name="age"
        placeholder={t('auth.onboarding.agePlaceholder')}
        keyboardType="numeric"
        unit={t('auth.onboarding.ageUnit')}
      />

      <Eyebrow color={colors.textSecondary} style={styles.label}>
        {t('auth.onboarding.genderLabel')}
      </Eyebrow>
      <Controller
        control={control}
        name="gender"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <View style={styles.segment}>
              {genderOptions.map((opt) => {
                const active = value === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => onChange(opt.value)}
                    style={({ pressed }) => [
                      styles.segmentItem,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.surface,
                        borderColor: active
                          ? colors.primary
                          : colors.borderLight,
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <ThemedText
                      style={[
                        styles.segmentText,
                        { color: active ? '#fff' : colors.textPrimary },
                      ]}
                    >
                      {opt.label()}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
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
  segment: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segmentItem: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 14,
  },
  error: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
