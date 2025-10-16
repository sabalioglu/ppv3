import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedText from '@/components/UI/ThemedText';
import ThemedButton from '@/components/UI/ThemedButton';
import { spacing } from '@/lib/theme';

export default function EmailConfirmedScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    // Redirect to login in 5 seconds
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.primary + '20' },
          ]}
        >
          <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
        </View>

        <ThemedText type="heading" bold style={styles.title}>
          Email Verified! 🎉
        </ThemedText>

        <ThemedText type="subheading" style={styles.subtitle}>
          Your email has been successfully verified.
        </ThemedText>

        <ThemedButton
          onPress={() => router.replace('/login')}
          text="Go to Login"
        />

        <ThemedText
          type="caption"
          style={[styles.redirectText, { color: colors.textSecondary }]}
        >
          Redirecting to login in 5 seconds...?{' '}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  redirectText: {
    marginTop: 20,
  },
});
