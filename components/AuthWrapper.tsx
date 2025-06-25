import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import type { Session } from '@supabase/supabase-js';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const { theme } = useTheme();

  useEffect(() => {
    console.log('🔍 Current pathname:', pathname);
    console.log('🔍 Current segments:', segments);

    // Callback route kontrolü
    if (pathname === '/auth/callback' || pathname === '/(auth)/callback') {
      console.log('🔄 In OAuth callback route, skipping auth check');
      setIsLoading(false);
      return;
    }

    // Initial auth check
    checkAuth();

    // Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔐 Auth state changed:', _event, !!session);
      
      // Callback route'undaysa auth state değişikliklerini ignore et
      if (pathname === '/auth/callback' || pathname === '/(auth)/callback') {
        console.log('🔄 Ignoring auth state change in callback route');
        return;
      }
      
      setIsAuthenticated(!!session);

      if (session) {
        await checkProfileCompleteness(session);
      } else {
        setIsProfileComplete(false);
      }
    });

    return () => {
      console.log('🧹 AuthWrapper: Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  useEffect(() => {
    // Callback route'unda ise hiçbir şey yapma
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
        isProfileComplete,
        currentSegments: segments,
        pathname,
        inAuthGroup,
        inTabsGroup
      });

      if (!isAuthenticated && !inAuthGroup) {
        console.log('➡️ Redirecting to login');
        router.replace('/(auth)/login');
      } else if (isAuthenticated && !isProfileComplete && segments[1] !== 'onboarding') {
        console.log('➡️ Redirecting to onboarding');
        router.replace('/(auth)/onboarding');
      } else if (isAuthenticated && isProfileComplete && !inTabsGroup) {
        console.log('➡️ Redirecting to main app');
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isProfileComplete, isLoading, segments, pathname]);

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
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(!!session);

      if (session) {
        console.log('✅ [checkAuth] Session valid, checking profile...');
        await checkProfileCompleteness(session);
      } else {
        console.log('🚫 [checkAuth] No session');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ [checkAuth] Unexpected error:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const checkProfileCompleteness = async (session: Session) => {
    try {
      console.log('👤 [checkProfile] Starting profile completeness check...');
      const user = session.user;
      
      if (!user) {
        console.error('❌ [checkProfile] No user in session');
        setIsProfileComplete(false);
        setIsLoading(false);
        return;
      }

      // Check if profile exists and is complete
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
      console.log('🏁 [checkProfile] Setting loading to false');
      setIsLoading(false);
    }
  };

  // Callback route'unda loading gösterme, direkt children render et
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