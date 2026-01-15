import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Droplets, Loader } from 'lucide-react-native';
import { spacing, shadows, radius } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedText from '@/components/UI/ThemedText';
import ProgressBar from '@/components/nutrition/ProgressBar';
import ErrorCard from '../UI/ErrorCard';

interface Props {
  current: number;
  target: number;
  percentage: number;
  loading: boolean;
  error: string | null;
  onAdd: (amount: number) => void;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  showCelebration: boolean;
}

const WATER_AMOUNTS = [50, 100, 250, 500];

export default function WaterSection({
  current,
  target,
  loading,
  error,
  percentage,
  onAdd,
  fadeAnim,
  scaleAnim,
  showCelebration,
}: Props) {
  const { colors } = useTheme();

  const isGoalReached = percentage >= 100;

  return (
    <View style={[styles.card, { backgroundColor: `${colors.accent}10` }]}>
      {/* Progress */}
      <View style={styles.progress}>
        <ProgressBar
          percentage={percentage}
          color={isGoalReached ? colors.primary : colors.accent}
          size="large"
        >
          <Droplets
            size={24}
            color={isGoalReached ? colors.primary : colors.accent}
          />
        </ProgressBar>

        {/* Info */}
        <View style={styles.info}>
          <ThemedText type="subheading">
            {Math.round(current)} / {target} ml
          </ThemedText>
          {isGoalReached && (
            <ThemedText type="subtitle" style={{ color: colors.primary }}>
              Goal Reached! 💧
            </ThemedText>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {WATER_AMOUNTS.map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={() => onAdd(v)}
            disabled={loading}
          >
            {loading ? (
              <Loader />
            ) : (
              <ThemedText type="label">+{v} ml</ThemedText>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {error && <ErrorCard message={error} />}

      {/* Celebration */}
      {showCelebration && (
        <Animated.View
          style={[
            [styles.celebration, { backgroundColor: colors.primary }],
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <ThemedText style={styles.emoji}>🎉</ThemedText>
          <ThemedText type="body">Hydration Goal!</ThemedText>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progress: {
    marginVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  info: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  celebration: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
  },
});
