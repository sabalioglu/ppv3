'use client';

import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

console.log('🎯 CALLBACK.TSX LOADED!');

export default function AuthCallback() {
  console.log('🎯 AuthCallback component rendered!');
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      handleCallback();
    }
  }, [isClient]);

  const handleCallback = async () => {
    try {
      console.log('🔄 Processing OAuth callback...');

      // Web'de ve client-side'da URL kontrolü
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const fragment = window.location.hash;
        
        console.log('📍 Current URL:', window.location.href);
        console.log('📍 URL Params:', urlParams.toString());
        console.log('🔍 URL Fragment:', fragment);

        // Supabase'in session'ı URL'den almasını bekle
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Session'ı kontrol et
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Callback error:', error);
        router.replace('/(auth)/login');
        return;
      }

      console.log('🔐 Session status:', session ? 'Found' : 'Not found');

      if (!session) {
        console.log('⚠️ No session found');
        router.replace('/(auth)/login');
        return;
      }

      console.log('✅ OAuth login successful!', session.user.email);

      // Profile kontrolü
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('age, gender, full_name')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        router.replace('/(auth)/login');
        return;
      }

      console.log('👤 Profile data:', profile);

      if (!profile || !profile.age || !profile.gender) {
        console.log('➡️ Redirecting to onboarding...');
        router.replace('/(auth)/onboarding');
      } else {
        console.log('➡️ Redirecting to dashboard...');
        router.replace('/(tabs)/dashboard');
      }
    } catch (error) {
      console.error('❌ Auth callback error:', error);
      router.replace('/(auth)/login');
    }
  };

  // SSR sırasında null döndür
  if (!isClient) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#10b981" />
      <Text style={styles.text}>Signing you in with Google...</Text>
      <Text style={styles.subtext}>Please wait...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  subtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
});