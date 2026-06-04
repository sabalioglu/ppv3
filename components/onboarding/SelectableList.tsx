import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { Check } from 'lucide-react-native';
import ThemedText from '@/components/UI/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, radius, fonts } from '@/lib/theme/index';
import { t } from '@/lib/i18n';

export type SelectableOption = {
  key: string; // stored value — never translated
  label: () => string; // displayed, localized label
};

interface SelectableListProps {
  name: string; // RHF field name
  helper?: string;
  options: readonly SelectableOption[];
  /** When set, shows a "none of these" pill that clears the selection. */
  allowNone?: boolean;
}

// Premium multi-select chip grid (Warm Kitchen): hairline pills, terracotta
// fill + herb-green check when active, wraps cleanly. No in-body title — the
// wrapper already renders the serif step title.
export default function SelectableList({
  name,
  helper,
  options,
  allowNone,
}: SelectableListProps) {
  const { colors } = useTheme();
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const selectedValues: string[] = watch(name) || [];
  const errorMessage = errors?.[name]?.message as string | undefined;

  const toggleOption = (key: string) => {
    const updated = selectedValues.includes(key)
      ? selectedValues.filter((item) => item !== key)
      : [...selectedValues, key];
    setValue(name, updated, { shouldValidate: true });
  };

  const clearAll = () => {
    setValue(name, [], { shouldValidate: true });
  };

  const noneSelected = selectedValues.length === 0;

  return (
    <View style={styles.form}>
      {helper ? (
        <ThemedText style={[styles.helper, { color: colors.textSecondary }]}>
          {helper}
        </ThemedText>
      ) : null}

      <View style={styles.grid}>
        {options.map((opt) => {
          const selected = selectedValues.includes(opt.key);
          return (
            <Pressable
              key={opt.key}
              onPress={() => toggleOption(opt.key)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.borderLight,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={opt.label()}
            >
              {selected ? (
                <Check size={13} color="#fff" strokeWidth={3} />
              ) : null}
              <ThemedText
                style={[
                  styles.chipText,
                  { color: selected ? '#fff' : colors.textPrimary },
                ]}
              >
                {opt.label()}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {allowNone ? (
        <Pressable
          onPress={clearAll}
          style={({ pressed }) => [
            styles.noneRow,
            {
              backgroundColor: noneSelected ? colors.surface : 'transparent',
              borderColor: noneSelected ? colors.primary : colors.borderLight,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('auth.onboarding.clearSelection')}
          accessibilityState={{ selected: noneSelected }}
        >
          <View
            style={[
              styles.noneDot,
              {
                backgroundColor: noneSelected
                  ? colors.secondary
                  : 'transparent',
                borderColor: noneSelected ? colors.secondary : colors.border,
              },
            ]}
          >
            {noneSelected ? (
              <Check size={13} color="#fff" strokeWidth={3} />
            ) : null}
          </View>
          <ThemedText style={[styles.noneText, { color: colors.textPrimary }]}>
            {t('auth.onboarding.clearSelection')}
          </ThemedText>
        </Pressable>
      ) : null}

      {errorMessage ? (
        <ThemedText
          type="caption"
          style={[styles.error, { color: colors.error }]}
        >
          {errorMessage}
        </ThemedText>
      ) : null}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
  },
  noneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  noneDot: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noneText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
  },
  error: {
    marginTop: spacing.md,
  },
});
