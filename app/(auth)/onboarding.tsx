import React from 'react';
import OnboardingScreen from '../../screens/OnboardingScreen';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function OnboardingRoute() {
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSignupFlow, setIsSignupFlow] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    checkAuthStatus();
  }, []);

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
            (profile.height || profile.height_cm) && 
            (profile.weight || profile.weight_kg) && 
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
    try {
      console.log('✅ Onboarding completed');
      
      if (isSignupFlow && signupData) {
        // For new users, create account first
        console.log('📝 Creating new account...');
        
        // Here you would typically create the account
        // For now, just redirect to login
        router.replace('/(auth)/login');
      } else {
        // For authenticated users, go to main app
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          router.replace('/(tabs)');
        } else {
          console.error('❌ No session found after onboarding');
          router.replace('/(auth)/login');
        }
      }
    } catch (error) {
      console.error('❌ Error in handleComplete:', error);
      router.replace('/(auth)/login');
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
