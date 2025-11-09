import { SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
SplashScreen.preventAutoHideAsync();

const SplashController = () => {
  const { isReady } = useAuth();

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  return null;
};

export default SplashController;
