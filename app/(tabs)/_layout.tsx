import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Chrome as Home, Package, Camera, Activity, ChefHat, ShoppingCart, Settings } from 'lucide-react-native';
import { colors, components } from '@/lib/theme';

export default function TabsLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 Checking authentication status...');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('❌ No authenticated user, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      console.log('✅ User authenticated, checking profile...');
      
      // Check if profile exists and is complete
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name, age, gender, height_cm, weight_kg')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || !profile.full_name || !profile.age) {
        console.log('❌ Profile incomplete, redirecting to onboarding');
        router.replace('/(auth)/onboarding');
        return;
      }

      console.log('✅ Profile complete, allowing access to app');
      setIsAuthenticated(true);

    } catch (error) {
      console.error('❌ Auth check failed:', error);
      router.replace('/(auth)/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[500],
        tabBarStyle: {
          ...components.tabBar,
          ...(Platform.OS === 'web' && {
            position: 'relative',
            borderTopWidth: 1,
            borderTopColor: colors.neutral[200],
          }),
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginBottom: 4,
        },
        tabBarHideOnKeyboard: true,
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: 'Pantry',
          tabBarIcon: ({ size, color }) => <Package size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Scan',
          tabBarIcon: ({ size, color }) => <Camera size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ size, color }) => <Activity size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ size, color }) => <ChefHat size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: 'Shopping',
          tabBarIcon: ({ size, color }) => <ShoppingCart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1f2937',
  },
});