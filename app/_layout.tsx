import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { User } from 'firebase/auth';
import { AuthService } from '@/lib/authService';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';
import { ChefHat } from 'lucide-react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? 'Authenticated' : 'Not authenticated');
      setUser(user);
      setAuthLoading(false);
      
      // Set initial route based on auth state
      if (user) {
        setInitialRoute('/(tabs)');
      } else {
        setInitialRoute('/auth/welcome');
      }
    });

    return unsubscribe;
  }, []);

  // Navigate to appropriate route when auth state is determined
  useEffect(() => {
    if (!authLoading && initialRoute) {
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        router.replace(initialRoute as any);
      }, 100);
    }
  }, [authLoading, initialRoute]);

  // Hide splash screen when everything is ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authLoading]);

  // Show loading screen while checking auth state or loading fonts
  if (!fontsLoaded && !fontError) {
    return null; // Keep splash screen visible
  }

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ChefHat size={60} color={colors.primary[500]} />
          <Text style={styles.loadingTitle}>Pantry Pal</Text>
          <ActivityIndicator 
            size="large" 
            color={colors.primary[500]} 
            style={styles.loadingSpinner}
          />
          <Text style={styles.loadingText}>Initializing your smart kitchen...</Text>
        </View>
      </View>
    );
  }

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
  loadingSpinner: {
    marginBottom: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
    textAlign: 'center',
  },
});