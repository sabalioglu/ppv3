import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import * as Linking from 'expo-linking';

export default function CallbackScreen() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log('🎯 CALLBACK.TSX LOADED!');
    console.log('📱 Platform:', Platform.OS);
    console.log('🔗 Params:', params);
    
    if (Platform.OS === 'web') {
      handleWebCallback();
    } else {
      handleMobileCallback();
    }
  }, [params]);

  const handleWebCallback = async () => {
    try {
      if (typeof window === 'undefined') {
        console.log('⏳ Waiting for client-side...');
        return;
      }

      console.log('🌐 Processing Web OAuth callback...');
      
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      const allParams = new URLSearchParams();
      hashParams.forEach((value, key) => allParams.set(key, value));
      searchParams.forEach((value, key) => allParams.set(key, value));
      
      await processAuthParams(allParams);
    } catch (err) {
      handleError(err);
    }
  };

  const handleMobileCallback = async () => {
    try {
      console.log('📱 Processing Mobile OAuth callback...');
      
      // Try to get URL from Linking
      const url = await Linking.getInitialURL();
      console.log('📱 Initial URL:', url);
      
      if (url) {
        const { queryParams } = Linking.parse(url);
        console.log('📱 Query params:', queryParams);
        
        const urlParams = new URLSearchParams();
        Object.entries(queryParams || {}).forEach(([key, value]) => {
          if (value) urlParams.set(key, String(value));
        });
        
        // Also check route params
        Object.entries(params || {}).forEach(([key, value]) => {
          if (value && !urlParams.has(key)) urlParams.set(key, String(value));
        });
        
        await processAuthParams(urlParams);
      } else {
        // If no URL, check if we have params from the route
        if (params.access_token) {
          const urlParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value) urlParams.set(key, String(value));
          });
          await processAuthParams(urlParams);
        } else {
          throw new Error('No authentication parameters received');
        }
      }
    } catch (err) {
      handleError(err);
    }
  };

  const processAuthParams = async (params: URLSearchParams) => {
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const error_description = params.get('error_description');
    
    console.log('🔐 Processing auth params:', {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
      error: error_description
    });
    
    if (error_description) {
      throw new Error(error_description);
    }
    
    if (!access_token) {
      throw new Error('No access token received');
    }
    
    console.log('✅ OAuth tokens received');
    
    // Set the session
    const { data, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || '',
    });
    
    if (sessionError) throw sessionError;
    
    console.log('✅ Session set successfully');
    
    // Get user and check profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found after setting session');
    
    // Check if profile exists and is complete
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    const isProfileComplete = !!(
      profile &&
      profile.age &&
      profile.gender &&
      (profile.height || profile.height_cm) &&
      (profile.weight || profile.weight_kg) &&
      profile.activity_level &&
      profile.health_goals
    );
    
    console.log('👤 Profile status:', { exists: !!profile, complete: isProfileComplete });
    
    // Navigate based on profile status
    if (isProfileComplete) {
      console.log('➡️ Navigating to dashboard');
      router.replace('/(tabs)');
    } else {
      console.log('➡️ Navigating to onboarding');
      router.replace('/(auth)/onboarding');
    }
  };

  const handleError = (err: any) => {
    console.error('❌ Callback error:', err);
    setError(err instanceof Error ? err.message : 'An error occurred');
    setIsProcessing(false);
    
    setTimeout(() => {
      router.replace('/(auth)/login');
    }, 3000);
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
        <Text style={[styles.subText, { color: theme.colors.textSecondary }]}>
          Please wait while we log you in...
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
    fontWeight: '600',
  },
  subText: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.7,
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
