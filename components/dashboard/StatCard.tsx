import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { spacing, shadows, radius } from '@/lib/theme/index';
import ThemedText from '../UI/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';

interface StatCardProps {
  title: string;
  current: number;
  target: number;
  color: string;
  unit: string;
  percentage: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  current,
  target,
  color,
  unit,
  percentage,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={styles.statHeader}>
        <ThemedText type="body" bold>
          {title}
        </ThemedText>
        <TrendingUp size={20} color={color} />
      </View>

      <View style={styles.statContent}>
        <ThemedText type="heading">{current}</ThemedText>
        <ThemedText style={styles.statTarget}>
          / {target} {unit}
        </ThemedText>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: `${color}20` }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.md,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  statTarget: {
    marginLeft: spacing.sm,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.xs,
  },
});

export default StatCard;
