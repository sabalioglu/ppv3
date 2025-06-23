import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      console.log('🔄 Processing OAuth callback...');
      console.log('📍 Current URL:', Platform.OS === 'web' ? window.location.href : 'mobile');
      
      // Web'de URL fragment'ını kontrol et
      if (Platform.OS === 'web') {
        const fragment = window.location.hash;
        console.log('🔍 URL Fragment:', fragment);
        
        // Supabase'in session'ı URL'den almasını bekle
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Session'ı kontrol et
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Callback error:', error);
        router.replace('/(auth)/login');
        return;
      }

      console.log('🔐 Session status:', session ? 'Found' : 'Not found');

      if (session) {
        console.log('✅ OAuth login successful!', session.user.email);
        
        // Profile kontrolü
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('age, gender, full_name')
          .eq('id', session.user.id)
          .maybeSingle();

        console.log('👤 Profile data:', profile);

        if (!profile || !profile.age || !profile.gender) {
          console.log('➡️ Redirecting to onboarding...');
          router.replace('/(auth)/onboarding');
        } else {
          console.log('➡️ Redirecting to dashboard...');
          router.replace('/(tabs)/dashboard');
        }
      } else {
        console.log('⚠️ No session found');
        
        // URL'de access_token var mı kontrol et
        if (Platform.OS === 'web' && window.location.hash.includes('access_token')) {
          console.log('🔄 Access token found in URL, waiting for Supabase to process...');
          
          // Supabase'in token'ı işlemesi için bekle
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              console.log('✅ Session created on retry');
              window.location.reload(); // Sayfayı yenile
            } else {
              console.log('❌ Still no session');
              router.replace('/(auth)/login');
            }
          }, 2000);
        } else {
          router.replace('/(auth)/login');
        }
      }
    } catch (error) {
      console.error('❌ Auth callback error:', error);
      router.replace('/(auth)/login');
    }
  };

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
