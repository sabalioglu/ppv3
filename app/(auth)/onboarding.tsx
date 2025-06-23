import React from 'react';
import OnboardingScreen from '../../screens/OnboardingScreen';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function OnboardingRoute() {
  const [userId, setUserId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('📱 Onboarding for user:', user.id);
        setUserId(user.id);
      } else {
        console.error('❌ No user found in onboarding');
        router.replace('/(auth)/login');
      }
    };
    getUser();
  }, []);

  const handleComplete = () => {
    console.log('✅ Onboarding completed, redirecting...');
    router.replace('/(tabs)');
  };

  if (!userId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ marginTop: 10, color: '#6b7280' }}>Loading user data...</Text>
      </View>
    );
  }

  return <OnboardingScreen userId={userId} onComplete={handleComplete} />;
}
