import React from 'react';
import { View, StyleSheet } from 'react-native';

import ThemedText from './ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/lib/theme/index';

type ErrorCardProps = {
  message?: string;
};

const ErrorCard = ({ message }: ErrorCardProps) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.error }]}>
      <ThemedText type="caption" bold style={styles.text}>
        {message}
      </ThemedText>
    </View>
  );
};

export default ErrorCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  text: {
    textAlign: 'center',
  },
});
