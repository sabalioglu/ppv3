import { View, StyleSheet } from 'react-native';
import ThemedText from '@/components/UI/ThemedText';
import { spacing, shadows, radius } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import { safePercentage } from '@/lib/nutrition/insights';

interface WeeklyProgressProps {
  data: {
    day: string;
    calories: number;
    isSelected: boolean;
  }[];
  target: number;
}

const WeeklyProgress = ({ data, target }: WeeklyProgressProps) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.chart, { backgroundColor: colors.surface }]}>
      {data.map(({ day, isSelected, calories }, index) => {
        const percentage = safePercentage(calories, target);

        return (
          <View key={index} style={styles.day}>
            <View
              style={[styles.bar, { backgroundColor: colors.surfaceVariant }]}
            >
              <View
                style={[
                  styles.fill,
                  {
                    height: `${Math.min(percentage, 100)}%`,
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.secondary,
                  },
                ]}
              />
            </View>

            <ThemedText
              type="muted"
              style={[styles.label, isSelected && { color: colors.primary }]}
            >
              {day}
            </ThemedText>

            <ThemedText type="muted">{calories}</ThemedText>
          </View>
        );
      })}
    </View>
  );
};

export default WeeklyProgress;

const styles = StyleSheet.create({
  chart: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 220,
    ...shadows.md,
  },
  day: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    height: 120,
    borderRadius: radius.md,
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  fill: {
    width: '100%',
    borderRadius: radius.md,
    minHeight: spacing.xs,
  },
  label: {
    marginBottom: spacing.xs,
  },
});
