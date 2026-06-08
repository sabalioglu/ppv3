import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Check, Crown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, type Colors } from '@/lib/theme/index';
import { colors as palette } from '@/lib/theme/index';
import { Product } from '@/src/stripe-config';

interface SubscriptionCardProps {
  product: Product;
  isActive?: boolean;
  onSubscribe: (priceId: string) => void;
  loading?: boolean;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  product,
  isActive = false,
  onSubscribe,
  loading = false,
}) => {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const handleSubscribe = () => {
    if (!loading && !isActive) {
      onSubscribe(product.priceId);
    }
  };

  return (
    <View style={[styles.card, isActive && styles.activeCard]}>
      {isActive && (
        <View style={styles.activeBadge}>
          <Crown size={16} color={colors.warning} />
          <Text style={styles.activeBadgeText}>Current Plan</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.price}>$9.00/month</Text>
      </View>

      <Text style={styles.description}>{product.description}</Text>

      <View style={styles.features}>
        <View style={styles.feature}>
          <Check size={16} color={colors.success} />
          <Text style={styles.featureText}>Unlimited pantry scanning</Text>
        </View>
        <View style={styles.feature}>
          <Check size={16} color={colors.success} />
          <Text style={styles.featureText}>AI meal planning</Text>
        </View>
        <View style={styles.feature}>
          <Check size={16} color={colors.success} />
          <Text style={styles.featureText}>Smart shopping lists</Text>
        </View>
        <View style={styles.feature}>
          <Check size={16} color={colors.success} />
          <Text style={styles.featureText}>Nutrition tracking</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.subscribeButton,
          isActive && styles.activeButton,
          loading && styles.loadingButton,
        ]}
        onPress={handleSubscribe}
        disabled={loading || isActive}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text
            style={[
              styles.subscribeButtonText,
              isActive && styles.activeButtonText,
            ]}
          >
            {isActive ? 'Active' : 'Subscribe'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.xl,
      marginBottom: spacing.lg,
      borderWidth: 2,
      borderColor: colors.border,
      position: 'relative',
    },
    activeCard: {
      borderColor: palette.warning[600],
      backgroundColor: palette.warning[50],
    },
    activeBadge: {
      position: 'absolute',
      top: -1,
      right: spacing.lg,
      backgroundColor: palette.warning[500],
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 12,
      gap: spacing.xs,
    },
    activeBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.neutral[0],
    },
    header: {
      marginBottom: spacing.lg,
    },
    productName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    price: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.primary,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: spacing.xl,
    },
    features: {
      marginBottom: spacing.xl,
      gap: spacing.md,
    },
    feature: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    featureText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    subscribeButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    activeButton: {
      backgroundColor: colors.border,
    },
    loadingButton: {
      backgroundColor: palette.neutral[400],
    },
    subscribeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textOnPrimary,
    },
    activeButtonText: {
      color: colors.textSecondary,
    },
  });
