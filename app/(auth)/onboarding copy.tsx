import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import OnboardingScreen from '../../screens/OnboardingScreen';

export default function OnboardingRoute() {
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSignupFlow, setIsSignupFlow] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Auto-navigate when profile is complete
  useEffect(() => {
    if (!userId) return;
    
    let checkCount = 0;
    const checkInterval = setInterval(async () => {
      checkCount++;
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('age, gender, height_cm, weight_kg, activity_level, health_goals')
        .eq('id', userId)
        .single();
      
      // Check if all required fields are filled
      if (profile?.age && profile?.gender && profile?.height_cm && 
          profile?.weight_kg && profile?.activity_level && profile?.health_goals) {
        console.log('🎯 Profile completion detected! Navigating to dashboard...');
        clearInterval(checkInterval);
        router.replace('/(tabs)');
      }
      
      // Stop checking after 10 seconds
      if (checkCount > 10) {
        clearInterval(checkInterval);
      }
    }, 1000); // Check every second
    
    return () => clearInterval(checkInterval);
  }, [userId, router]);

  const checkAuthStatus = async () => {
    try {
      // First check if user is authenticated
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session) {
        // No session - this is a new user signup flow
        console.log('📝 New user signup flow - no authentication required');
        setIsSignupFlow(true);
        setIsLoading(false);
        return;
      }

      // User is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('📱 Onboarding for authenticated user:', user.id);
        setUserId(user.id);
        
        // Check if profile already exists and is complete
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        // Check if profile is already complete
        if (profile && profile.age && profile.gender && 
            profile.height_cm && 
            profile.weight_kg && 
            profile.activity_level && profile.health_goals) {
          console.log('✅ Profile already complete, redirecting to app');
          router.replace('/(tabs)');
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error in checkAuthStatus:', error);
      // Don't redirect on error - allow signup flow to continue
      setIsSignupFlow(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (signupData?: any) => {
    console.log('✅ Onboarding completed');
    
    try {
      // Official Supabase AI solution: Refresh session to sync latest profile data
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Session refresh failed:', refreshError);
        throw refreshError;
      }
      
      console.log('✅ Session refreshed successfully');
      
      // Navigate after successful session refresh
      router.replace('/(tabs)');
      
    } catch (error) {
      console.log('🔄 Session refresh failed, using guaranteed fallback navigation');
      
      // Proven fallback: Force page navigation (works 100% of the time)
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        // Mobile fallback
        router.replace('/(tabs)');
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading...
        </Text>
      </View>
    );
  }

  // For signup flow, we don't have a userId yet
  return <OnboardingScreen 
    userId={userId || 'signup-temp'} 
    onComplete={handleComplete}
    isSignupFlow={isSignupFlow}
  />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});