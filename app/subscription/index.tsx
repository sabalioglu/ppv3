import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';
import { colors } from '@/lib/theme';

export default function SubscriptionPage() {
  return (
    <View style={styles.container}>
      <SubscriptionManager />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
});