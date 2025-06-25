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

    // İlk yüklemede auth durumunu kontrol et
    checkAuth();

    // Auth state değişikliklerini dinle
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔐 Auth state changed:', _event, !!session);
      console.log('📊 Session details:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at
      });

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

    // Loading bittiyse navigation kontrolü yap
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

      // Direkt yönlendir
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
      console.log('⏰ [checkAuth] Timestamp:', new Date().toISOString());
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('📋 [checkAuth] Session check result:', {
        hasSession: !!session,
        error: error?.message || null,
        sessionUserId: session?.user?.id,
        sessionEmail: session?.user?.email,
        accessToken: session?.access_token ? 'Present' : 'Missing',
        refreshToken: session?.refresh_token ? 'Present' : 'Missing',
        expiresAt: session?.expires_at
      });

      if (error) {
        console.error('❌ [checkAuth] Auth check error:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const isAuth = !!session;
      console.log('🔐 [checkAuth] Setting isAuthenticated to:', isAuth);
      setIsAuthenticated(isAuth);

      if (isAuth && session) {
        console.log('✅ [checkAuth] Session valid, checking profile...');
        await checkProfileCompleteness(session);
      } else {
        console.log('🚫 [checkAuth] No session, setting loading to false');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ [checkAuth] Unexpected error:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const checkProfileCompleteness = async (session?: Session) => {
    try {
      console.log('👤 [checkProfile] Starting profile completeness check...');
      console.log('⏰ [checkProfile] Timestamp:', new Date().toISOString());
      
      let currentSession = session;
      
      // If no session passed, get current session
      if (!currentSession) {
        console.log('🔍 [checkProfile] No session passed, fetching current session...');
        const { data: { session: fetchedSession }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('📋 [checkProfile] Session fetch result:', {
          hasSession: !!fetchedSession,
          sessionError: sessionError?.message || null,
          userId: fetchedSession?.user?.id,
          email: fetchedSession?.user?.email
        });
        
        if (sessionError || !fetchedSession) {
          console.error('❌ [checkProfile] Session error:', sessionError || 'No session found');
          setIsProfileComplete(false);
          setIsLoading(false);
          return;
        }
        
        currentSession = fetchedSession;
      }

      console.log('✅ [checkProfile] Using session:', {
        userId: currentSession.user?.id,
        email: currentSession.user?.email
      });

      // Get user from session
      const user = currentSession.user;
      if (!user) {
        console.error('❌ [checkProfile] No user in session');
        setIsProfileComplete(false);
        setIsLoading(false);
        return;
      }

      console.log('✅ [checkProfile] User found, checking profile data...');
      await checkUserProfile(user);
      
    } catch (error) {
      console.error('❌ [checkProfile] Unexpected error:', error);
      setIsProfileComplete(false);
      setIsLoading(false);
    }
  };

  // Helper function - profile kontrolü için
  const checkUserProfile = async (user: any) => {
    try {
      console.log('🔍 [checkUserProfile] Fetching profile for user:', user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      console.log('📋 [checkUserProfile] Profile fetch result:', {
        hasProfile: !!profile,
        error: profileError?.message || null,
        profileId: profile?.id
      });

      if (profileError) {
        console.warn('⚠️ [checkUserProfile] Profile fetch warning:', profileError);
        // Profile yoksa oluştur
        if (profileError.code === 'PGRST116') {
          console.log('📝 [checkUserProfile] Creating new profile...');
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([{
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              created_at: new Date().toISOString(),
              dietary_preferences: [],
              notification_settings: {
                expiry_alerts: true,
                recipe_suggestions: true,
                shopping_reminders: true
              },
              streak_days: 0
            }]);

          if (insertError) {
            console.error('❌ [checkUserProfile] Profile creation error:', insertError);
          } else {
            console.log('✅ [checkUserProfile] User profile created successfully');
          }
        }
        setIsProfileComplete(false);
        return;
      }

      // Profil tamamlanmış mı kontrol et
      const isComplete = !!(
        profile &&
        profile.age &&
        profile.gender &&
        (profile.height || profile.height_cm) &&
        (profile.weight || profile.weight_kg) &&
        profile.activity_level &&
        profile.health_goals
      );

      console.log('✅ [checkUserProfile] Profile completeness check:', {
        isComplete,
        hasAge: !!profile?.age,
        hasGender: !!profile?.gender,
        hasHeight: !!(profile?.height || profile?.height_cm),
        hasWeight: !!(profile?.weight || profile?.weight_kg),
        hasActivityLevel: !!profile?.activity_level,
        hasHealthGoals: !!profile?.health_goals
      });
      
      setIsProfileComplete(isComplete);
    } finally {
      console.log('🏁 [checkUserProfile] Setting loading to false');
      setIsLoading(false);
    }
  };

  // Callback route'unda loading gösterme
  if (isLoading && pathname !== '/auth/callback' && pathname !== '/(auth)/callback') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Children'ı render et
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});