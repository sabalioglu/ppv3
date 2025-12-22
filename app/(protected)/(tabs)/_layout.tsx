import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import {
  Chrome as Home,
  Package,
  Camera,
  Activity,
  ChefHat,
  ShoppingCart,
  Settings,
  CreditCard,
} from 'lucide-react-native';
import { spacing } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          ...styles.tabBar,
          borderTopColor: colors.borderLight,
          backgroundColor: colors.surface,
          ...(Platform.OS === 'web' && {
            position: 'relative',
          }),
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
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
          tabBarIcon: ({ size, color }) => (
            <Package size={size} color={color} />
          ),
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
          tabBarIcon: ({ size, color }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition_old"
        options={{
          title: 'NutritionOld',
          tabBarIcon: ({ size, color }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ size, color }) => (
            <ChefHat size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: 'Shopping',
          tabBarIcon: ({ size, color }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'Subscription',
          tabBarIcon: ({ size, color }) => (
            <CreditCard size={size} color={color} />
          ),
          href: null, // Hide from tab bar but keep accessible via navigation
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingBottom: spacing.xs,
    borderTopWidth: 1,
  },
});
