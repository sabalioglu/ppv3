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
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Error getting user:', error);
        router.replace('/(auth)/login');
        return;
      }

      if (user) {
        console.log('📱 Onboarding for user:', user.id);
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
      } else {
        console.error('❌ No user found in onboarding');
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('❌ Error in checkUser:', error);
      router.replace('/(auth)/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      console.log('✅ Onboarding completed, redirecting...');
      
      // Force a session refresh to ensure profile completeness is updated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        console.error('❌ No session found after onboarding');
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('❌ Error in handleComplete:', error);
      // Try to navigate anyway
      router.replace('/(tabs)');
    }
  };

  if (isLoading || !userId) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading user data...
        </Text>
      </View>
    );
  }

  return <OnboardingScreen userId={userId} onComplete={handleComplete} />;
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
