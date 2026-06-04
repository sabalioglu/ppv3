import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Display } from '@/components/UI/Display';
import ThemedText from '@/components/UI/ThemedText';
import { spacing, radius, fonts } from '@/lib/theme/index';

interface OptionCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

// Premium single-select card: serif title + optional muted description,
// terracotta border + herb-green check when active. Used for cooking skill
// and activity level. Match the Warm Kitchen card language.
export default function OptionCard({
  title,
  description,
  selected,
  onPress,
}: OptionCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.primary : colors.borderLight,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
    >
      <View style={styles.body}>
        {description ? (
          <Display size="sm" weight="displayMedium" style={styles.title}>
            {title}
          </Display>
        ) : (
          <ThemedText
            style={[styles.titlePlain, { color: colors.textPrimary }]}
          >
            {title}
          </ThemedText>
        )}
        {description ? (
          <ThemedText
            style={[styles.description, { color: colors.textSecondary }]}
          >
            {description}
          </ThemedText>
        ) : null}
      </View>
      <View
        style={[
          styles.checkMark,
          {
            backgroundColor: selected ? colors.secondary : 'transparent',
            borderColor: selected ? colors.secondary : colors.border,
          },
        ]}
      >
        {selected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  body: { flex: 1 },
  title: { marginBottom: 2 },
  titlePlain: {
    fontFamily: fonts.bodySemibold,
    fontSize: 15,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 17,
  },
  checkMark: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
});
