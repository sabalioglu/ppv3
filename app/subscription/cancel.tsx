import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Circle as XCircle, ArrowLeft } from 'lucide-react-native';
import { colors, spacing, typography } from '@/lib/theme';

export default function SubscriptionCancel() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleTryAgain = () => {
    router.replace('/subscription');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <XCircle size={80} color={colors.error[500]} />
        </View>

        <Text style={styles.title}>Subscription Canceled</Text>
        
        <Text style={styles.subtitle}>
          Your subscription process was canceled. No charges were made to your account.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
            <Text style={styles.tryAgainButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ArrowLeft size={20} color={colors.neutral[600]} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
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
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  tryAgainButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[0],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    gap: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
  },
});