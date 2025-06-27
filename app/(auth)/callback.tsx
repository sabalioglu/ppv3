import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function CallbackScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      console.log('🔄 Processing OAuth callback...');
      setStatus('Processing authentication...');
      
      // Supabase SDK handles OAuth redirect automatically
      // We just need to check if session is established
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ OAuth callback error:', error);
        setStatus('Authentication failed');
        Alert.alert('Authentication Error', error.message || 'Failed to process authentication.');
        router.replace('/(auth)/login');
        return;
      }

      if (session && session.user) {
        console.log('✅ OAuth session established:', session.user.id);
        setStatus('Authentication successful! Checking profile...');
        
        // Check profile completeness - simplified but thorough
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, full_name, age, gender, height_cm, weight_kg, activity_level, health_goals')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ Profile fetch error:', profileError);
        }
        
        // Comprehensive profile completeness check
        const isProfileComplete = !!(
          profile?.full_name &&
          profile?.age &&
          profile?.gender &&
          profile?.height_cm &&
          profile?.weight_kg &&
          profile?.activity_level &&
          profile?.health_goals
        );
        
        console.log('📋 Profile completeness:', {
          hasProfile: !!profile,
          isComplete: isProfileComplete
        });
        
        // Navigate based on profile status
        if (isProfileComplete) {
          console.log('✅ Profile complete, redirecting to dashboard');
          setStatus('Redirecting to dashboard...');
          router.replace('/(tabs)');
        } else {
          console.log('✅ Profile incomplete, redirecting to onboarding');
          setStatus('Redirecting to complete profile...');
          router.replace('/(auth)/onboarding');
        }
      } else {
        // No session found - could be timing issue, try once more
        console.log('⚠️ No session found, attempting retry...');
        setStatus('Completing authentication...');
        
        // Single retry after brief delay (OAuth redirects can have timing)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        
        if (retrySession && retrySession.user) {
          console.log('✅ Session established on retry:', retrySession.user.id);
          // Repeat profile check logic
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, full_name, age')
            .eq('id', retrySession.user.id)
            .maybeSingle();
          
          if (profile && profile.full_name && profile.age) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)/onboarding');
          }
        } else {
          console.log('❌ No session after retry, redirecting to login');
          setStatus('Authentication incomplete');
          Alert.alert('Session Missing', 'Could not establish session. Please try signing in again.');
          router.replace('/(auth)/login');
        }
      }
    } catch (error: any) {
      console.error('❌ Callback processing error:', error);
      setStatus('Authentication failed');
      Alert.alert('Error', error.message || 'An unexpected error occurred during authentication.');
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.text, { color: theme.colors.text }]}>
          {status}
        </Text>
        <Text style={[styles.subText, { color: theme.colors.textSecondary }]}>
          This should only take a moment...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    maxWidth: 300,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});
