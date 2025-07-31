//app > _layout.tsx
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
//import { initializeRecipeApi } from '@/lib/meal-plan/initialize'; ❌ ESKİ - SİLİNDİ
import { mealPlanInitializer } from '../lib/meal-plan/initialize'; // ✅ YENİ

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Add custom fonts here if needed
    // 'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    // 'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
  });

  useEffect(() => {
    // ❌ ESKİ API CALL - SİLİNDİ:
    // initializeRecipeApi({
    //   rapidApiKey: process.env.EXPO_PUBLIC_RAPIDAPI_KEY,
    //   spoonacularHost: process.env.EXPO_PUBLIC_SPOONACULAR_HOST,
    //   tastyHost: process.env.EXPO_PUBLIC_TASTY_HOST,
    //   themealdbHost: process.env.EXPO_PUBLIC_THEMEALDB_HOST,
    //   // İsteğe bağlı diğer yapılandırmalar
    //   cacheTtl: 3600000, // 1 saat
    //   preferApi: true,
    //   fallbackToAi: true
    // });

    // ✅ YENİ AI-ONLY INIT:
    mealPlanInitializer.initialize({
      enableLogging: process.env.NODE_ENV === 'development',
      isDevelopment: process.env.NODE_ENV === 'development',
    }).then(result => {
      if (result.success) {
        console.log('🎉 AI Meal Plan System Ready!');
      } else {
        console.warn('⚠️ AI System Init Issues:', result.errors);
      }
    }).catch(error => {
      console.error('💥 AI System Init Failed:', error);
    });

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
