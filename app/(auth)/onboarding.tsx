import React from 'react';
import OnboardingScreen from '../../screens/OnboardingScreen';
import { useEffect, useState } from 'react';
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
    return <div>Loading user data...</div>;
  }

  return <OnboardingScreen userId={userId} onComplete={handleComplete} />;
}
