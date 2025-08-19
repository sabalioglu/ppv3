// app/_layout.tsx
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { mealPlanInitializer } from '../lib/meal-plan/initialize';
import { useFonts } from 'expo-font'; // ✅ Ekleyin

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors if splash screen is already hidden
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

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
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error('💥 App initialization error:', error);
        // Don't block app loading on errors
      } finally {
        // Mark app as ready regardless of initialization result
        setAppIsReady(true);
      }
    }

    prepareApp();
  }, []);

  useEffect(() => {
    async function hideSplash() {
      if (appIsReady) {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('Splash screen hide error:', error);
        }
      }
    }
    
    hideSplash();
  }, [appIsReady]);

  // Show nothing while app is preparing
  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Stack 
            screenOptions={{ 
              headerShown: false,
              animation: 'fade', // Smooth screen transitions
              animationDuration: 200,
            }}
          >
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
                animation: 'none' // No animation for tab navigator
              }} 
            />
            <Stack.Screen 
              name="(auth)" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_bottom' // Auth screens slide up
              }} 
            />
            <Stack.Screen 
              name="ai-meal-plan" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right' // Meal plan slides from right
              }} 
            />
            <Stack.Screen 
              name="recipe/[id]" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                presentation: 'card' // Card-style presentation for recipes
              }} 
            />
            <Stack.Screen 
              name="settings" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right'
              }} 
            />
            <Stack.Screen 
              name="profile" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right'
              }} 
            />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
