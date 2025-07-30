//app/_layout.tsx - API Integration Initialization
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeRecipeApi } from '@/lib/meal-plan/initialize';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Add custom fonts here if needed
    // 'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    // 'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
  });

  useEffect(() => {
    // ✅ API entegrasyonunu başlat
    initializeRecipeApi({
      rapidApiKey: process.env.EXPO_PUBLIC_RAPIDAPI_KEY,
      spoonacularHost: process.env.EXPO_PUBLIC_SPOONACULAR_HOST || 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
      tastyHost: process.env.EXPO_PUBLIC_TASTY_HOST || 'tasty.p.rapidapi.com',
      themealdbHost: process.env.EXPO_PUBLIC_THEMEALDB_HOST || 'themealdb.p.rapidapi.com',
      // İsteğe bağlı diğer yapılandırmalar
      cacheTtl: 3600000, // 1 saat
      preferApi: true,
      fallbackToAi: true,
      // Yeni eklenen konfigürasyonlar
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000
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
