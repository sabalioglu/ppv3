import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedText from '@/components/UI/ThemedText';
import ThemedButton from '@/components/UI/ThemedButton';
import { spacing } from '@/lib/theme';

export default function EmailConfirmedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    // Redirect to login in 5 seconds
    const timer = setTimeout(() => {
      router.replace(isWeb ? '/' : '/login');
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
          onPress={() => router.replace(isWeb ? '/' : '/login')}
          text={`Go to ${isWeb ? 'App' : 'Login'}`}
        />

        <ThemedText type="muted" style={styles.redirectText}>
          Redirecting to App in 5 seconds...?{' '}
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
