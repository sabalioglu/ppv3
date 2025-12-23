import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, shadows, radius } from '@/lib/theme/index';
import ThemedText from '../UI/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';

interface EmptyStateProps {
  icon: any;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}
const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  actionText,
  onAction,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
      <View style={styles.emptyIcon}>
        <Icon size={48} color={colors.primary} />
      </View>
      <ThemedText bold style={styles.emptyTitle}>
        {title}
      </ThemedText>
      <ThemedText type="muted" style={styles.emptyMessage}>
        {message}
      </ThemedText>
      {actionText && onAction && (
        <TouchableOpacity
          style={[styles.emptyAction, { backgroundColor: colors.primary }]}
          onPress={onAction}
        >
          <ThemedText type="label" bold>
            {actionText}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    width: '50%',
    alignItems: 'center',
    alignSelf: 'center',
    padding: spacing.xl,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyAction: {
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
});

export default EmptyState;
