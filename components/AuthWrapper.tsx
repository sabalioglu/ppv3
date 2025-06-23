import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const { theme } = useTheme();

  useEffect(() => {
    // İlk yüklemede auth durumunu kontrol et
    checkAuth();
    
    // Auth state değişikliklerini dinle
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔐 Auth state changed:', _event, !!session);
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
  }, []);

  useEffect(() => {
    // Callback route'unda ise hiçbir şey yapma
    if (segments.includes('callback')) {
      console.log('🔄 In callback route, skipping navigation');
      setIsLoading(false);
      return;
    }

    // Navigation logic
    if (!isLoading && initialRoute === null) {
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';
      
      console.log('🧭 Navigation check:', {
        isAuthenticated,
        isProfileComplete,
        currentSegments: segments,
        inAuthGroup,
        inTabsGroup
      });

      let targetRoute = null;

      if (!isAuthenticated) {
        // Giriş yapmamış
        targetRoute = '/(auth)/login';
      } else if (!isProfileComplete) {
        // Profil eksik
        targetRoute = '/(auth)/onboarding';
      } else {
        // Her şey tamam
        targetRoute = '/(tabs)';
      }

      setInitialRoute(targetRoute);

      // Sadece gerekli durumlarda yönlendir
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
  }, [isAuthenticated, isProfileComplete, isLoading, segments, router, initialRoute]);

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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ User fetch error:', userError);
        setIsProfileComplete(false);
        setIsLoading(false);
        return;
      }

      // Profile tablosundan kullanıcı bilgilerini çek
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
        setIsLoading(false);
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
    } catch (error) {
      console.error('❌ Error checking profile completeness:', error);
      setIsProfileComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading durumu
  if (isLoading) {
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
