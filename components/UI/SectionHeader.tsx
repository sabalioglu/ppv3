// components/UI/SectionHeader.tsx — serif section title + optional "see all" action.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { fonts } from '@/lib/theme/index';
import { Display, Eyebrow } from './Display';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Display size="md" color={colors.textPrimary}>
        {title}
      </Display>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.action}>
          <Eyebrow color={colors.primary} style={styles.actionText}>
            {actionLabel}
          </Eyebrow>
          <ChevronRight size={13} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actionText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    letterSpacing: 0,
    textTransform: 'none',
  },
});
