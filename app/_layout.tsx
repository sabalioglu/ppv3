import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { colors, spacing, typography } from '@/lib/theme';

export default function RootLayout() {
  console.log('🔴 RootLayout component rendering...');
  
  useFrameworkReady();

  const [authLoading, setAuthLoading] = useState(true);

  // SIMPLE TEST - Remove all complexity
  useEffect(() => {
    console.log('🔥 useEffect running - setting 3 second timer');
    
    const timer = setTimeout(() => {
      console.log('🔥 Timer complete - navigating to login');
      setAuthLoading(false);
      router.replace('/auth/welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  console.log('🔴 Current authLoading state:', authLoading);

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingTitle}>Loading...</Text>
          <Text style={styles.loadingText}>Testing useEffect (3 seconds)</Text>
        </View>
      </View>
    );
  }

  console.log('🔴 Rendering Stack navigator');

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  loadingContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: 'Poppins-Bold',
    color: colors.primary[600],
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
    textAlign: 'center',
  },
});