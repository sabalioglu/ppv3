import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';
import { useTheme } from '@/contexts/ThemeContext';

export default function SubscriptionPage() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SubscriptionManager />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
