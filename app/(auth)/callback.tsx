import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function CallbackScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      setStatus('Processing authentication...');
      
      let url: string | null = null;
      
      if (Platform.OS === 'web') {
        // Web: Parse URL from window.location
        if (typeof window !== 'undefined') {
          // Check both hash and search params for tokens
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const searchParams = new URLSearchParams(window.location.search);
          
          const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
          const error = hashParams.get('error') || searchParams.get('error');
          const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
          
          if (error) {
            throw new Error(errorDescription || error);
          }
          
          if (accessToken && refreshToken) {
            console.log('🔑 Setting session with tokens from URL');
            
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) throw sessionError;
            
            console.log('✅ Session set successfully');
            setStatus('Authentication successful! Redirecting...');
            
            // Check if user has completed profile
            if (data.user) {
              await checkProfileAndRedirect(data.user.id);
            } else {
              router.replace('/(tabs)');
            }
            return;
          }
        }
      } else {
        // Mobile: Get URL from Linking
        url = await Linking.getInitialURL();
        
        if (!url) {
          // Try to get URL from the current state
          const currentUrl = await Linking.getInitialURL();
          url = currentUrl;
        }
      }
      
      if (url) {
        console.log('📱 Processing mobile callback URL:', url);
        
        // Parse URL for mobile
        const parsedUrl = Linking.parse(url);
        const params = parsedUrl.queryParams;
        
        if (params?.error) {
          throw new Error(params.error_description as string || params.error as string);
        }
        
        if (params?.access_token && params?.refresh_token) {
          console.log('🔑 Setting session with tokens from mobile URL');
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token as string,
            refresh_token: params.refresh_token as string,
          });
          
          if (sessionError) throw sessionError;
          
          console.log('✅ Mobile session set successfully');
          setStatus('Authentication successful! Redirecting...');
          
          // Check if user has completed profile
          if (data.user) {
            await checkProfileAndRedirect(data.user.id);
          } else {
            router.replace('/(tabs)');
          }
          return;
        }
      }
      
      // If we get here, no valid tokens were found
      console.log('⚠️ No valid tokens found in callback');
      setStatus('No authentication data found. Redirecting to login...');
      
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ OAuth callback error:', error);
      
      const errorMessage = error.message || 'Authentication failed';
      setStatus(`Authentication failed: ${errorMessage}`);
      
      Alert.alert(
        'Authentication Failed',
        `Login failed: ${errorMessage}. Please try again.`,
        [
          {
            text: 'Try Again',
            onPress: () => router.replace('/(auth)/login')
          }
        ]
      );
    }
  };

  const checkProfileAndRedirect = async (userId: string) => {
    try {
      console.log('👤 Checking profile completeness for user:', userId);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('age, gender, height_cm, weight_kg, activity_level, health_goals')
        .eq('id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Profile fetch error:', error);
        router.replace('/(tabs)');
        return;
      }
      
      const isProfileComplete = !!(
        profile &&
        profile.age &&
        profile.gender &&
        profile.height_cm &&
        profile.weight_kg &&
        profile.activity_level &&
        profile.health_goals
      );
      
      console.log('📋 Profile complete:', isProfileComplete);
      
      if (isProfileComplete) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
      
    } catch (error) {
      console.error('❌ Error checking profile:', error);
      router.replace('/(tabs)');
    }
  };

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('⏰ Callback timeout reached');
      setStatus('Authentication is taking longer than expected...');
      
      setTimeout(() => {
        Alert.alert(
          'Timeout',
          'Authentication is taking too long. Please try logging in again.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login')
            }
          ]
        );
      }, 3000);
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.text }]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});