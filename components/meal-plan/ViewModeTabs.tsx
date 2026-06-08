//components/meal-plan/ViewModeTabs.tsx
// Daily/Weekly/Monthly tabs component will go here
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, type Colors } from '@/lib/theme/index';
import { colors as palette } from '@/lib/theme/index';

interface ViewModeTabsProps {
  viewMode: 'daily' | 'weekly' | 'monthly';
  onViewModeChange: (mode: 'daily' | 'weekly' | 'monthly') => void;
}

export default function ViewModeTabs({
  viewMode,
  onViewModeChange,
}: ViewModeTabsProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.viewModeTabs}>
      <TouchableOpacity
        style={[styles.tab, viewMode === 'daily' && styles.activeTab]}
        onPress={() => onViewModeChange('daily')}
      >
        <Text
          style={[styles.tabText, viewMode === 'daily' && styles.activeTabText]}
        >
          Daily
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, viewMode === 'weekly' && styles.activeTab]}
        onPress={() => onViewModeChange('weekly')}
      >
        <Text
          style={[
            styles.tabText,
            viewMode === 'weekly' && styles.activeTabText,
          ]}
        >
          Weekly
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, viewMode === 'monthly' && styles.activeTab]}
        onPress={() => onViewModeChange('monthly')}
      >
        <Text
          style={[
            styles.tabText,
            viewMode === 'monthly' && styles.activeTabText,
          ]}
        >
          Monthly
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: Colors) =>
  StyleSheet.create({
    viewModeTabs: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
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
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    activeTabText: {
      color: palette.primary[600],
      fontWeight: '700',
    },
  });
