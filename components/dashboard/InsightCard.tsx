import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import {
  TrendingUp,
  AlertTriangle,
  Target,
  Award,
  ChevronRight,
} from 'lucide-react-native';
import { radius, spacing, shadows } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedText from '../UI/ThemedText';

interface InsightCardProps {
  title: string;
  description?: string;
  type: 'success' | 'warning' | 'info';
  value?: string | number;
}
const InsightCard = (props: InsightCardProps) => {
  const { title, description, type = 'primary', value } = props;
  const { colors } = useTheme();

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { Icon: TrendingUp, color: colors.success };
      case 'warning':
        return { Icon: AlertTriangle, color: colors.warning };
      case 'info':
        return { Icon: Target, color: colors.info };
      default:
        return { Icon: Award, color: colors.primary };
    }
  };

  const { Icon, color } = getIconConfig();

  return (
    <TouchableOpacity
      style={[styles.insightCard, { backgroundColor: colors.surface }]}
    >
      <View style={[styles.insightIcon, { backgroundColor: `${color}20` }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.insightContent}>
        <ThemedText type="body" bold>
          {title}
        </ThemedText>
        <ThemedText type="muted">{description}</ThemedText>
        {value && (
          <ThemedText bold style={{ color: color, marginTop: spacing.xs }}>
            {value}
          </ThemedText>
        )}
      </View>
      <ChevronRight size={16} color={colors.overlay} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  insightContent: {
    flex: 1,
  },
});
export default InsightCard;
