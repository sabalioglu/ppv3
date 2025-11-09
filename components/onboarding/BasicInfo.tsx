import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import FormInput from '@/components/auth/FormInput';
import { spacing } from '@/lib/theme/index';
import ThemedText from '@/components/UI/ThemedText';

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

export const genderValues = genderOptions.map((option) => option.value);

export default function BasicInfo() {
  const { control } = useFormContext();

  return (
    <View style={styles.form}>
      <ThemedText bold type="body" style={styles.stepTitle}>
        👋 Basic Information
      </ThemedText>

      <ThemedText bold type="body" style={styles.label}>
        Full Name *
      </ThemedText>
      <FormInput
        control={control}
        name="fullName"
        placeholder="Enter your full name"
      />

      <View style={styles.bottomContainer}>
        <View style={styles.halfWidth}>
          <ThemedText bold type="body" style={styles.label}>
            Age *
          </ThemedText>
          <FormInput control={control} name="age" placeholder="Your age" />
        </View>

        <View style={styles.halfWidth}>
          <ThemedText bold type="body" style={styles.label}>
            Gender *
          </ThemedText>
          <FormInput
            control={control}
            name="gender"
            placeholder="Select gender"
            pickerOptions={genderOptions}
          />
        </View>
      </View>
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
  bottomContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    marginBottom: spacing.sm,
  },
});
