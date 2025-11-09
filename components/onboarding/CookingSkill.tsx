import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import ThemedText from '@/components/UI/ThemedText';
import FormInput from '@/components/auth/FormInput';
import { spacing } from '@/lib/theme/index';

const cookingSkillOptions = [
  { label: '🌱 Beginner', value: 'beginner' },
  { label: '🍳 Intermediate', value: 'intermediate' },
  { label: '👨‍🍳 Advanced', value: 'advanced' },
  { label: '⭐ Expert', value: 'expert' },
];

export const cookingSkillValues = cookingSkillOptions.map(
  (option) => option.value
);

export default function CookingSkill() {
  const { control } = useFormContext();

  return (
    <View style={styles.form}>
      <ThemedText bold type="body" style={styles.stepTitle}>
        👩‍🍳 Cooking Skill Level
      </ThemedText>

      <ThemedText type="muted" style={styles.subheading}>
        How would you describe your cooking experience?
      </ThemedText>

      <ThemedText bold type="body" style={styles.label}>
        Cooking Skill Level *
      </ThemedText>

      <FormInput
        control={control}
        name="cookingSkillLevel"
        placeholder="Select your skill level"
        pickerOptions={cookingSkillOptions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    marginBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: 20,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subheading: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.sm,
  },
});
