// app/(auth)/callback.tsx
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
      
      // Web'de hash parametrelerini kontrol et
      if (Platform.OS === 'web') {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          console.log('✅ Access token found in URL hash');
        }
      }
      
      // Get the session from URL
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Callback error:', error);
        router.replace('/(auth)/login');
        return;
      }

      if (session) {
        console.log('✅ OAuth login successful!', session.user.email);
        
        // Check if profile exists
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
        console.log('⚠️ No session found, checking auth state...');
        
        // Biraz bekle ve tekrar kontrol et
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            console.log('✅ Session found on retry');
            router.replace('/(tabs)/dashboard');
          } else {
            console.log('❌ Still no session, redirecting to login');
            router.replace('/(auth)/login');
          }
        }, 1000);
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
