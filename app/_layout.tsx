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
import { getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { AuthService } from '@/lib/authService';
import { auth } from '@/lib/firebaseConfig';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';
import { ChefHat } from 'lucide-react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<string>('/auth/welcome');

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

  // 🔧 REFINED FIX: Enhanced auth check with proper timeout handling
  useEffect(() => {
    let mounted = true;
    let authTimeoutId: NodeJS.Timeout;
    let authResolved = false;
    
    console.log('🔄 Starting auth check process...');
    
    // SAFETY TIMEOUT - Force resolution after 8 seconds
    authTimeoutId = setTimeout(() => {
      if (mounted && authLoading && !authResolved) {
        console.log('⏰ Auth check timeout - forcing login screen');
        authResolved = true;
        setAuthLoading(false);
        setUser(null);
        setInitialRoute('/auth/welcome');
        router.replace('/auth/welcome');
      }
    }, 8000);
    
    const performAuthCheck = async () => {
      try {
        console.log('🔍 Step 1: Checking redirect result...');
        
        // Check for Google redirect result
        const result = await getRedirectResult(auth);
        if (result && mounted && !authResolved) {
          console.log('🎉 Google redirect result found:', result.user.email);
          authResolved = true;
          clearTimeout(authTimeoutId);
          setUser(result.user);
          setAuthLoading(false);
          setInitialRoute('/(tabs)');
          router.replace('/(tabs)');
          return;
        }
        
        console.log('🔍 Step 2: Checking current user...');
        
        // Check current user state
        const currentUser = auth.currentUser;
        if (currentUser && mounted && !authResolved) {
          console.log('👤 Current user found:', currentUser.email);
          authResolved = true;
          clearTimeout(authTimeoutId);
          setUser(currentUser);
          setAuthLoading(false);
          setInitialRoute('/(tabs)');
          router.replace('/(tabs)');
          return;
        }
        
        console.log('🔍 Step 3: Setting up auth state listener...');
        
        // Set up auth state listener as final check
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (!mounted || authResolved) return;
          
          console.log('🔥 Auth state listener fired:', user ? `User: ${user.email}` : 'No user');
          authResolved = true;
          clearTimeout(authTimeoutId);
          
          if (user) {
            setUser(user);
            setAuthLoading(false);
            setInitialRoute('/(tabs)');
            router.replace('/(tabs)');
          } else {
            setUser(null);
            setAuthLoading(false);
            setInitialRoute('/auth/welcome');
            router.replace('/auth/welcome');
          }
        });
        
        return unsubscribe;
        
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        if (mounted && !authResolved) {
          authResolved = true;
          clearTimeout(authTimeoutId);
          setUser(null);
          setAuthLoading(false);
          setInitialRoute('/auth/welcome');
          router.replace('/auth/welcome');
        }
      }
    };
    
    performAuthCheck();
    
    return () => {
      mounted = false;
      authResolved = true;
      if (authTimeoutId) {
        clearTimeout(authTimeoutId);
      }
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