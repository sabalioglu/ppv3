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
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        // ✅ API entegrasyonunu başlat
        await initializeRecipeApi({
          rapidApiKey: process.env.EXPO_PUBLIC_RAPIDAPI_KEY, // ✅ RapidAPI key
          spoonacularHost: process.env.EXPO_PUBLIC_SPOONACULAR_HOST || 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
          themealdbHost: process.env.EXPO_PUBLIC_THEMEALDB_HOST || 'themealdb.p.rapidapi.com',
        
          // İsteğe bağlı diğer yapılandırmalar
          cacheTtl: 3600000, // 1 saat
          preferApi: true,
          fallbackToAi: true,
          maxRetries: 3,
          retryDelay: 1000,
          timeout: 10000
        });
        
        console.log('✅ Recipe API initialized successfully');
      } catch (error) {
        console.error('⚠️ API initialization failed, but continuing:', error);
        // API hatası olsa bile uygulama çalışmaya devam etsin
      }
    };

    if (fontsLoaded) {
      initializeApp();
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
            {/* ✅ DÜZELTME: Mevcut dosya yapısına göre route'ları tanımla */}
            
            {/* Ana sayfa */}
            <Stack.Screen name="index" options={{ headerShown: false }} />
            
            {/* Diğer ana sayfalar */}
            <Stack.Screen name="camera" options={{ headerShown: false }} />
            <Stack.Screen name="pantry" options={{ headerShown: false }} />
            <Stack.Screen name="recipes" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="shopping-list" options={{ headerShown: false }} />
            <Stack.Screen name="library" options={{ headerShown: false }} />
            
            {/* Dinamik route'lar */}
            <Stack.Screen name="cookbook/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
            
            {/* Eğer gelecekte (tabs) ve (auth) klasörleri oluşturulursa */}
            {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
            {/* <Stack.Screen name="(auth)" options={{ headerShown: false }} /> */}
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
