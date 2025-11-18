import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedText from './ThemedText';
import { spacing } from '@/lib/theme/index';

interface LoadingCardProps {
  statusText?: string;
}

export default function LoadingCard({
  statusText = 'Loading...',
}: LoadingCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body" style={styles.statusText}>
          {statusText}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.lg,
    maxWidth: 300,
  },
  statusText: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
