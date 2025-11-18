import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import ThemedText from '@/components/UI/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, shadows, radius } from '@/lib/theme/index';

type Option = {
  key: string;
  label: string;
};

interface SelectableListProps {
  name: string; // RHF field name
  title: string;
  subtitle?: string;
  options: Option[];
  noSelectionLabel?: string;
}

export default function SelectableList({
  name,
  title,
  subtitle,
  options,
  noSelectionLabel,
}: SelectableListProps) {
  const { colors } = useTheme();
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const selectedValues = watch(name) || [];
  const errorMessage = errors?.[name]?.message as string | undefined;

  const toggleOption = (key: string) => {
    const updated = selectedValues.includes(key)
      ? selectedValues.filter((item: string) => item !== key)
      : [...selectedValues, key];
    setValue(name, updated, { shouldValidate: true });
  };

  const clearAll = () => {
    setValue(name, [], { shouldValidate: true });
  };

  return (
    <View style={styles.form}>
      <ThemedText bold type="body" style={styles.title}>
        {title}
      </ThemedText>

      {subtitle && (
        <ThemedText type="muted" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      )}

      <View style={styles.optionsGrid}>
        {options.map(({ key, label }) => {
          const selected = selectedValues.includes(key);
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.optionCard,
                {
                  backgroundColor: selected ? colors.success : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                  ...shadows.md,
                },
              ]}
              onPress={() => toggleOption(key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
            >
              <ThemedText type="caption" bold style={styles.optionLabel}>
                {label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
      {noSelectionLabel && (
        <TouchableOpacity
          style={[
            styles.clearButton,
            {
              backgroundColor:
                selectedValues.length === 0
                  ? colors.success
                  : colors.background,
              borderColor:
                selectedValues.length === 0 ? colors.primary : colors.border,
            },
          ]}
          onPress={clearAll}
          accessibilityRole="button"
          accessibilityLabel="Clear all selections"
        >
          <ThemedText type="caption" bold>
            {noSelectionLabel}
          </ThemedText>
        </TouchableOpacity>
      )}
      {errorMessage && (
        <ThemedText
          type="caption"
          style={[styles.error, { color: colors.error }]}
        >
          ⚠️ {errorMessage}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 20,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  optionCard: {
    flexGrow: 1,
    flexBasis: '48%',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  optionLabel: {
    textAlign: 'center',
  },
  clearButton: {
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  error: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
