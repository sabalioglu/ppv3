import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { mealPlanInitializer } from '../lib/meal-plan/initialize';
import { AuthProvider } from '@/contexts/AuthContext';
import SplashController from '@/components/SplashController';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors if splash screen is already hidden
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  // ── Stovd brand fonts: Fraunces (editorial display) + Inter (body/UI) ──
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Fraunces-Medium': Fraunces_500Medium,
    'Fraunces-SemiBold': Fraunces_600SemiBold,
    'Fraunces-Bold': Fraunces_700Bold,
  });

  useEffect(() => {
    async function prepareApp() {
      try {
        // Initialize AI Meal Plan System
        const initResult = await mealPlanInitializer.initialize({
          enableLogging: __DEV__, // Use React Native's __DEV__ flag
          isDevelopment: __DEV__,
        });

        if (initResult.success) {
          console.log('🎉 AI Meal Plan System Ready!');
          console.log('✅ Features enabled:', {
            aiGeneration: initResult.features?.aiGeneration,
            mealPlanning: initResult.features?.mealPlanning,
            pantryAnalysis: initResult.features?.pantryAnalysis,
          });
        } else {
          console.warn('⚠️ AI System Init Issues:', initResult.errors);
          // Continue app loading even if some features fail
        }

        // Small delay to ensure smooth transition
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error('💥 App initialization error:', error);
        // Don't block app loading on errors
      } finally {
        // Mark app as ready regardless of initialization result
        setAppIsReady(true);
      }
    }

    prepareApp();
  }, []); // ✅ Font dependency'leri kaldırıldı

  const ready = appIsReady && (fontsLoaded || !!fontError);

  useEffect(() => {
    async function hideSplash() {
      if (ready) {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('Splash screen hide error:', error);
        }
      }
    }

    hideSplash();
  }, [ready]);

  // Show nothing while app is preparing (init + brand fonts)
  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <SplashController />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade', // Smooth screen transitions
                animationDuration: 200,
              }}
            >
              <Stack.Screen
                name="(auth)"
                options={{
                  headerShown: false,
                  animation: 'slide_from_bottom', // Auth screens slide up
                }}
              />
              <Stack.Screen
                name="(protected)"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
