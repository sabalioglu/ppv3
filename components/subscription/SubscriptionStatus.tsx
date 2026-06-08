import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Crown, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, type Colors } from '@/lib/theme/index';
import { supabase } from '@/lib/supabase';

interface SubscriptionData {
  subscription_status: string;
  price_id: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

export const SubscriptionStatus: React.FC = () => {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error loading subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionName = (priceId: string): string => {
    if (priceId === 'price_1S0JK3Emd2R9npIslZBvpCQK') {
      return 'Pantry Pal';
    }
    return 'Unknown Plan';
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'trialing':
        return colors.accent;
      case 'past_due':
      case 'canceled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      case 'incomplete':
        return 'Incomplete';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading subscription...</Text>
      </View>
    );
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <View style={styles.noSubscriptionContainer}>
        <AlertCircle size={20} color={colors.textSecondary} />
        <Text style={styles.noSubscriptionText}>No active subscription</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusHeader}>
        <Crown
          size={20}
          color={getStatusColor(subscription.subscription_status)}
        />
        <Text style={styles.planName}>
          {getSubscriptionName(subscription.price_id)}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: `${getStatusColor(subscription.subscription_status)}20`,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(subscription.subscription_status) },
            ]}
          >
            {getStatusText(subscription.subscription_status)}
          </Text>
        </View>
      </View>

      {subscription.current_period_end && (
        <Text style={styles.renewalText}>
          {subscription.cancel_at_period_end
            ? `Expires on ${formatDate(subscription.current_period_end)}`
            : `Renews on ${formatDate(subscription.current_period_end)}`}
        </Text>
      )}
    </View>
  );
};

const getStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    noSubscriptionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    noSubscriptionText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    planName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    renewalText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });
