import React from 'react';
import { View, StyleSheet } from 'react-native';
import ThemedText from '../UI/ThemedText';
import { spacing, shadows, radius } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';

interface ProfileSummaryCardProps {
  profile: {
    age: number;
    gender: string;
    height_cm: number;
    weight_kg: number;
    activity_level: string;
  };
  calories: number;
  bmr: number;
}

const ProfileSummaryCard: React.FC<ProfileSummaryCardProps> = ({
  profile,
  calories,
  bmr,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
      <View style={styles.profileGrid}>
        <View style={styles.profileItem}>
          <ThemedText type="muted">Age</ThemedText>
          <ThemedText type="caption" bold>
            {profile.age} years
          </ThemedText>
        </View>
        <View style={styles.profileItem}>
          <ThemedText type="muted" bold>
            Height
          </ThemedText>
          <ThemedText type="caption" bold>
            {profile.height_cm} cm
          </ThemedText>
        </View>
        <View style={styles.profileItem}>
          <ThemedText type="muted" bold>
            Weight
          </ThemedText>
          <ThemedText type="caption" bold>
            {profile.weight_kg} kg
          </ThemedText>
        </View>
        <View style={styles.profileItem}>
          <ThemedText type="muted">BMR</ThemedText>
          <ThemedText type="caption" bold>
            {Math.round(bmr)} cal
          </ThemedText>
        </View>
      </View>

      <View
        style={[
          styles.tdeeContainer,
          { backgroundColor: `${colors.primary}10` },
        ]}
      >
        <ThemedText type="muted">Daily Calorie Target (TDEE)</ThemedText>
        <ThemedText type="subheading" bold style={{ color: colors.primary }}>
          {calories} calories
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadows.sm,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  profileItem: {
    width: '40%',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tdeeContainer: {
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
});

export default ProfileSummaryCard;
