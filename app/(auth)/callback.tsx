import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function CallbackScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [status, setStatus] = useState('Completing authentication...');

  useEffect(() => {
    let mounted = true;
    
    const handleCallback = async () => {
      try {
        console.log('🔍 [Callback] Starting OAuth callback handling...');
        
        if (Platform.OS === 'web') {
          // Web platformunda Supabase otomatik handle eder
          // Sadece auth state change'i bekle
          
          const urlParams = new URLSearchParams(window.location.search);
          const error = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');
          
          if (error) {
            throw new Error(errorDescription || error);
          }
          
          // OAuth code var mı kontrol et
          const code = urlParams.get('code');
          if (code) {
            console.log('🔑 OAuth code detected, waiting for Supabase to handle...');
            setStatus('Completing authentication...');
            
            // Supabase'in code exchange yapmasını bekle
            let attempts = 0;
            const maxAttempts = 20; // 10 saniye (500ms x 20)
            
            while (attempts < maxAttempts && mounted) {
              const { data: { session } } = await supabase.auth.getSession();
              
              if (session) {
                console.log('✅ Session established successfully!');
                setStatus('Success! Redirecting...');
                
                // Profile kontrolü yap
                const { data: profile } = await supabase
                  .from('user_profiles')
                  .select('age, gender, height_cm, weight_kg, activity_level, health_goals')
                  .eq('id', session.user.id)
                  .maybeSingle();
                
                const isProfileComplete = !!(
                  profile?.age &&
                  profile?.gender &&
                  profile?.height_cm &&
                  profile?.weight_kg &&
                  profile?.activity_level &&
                  profile?.health_goals
                );
                
                // Yönlendirme
                if (mounted) {
                  if (isProfileComplete) {
                    router.replace('/(tabs)');
                  } else {
                    router.replace('/(auth)/onboarding');
                  }
                }
                return;
              }
              
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Session oluşmadıysa
            throw new Error('Session could not be established');
          }
        }
        
        // Eğer buraya geldiyse, bir sorun var
        console.log('⚠️ No OAuth code or tokens found');
        setStatus('No authentication data found');
        
        if (mounted) {
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 2000);
        }
        
      } catch (error: any) {
        console.error('❌ Callback error:', error);
        setStatus(`Error: ${error.message}`);
        
        if (mounted) {
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 2000);
        }
      }
    };
    
    handleCallback();
    
    // Cleanup
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.text, { color: theme.colors.text }]}>
          {status}
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
  text: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});