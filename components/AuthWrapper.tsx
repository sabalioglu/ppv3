import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

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

      // Callback route'undaysa auth state değişikliklerini ignore et
      if (pathname === '/auth/callback' || pathname === '/(auth)/callback') {
        console.log('🔄 Ignoring auth state change in callback route');
        return;
      }

      setIsAuthenticated(!!session);

      if (session) {
        await checkProfileCompleteness();
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
      console.log('🔍 Checking authentication...');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Auth check error:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const isAuth = !!session;
      console.log('🔐 Auth check result:', isAuth);
      setIsAuthenticated(isAuth);

      if (isAuth && session) {
        await checkProfileCompleteness();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Error checking auth:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const checkProfileCompleteness = async () => {
    try {
      console.log('👤 Checking profile completeness...');
      
      // ÖNCELİKLE SESSION'I KONTROL ET
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ Session error:', sessionError);
        setIsProfileComplete(false);
        setIsLoading(false);
        return;
      }

      // SESSION VARSA USER'I AL
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('❌ User fetch error:', userError);
        
        // SESSION VAR AMA USER YOK - REFRESH ET
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError && refreshData.session) {
          console.log('✅ Session refreshed successfully');
          // Refresh sonrası tekrar dene
          const { data: { user: refreshedUser } } = await supabase.auth.getUser();
          if (refreshedUser) {
            await checkUserProfile(refreshedUser);
            return;
          }
        }
        
        setIsProfileComplete(false);
        setIsLoading(false);
        return;
      }

      // USER VARSA PROFILE KONTROL ET
      await checkUserProfile(user);
      
    } catch (error) {
      console.error('❌ Error checking profile completeness:', error);
      setIsProfileComplete(false);
      setIsLoading(false);
    }
  };

  // Helper function - profile kontrolü için
  const checkUserProfile = async (user: any) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('⚠️ Profile fetch warning:', profileError);
        // Profile yoksa oluştur
        if (profileError.code === 'PGRST116') {
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
            console.error('❌ Profile creation error:', insertError);
          } else {
            console.log('✅ User profile created successfully');
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

      console.log('✅ Profile completeness:', isComplete, profile);
      setIsProfileComplete(isComplete);
    } finally {
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
