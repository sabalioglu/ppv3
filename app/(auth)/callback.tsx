// app/auth/callback.tsx
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get the session from URL
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Callback error:', error);
        router.replace('/(auth)/login');
        return;
      }

      if (session) {
        console.log('✅ OAuth login successful!');
        
        // Check if profile exists
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('age, gender, full_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile?.age || !profile?.gender) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(tabs)/dashboard');
        }
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#10b981" />
      <Text style={styles.text}>Signing you in...</Text>
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
    fontSize: 16,
    color: '#6b7280',
  },
});