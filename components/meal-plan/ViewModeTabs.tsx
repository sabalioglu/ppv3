//components/meal-plan/ViewModeTabs.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';

interface ViewModeTabsProps {
  viewMode: 'daily' | 'weekly' | 'monthly';
  onViewModeChange: (mode: 'daily' | 'weekly' | 'monthly') => void;
}

export default function ViewModeTabs({ viewMode, onViewModeChange }: ViewModeTabsProps) {
  return (
    <View style={styles.viewModeTabs}>
      <TouchableOpacity
        style={[styles.tab, viewMode === 'daily' && styles.activeTab]}
        onPress={() => onViewModeChange('daily')}
      >
        <Text style={[styles.tabText, viewMode === 'daily' && styles.activeTabText]}>
          Daily
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, viewMode === 'weekly' && styles.activeTab]}
        onPress={() => onViewModeChange('weekly')}
      >
        <Text style={[styles.tabText, viewMode === 'weekly' && styles.activeTabText]}>
          Weekly
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, viewMode === 'monthly' && styles.activeTab]}
        onPress={() => onViewModeChange('monthly')}
      >
        <Text style={[styles.tabText, viewMode === 'monthly' && styles.activeTabText]}>
          Monthly
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  viewModeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary[600],
    fontWeight: '700',
  },
});
