import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Check, Crown } from 'lucide-react-native';
import { colors, spacing, typography } from '@/lib/theme';
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
  const handleSubscribe = () => {
    if (!loading && !isActive) {
      onSubscribe(product.priceId);
    }
  };

  return (
    <View style={[styles.card, isActive && styles.activeCard]}>
      {isActive && (
        <View style={styles.activeBadge}>
          <Crown size={16} color={colors.warning[600]} />
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
          <Check size={16} color={colors.success[500]} />
          <Text style={styles.featureText}>Unlimited pantry scanning</Text>
        </View>
        <View style={styles.feature}>
          <Check size={16} color={colors.success[500]} />
          <Text style={styles.featureText}>AI meal planning</Text>
        </View>
        <View style={styles.feature}>
          <Check size={16} color={colors.success[500]} />
          <Text style={styles.featureText}>Smart shopping lists</Text>
        </View>
        <View style={styles.feature}>
          <Check size={16} color={colors.success[500]} />
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
          <Text style={[styles.subscribeButtonText, isActive && styles.activeButtonText]}>
            {isActive ? 'Active' : 'Subscribe'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    position: 'relative',
  },
  activeCard: {
    borderColor: colors.warning[400],
    backgroundColor: colors.warning[50],
  },
  activeBadge: {
    position: 'absolute',
    top: -1,
    right: spacing.lg,
    backgroundColor: colors.warning[500],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    gap: spacing.xs,
  },
  activeBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.neutral[0],
  },
  header: {
    marginBottom: spacing.lg,
  },
  productName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.primary[600],
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
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
    fontSize: typography.fontSize.base,
    color: colors.neutral[700],
  },
  subscribeButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: colors.neutral[300],
  },
  loadingButton: {
    backgroundColor: colors.neutral[400],
  },
  subscribeButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[0],
  },
  activeButtonText: {
    color: colors.neutral[600],
  },
});