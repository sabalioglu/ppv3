import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import FormInput from '@/components/auth/FormInput';
import ThemedText from '@/components/UI/ThemedText';
import { spacing } from '@/lib/theme';

const activityLevelOptions = [
  { label: 'Sedentary (little exercise)', value: 'sedentary' },
  { label: 'Lightly Active (1-3 days/week)', value: 'lightly_active' },
  { label: 'Moderately Active (3-5 days/week)', value: 'moderately_active' },
  { label: 'Very Active (6-7 days/week)', value: 'very_active' },
  { label: 'Extra Active (very intense)', value: 'extra_active' },
] as const;

export const activityLevelValues = activityLevelOptions.map((opt) => opt.value);

export default function PhysicalStats() {
  const { control } = useFormContext();

  return (
    <View style={styles.form}>
      <ThemedText bold type="body" style={styles.stepTitle}>
        📏 Physical Stats
      </ThemedText>

      {/* Height & Weight */}
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <ThemedText bold type="body" style={styles.label}>
            Height (cm) *
          </ThemedText>
          <FormInput
            control={control}
            name="height"
            placeholder="Enter your height in cm"
          />
        </View>

        <View style={styles.halfWidth}>
          <ThemedText bold type="body" style={styles.label}>
            Weight (kg) *
          </ThemedText>
          <FormInput
            control={control}
            name="weight"
            placeholder="Enter your weight in kg"
          />
        </View>
      </View>

      {/* Activity Level */}
      <ThemedText bold type="body" style={styles.label}>
        Activity Level *
      </ThemedText>
      <FormInput
        control={control}
        name="activityLevel"
        placeholder="Select activity level"
        pickerOptions={activityLevelOptions}
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
    marginBottom: spacing.lg,
    textAlign: 'center',
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
});
