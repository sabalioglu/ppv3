import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing, shadows, radius } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedText from '@/components/UI/ThemedText';
import ProgressBar from './ProgressBar';

export interface MacroCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  percentage: number;
}

const MacroCard: React.FC<MacroCardProps> = ({
  title,
  current,
  target,
  unit,
  color,
  percentage,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: `${color}10` }]}>
      {/* Progress */}
      <View style={styles.progress}>
        <ProgressBar percentage={percentage} color={color} size="small">
          <ThemedText type="caption">{percentage}%</ThemedText>
        </ProgressBar>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <ThemedText type="body">{title}</ThemedText>
        <ThemedText type="muted">
          {Math.round(current)} / {target} {unit}
        </ThemedText>
      </View>
    </View>
  );
};

export default MacroCard;
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  progress: {
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
});
