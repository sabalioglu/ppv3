import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import type { Session } from '@supabase/supabase-js';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const { theme } = useTheme();

  useEffect(() => {
    console.log('🔍 Current pathname:', pathname);
    console.log('🔍 Current segments:', segments);

    // Skip auth check for callback route
    if (pathname === '/auth/callback' || pathname === '/(auth)/callback') {
      console.log('🔄 In OAuth callback route, skipping auth check');
      setIsLoading(false);
      return;
    }

    // Initial auth check
    checkAuth();

    // Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, !!session);
      
      // Skip auth state changes in callback route
      if (pathname === '/auth/callback' || pathname === '/(auth)/callback') {
        console.log('🔄 Ignoring auth state change in callback route');
        return;
      }
      
      if (session) {
        setIsAuthenticated(true);
        await checkEmailVerificationAndProfile(session);
      } else {
        setIsAuthenticated(false);
        setIsEmailVerified(false);
        setIsProfileComplete(false);
        setIsLoading(false);
      }
    });

    return () => {
      console.log('🧹 AuthWrapper: Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  useEffect(() => {
    // Skip navigation logic for callback route
    if (pathname === '/auth/callback' || pathname === '/(auth)/callback') {
      console.log('🔄 In callback route, skipping navigation logic');
      return;
    }

    // Navigation logic
    if (!isLoading) {
      const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'auth';
      const inTabsGroup = segments[0] === '(tabs)' || segments[0] === 'tabs';

      console.log('🧭 Navigation check:', {
        isAuthenticated,
        isEmailVerified,
        isProfileComplete,
        currentSegments: segments,
        pathname,
        inAuthGroup,
        inTabsGroup
      });

      if (!isAuthenticated && !inAuthGroup) {
        console.log('➡️ Redirecting to login - not authenticated');
        router.replace('/(auth)/login');
      } else if (isAuthenticated && !isEmailVerified) {
        console.log('➡️ User authenticated but email not verified');
        handleUnverifiedEmail();
      } else if (isAuthenticated && isEmailVerified && !isProfileComplete && segments[1] !== 'onboarding') {
        console.log('➡️ Redirecting to onboarding - profile incomplete');
        router.replace('/(auth)/onboarding');
      } else if (isAuthenticated && isEmailVerified && isProfileComplete && !inTabsGroup) {
        console.log('➡️ Redirecting to main app - all complete');
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isEmailVerified, isProfileComplete, isLoading, segments, pathname]);

  const checkAuth = async () => {
    try {
      console.log('🔍 [checkAuth] Starting authentication check...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('📋 [checkAuth] Session check result:', {
        hasSession: !!session,
        error: error?.message || null
      });

      if (error) {
        console.error('❌ [checkAuth] Auth check error:', error);
        setIsAuthenticated(false);
        setIsEmailVerified(false);
        setIsProfileComplete(false);
        setIsLoading(false);
        return;
      }

      if (session) {
        console.log('✅ [checkAuth] Session valid, checking email and profile...');
        setIsAuthenticated(true);
        await checkEmailVerificationAndProfile(session);
      } else {
        console.log('🚫 [checkAuth] No session');
        setIsAuthenticated(false);
        setIsEmailVerified(false);
        setIsProfileComplete(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ [checkAuth] Unexpected error:', error);
      setIsAuthenticated(false);
      setIsEmailVerified(false);
      setIsProfileComplete(false);
      setIsLoading(false);
    }
  };

  const checkEmailVerificationAndProfile = async (session: Session) => {
    try {
      console.log('📧 [checkEmailVerification] Starting email verification check...');
      const user = session.user;
      
      if (!user) {
        console.error('❌ [checkEmailVerification] No user in session');
        setIsEmailVerified(false);
        setIsProfileComplete(false);
        setIsLoading(false);
        return;
      }

      // Check email verification
      const emailVerified = !!user.email_confirmed_at;
      console.log('📧 [checkEmailVerification] Email verified:', emailVerified);
      setIsEmailVerified(emailVerified);

      if (!emailVerified) {
        setIsProfileComplete(false);
        setIsLoading(false);
        return;
      }

      // Check profile completeness
      console.log('👤 [checkProfile] Starting profile completeness check...');
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      console.log('📋 [checkProfile] Profile fetch result:', {
        hasProfile: !!profile,
        error: error?.message || null
      });

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [checkProfile] Profile fetch error:', error);
      }

      const isComplete = !!(
        profile &&
        profile.age &&
        profile.gender &&
        (profile.height || profile.height_cm) &&
        (profile.weight || profile.weight_kg) &&
        profile.activity_level &&
        profile.health_goals
      );

      console.log('✅ [checkProfile] Profile completeness:', isComplete);
      setIsProfileComplete(isComplete);
    } finally {
      console.log('🏁 [checkEmailVerificationAndProfile] Setting loading to false');
      setIsLoading(false);
    }
  };

  const handleUnverifiedEmail = async () => {
    try {
      console.log('📧 Handling unverified email - signing out user');
      
      Alert.alert(
        'Email Verification Required',
        'Please check your email and click the verification link before accessing the app. You will be signed out now.',
        [
          {
            text: 'Resend Email',
            onPress: async () => {
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email) {
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: user.email,
                  });
                  
                  if (error) {
                    Alert.alert('Error', 'Failed to resend verification email. Please try again.');
                  } else {
                    Alert.alert('Email Sent', 'Verification email has been resent. Please check your inbox.');
                  }
                }
                
                // Sign out after resending
                await supabase.auth.signOut();
                router.replace('/(auth)/login');
              } catch (error) {
                console.error('Error resending email:', error);
                await supabase.auth.signOut();
                router.replace('/(auth)/login');
              }
            }
          },
          {
            text: 'OK',
            onPress: async () => {
              await supabase.auth.signOut();
              router.replace('/(auth)/login');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error handling unverified email:', error);
      router.replace('/(auth)/login');
    }
  };

  // Skip loading screen for callback route
  if (pathname === '/auth/callback' || pathname === '/(auth)/callback') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});