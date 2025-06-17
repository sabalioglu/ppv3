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

  // Handle Google redirect result on app startup
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        console.log('🔍 Checking for Google redirect result...');
        const user = await AuthService.handleGoogleRedirectResult();
        if (user) {
          console.log('✅ Google redirect result processed successfully:', user.email);
        }
      } catch (error) {
        console.error('❌ Google redirect result error:', error);
      }
    };

    handleRedirectResult();
  }, []);

  // 🔧 FIXED: Enhanced auth state listener with infinite loop prevention
  useEffect(() => {
    let mounted = true;
    let hasProcessedAuth = false;
    
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      if (!mounted || hasProcessedAuth) return;
      
      console.log('🔥 Auth state changed:', user ? `LOGGED IN: ${user.email}` : 'NOT LOGGED IN');
      
      if (user) {
        hasProcessedAuth = true;
        console.log('✅ User authenticated, setting up navigation...');
        setUser(user);
        setAuthLoading(false);
        setInitialRoute('/(tabs)');
        
        // IMMEDIATE NAVIGATION - NO TIMEOUT
        console.log('🚀 Navigating to tabs immediately...');
        router.replace('/(tabs)');
      } else {
        console.log('❌ No user, redirecting to auth...');
        setUser(null);
        setAuthLoading(false);
        setInitialRoute('/auth/welcome');
      }
    });

    return () => {
      mounted = false;
      hasProcessedAuth = false;
      unsubscribe();
    };
  }, []);

  // Hide splash screen when everything is ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && !authLoading) {
      console.log('🎨 Hiding splash screen...');
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
          <Text style={styles.loadingText}>Checking authentication...</Text>
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