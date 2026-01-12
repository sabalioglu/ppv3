import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import ThemedText from '@/components/UI/ThemedText';
import { spacing, shadows, radius } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import { calculateBMR, multipliers } from '@/lib/nutrition/macros';

interface TdeeInfoModalProps {
  visible: boolean;
  onClose: () => void;
  profile?: any;
  tdee: number; // calculated TDEE value
}

export default function TdeeInfoModal({
  visible,
  onClose,
  profile,
  tdee,
}: TdeeInfoModalProps) {
  const { colors } = useTheme();
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle" bold>
              TDEE (Total Daily Energy Expenditure)
            </ThemedText>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <ThemedText type="muted" style={styles.text}>
            TDEE is the total number of calories your body burns in a day,
            including your basal metabolism, activity, and digestion.
          </ThemedText>

          {/* Formula */}
          <View
            style={[styles.box, { backgroundColor: colors.surfaceVariant }]}
          >
            <ThemedText type="body" bold>
              Formula
            </ThemedText>
            <ThemedText type="muted" style={styles.mono}>
              TDEE = BMR × Activity Level
            </ThemedText>
            <ThemedText type="muted" style={styles.text}>
              Activity Level Multipliers:
              {Object.entries(multipliers).map(
                ([key, value]) => `\n• ${key}: ${value}`
              )}
            </ThemedText>
          </View>

          {/* User Data */}
          {profile && (
            <View style={[styles.box, { backgroundColor: colors.success }]}>
              <ThemedText type="body" bold>
                Your Data
              </ThemedText>
              <ThemedText type="muted">
                BMR:{' '}
                {Math.round(
                  calculateBMR({
                    age: profile.age,
                    gender: profile.gender,
                    height_cm: profile.height_cm,
                    weight_kg: profile.weight_kg,
                  })
                )}{' '}
                kcal
              </ThemedText>
              <ThemedText type="muted">
                Activity: {profile.activity_level?.replace('_', ' ')}
              </ThemedText>
              <ThemedText type="muted">TDEE: {tdee} kcal</ThemedText>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  text: {
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
