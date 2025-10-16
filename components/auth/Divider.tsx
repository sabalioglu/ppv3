import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing } from '@/lib/theme/index';
import ThemedText from '../UI/ThemedText';

const Divider = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.divider}>
      <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
      <ThemedText
        type="caption"
        style={[styles.dividerText, { color: colors.expiryNeutral }]}
      >
        OR
      </ThemedText>
      <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
    </View>
  );
};

export default Divider;

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
  },
});
