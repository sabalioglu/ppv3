import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function CallbackScreen() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    console.log('🎯 CALLBACK.TSX LOADED!');
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Platform check - only process on web
      if (typeof window === 'undefined') {
        console.log('⏳ Waiting for client-side...');
        return;
      }

      console.log('🔄 Processing OAuth callback...');
      
      // Get URL parameters
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      // Combine both hash and search params
      const allParams = new URLSearchParams();
      hashParams.forEach((value, key) => allParams.set(key, value));
      searchParams.forEach((value, key) => allParams.set(key, value));
      
      const access_token = allParams.get('access_token');
      const refresh_token = allParams.get('refresh_token');
      const error_description = allParams.get('error_description');
      
      if (error_description) {
        throw new Error(error_description);
      }
      
      if (access_token) {
        console.log('✅ OAuth tokens received');
        
        // Set the session
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || '',
        });
        
        if (sessionError) throw sessionError;
        
        console.log('✅ Session set successfully');
        
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user?.id)
          .maybeSingle();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        }
        
        // Check profile completeness
        const isProfileComplete = !!(
          profile &&
          profile.age &&
          profile.gender &&
          (profile.height || profile.height_cm) &&
          (profile.weight || profile.weight_kg) &&
          profile.activity_level &&
          profile.health_goals
        );
        
        // Navigate based on profile status
        if (isProfileComplete) {
          console.log('➡️ Profile complete, navigating to app');
          router.replace('/(tabs)');
        } else {
          console.log('➡️ Profile incomplete, navigating to onboarding');
          router.replace('/(auth)/onboarding');
        }
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      console.error('❌ Callback error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTimeout(() => router.replace('/(auth)/login'), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Error: {error}
          </Text>
          <Text style={[styles.redirectText, { color: theme.colors.text }]}>
            Redirecting to login...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.processingText, { color: theme.colors.text }]}>
          Processing authentication...
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
  },
  processingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  redirectText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
