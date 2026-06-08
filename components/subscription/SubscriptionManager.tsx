import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, type Colors } from '@/lib/theme/index';
import { supabase } from '@/lib/supabase';
import { products } from '@/src/stripe-config';
import { SubscriptionCard } from './SubscriptionCard';
import { SubscriptionStatus } from './SubscriptionStatus';

interface SubscriptionData {
  subscription_status: string;
  price_id: string;
}

export const SubscriptionManager: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id')
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

  const handleSubscribe = async (priceId: string) => {
    try {
      setCheckoutLoading(priceId);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        Alert.alert('Authentication Required', 'Please log in to subscribe');
        return;
      }

      const baseUrl =
        Platform.OS === 'web'
          ? window.location.origin
          : 'https://your-app-domain.com'; // Replace with your actual domain

      const response = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: priceId,
          success_url: `${baseUrl}/subscription/success`,
          cancel_url: `${baseUrl}/subscription/cancel`,
          mode: 'subscription',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to create checkout session',
        );
      }

      const { url } = response.data;

      if (Platform.OS === 'web') {
        window.location.href = url;
      } else {
        const result = await WebBrowser.openBrowserAsync(url);
        if (result.type === 'cancel') {
          // User canceled, refresh subscription status
          await loadSubscription();
        }
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to start subscription process',
      );
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading subscription details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscription Plans</Text>
        <Text style={styles.subtitle}>
          Choose the plan that works best for you
        </Text>
      </View>

      <SubscriptionStatus />

      <View style={styles.plansContainer}>
        {products.map((product) => (
          <SubscriptionCard
            key={product.priceId}
            product={product}
            isActive={
              subscription?.price_id === product.priceId &&
              subscription?.subscription_status === 'active'
            }
            onSubscribe={handleSubscribe}
            loading={checkoutLoading === product.priceId}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All subscriptions include a 7-day free trial. Cancel anytime.
        </Text>
      </View>
    </ScrollView>
  );
};

const getStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    header: {
      padding: spacing.xl,
      paddingTop: 60,
    },
    title: {
      fontSize: 30,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    plansContainer: {
      paddingHorizontal: spacing.xl,
    },
    footer: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
