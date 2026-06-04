import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import OptionCard from '@/components/onboarding/OptionCard';
import { Eyebrow } from '@/components/UI/Display';
import ThemedText from '@/components/UI/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, fonts } from '@/lib/theme/index';
import { t } from '@/lib/i18n';

// Stored values must stay verbatim — only displayed labels are translated.
const cookingSkillOptions = [
  {
    value: 'beginner',
    label: () => t('auth.onboarding.skillBeginner'),
    desc: () => t('auth.onboarding.skillBeginnerDesc'),
  },
  {
    value: 'intermediate',
    label: () => t('auth.onboarding.skillIntermediate'),
    desc: () => t('auth.onboarding.skillIntermediateDesc'),
  },
  {
    value: 'advanced',
    label: () => t('auth.onboarding.skillAdvanced'),
    desc: () => t('auth.onboarding.skillAdvancedDesc'),
  },
  {
    value: 'expert',
    label: () => t('auth.onboarding.skillExpert'),
    desc: () => t('auth.onboarding.skillExpertDesc'),
  },
];

export const cookingSkillValues = cookingSkillOptions.map(
  (option) => option.value,
);

export default function CookingSkill() {
  const { control } = useFormContext();
  const { colors } = useTheme();

  return (
    <View style={styles.form}>
      <ThemedText style={[styles.helper, { color: colors.textSecondary }]}>
        {t('auth.onboarding.cookingHelper')}
      </ThemedText>

      <Eyebrow color={colors.textSecondary} style={styles.label}>
        {t('auth.onboarding.cookingLabel')}
      </Eyebrow>
      <Controller
        control={control}
        name="cookingSkillLevel"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            {cookingSkillOptions.map((opt) => (
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
  error: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
