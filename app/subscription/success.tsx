import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle, ArrowRight } from 'lucide-react-native';
import { colors, spacing, typography } from '@/lib/theme';

export default function SubscriptionSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={80} color={colors.success[500]} />
        </View>

        <Text style={styles.title}>Welcome to Pantry Pal!</Text>
        
        <Text style={styles.subtitle}>
          Your subscription is now active. You have full access to all premium features.
        </Text>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <CheckCircle size={20} color={colors.success[500]} />
            <Text style={styles.featureText}>Unlimited pantry scanning</Text>
          </View>
          <View style={styles.feature}>
            <CheckCircle size={20} color={colors.success[500]} />
            <Text style={styles.featureText}>AI meal planning</Text>
          </View>
          <View style={styles.feature}>
            <CheckCircle size={20} color={colors.success[500]} />
            <Text style={styles.featureText}>Smart shopping lists</Text>
          </View>
          <View style={styles.feature}>
            <CheckCircle size={20} color={colors.success[500]} />
            <Text style={styles.featureText}>Nutrition tracking</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Start Using Pantry Pal</Text>
          <ArrowRight size={20} color={colors.neutral[0]} />
        </TouchableOpacity>

        <Text style={styles.autoRedirectText}>
          Automatically redirecting in 5 seconds...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.xl,
  },
  featuresContainer: {
    width: '100%',
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
  continueButton: {
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  continueButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[0],
  },
  autoRedirectText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
});