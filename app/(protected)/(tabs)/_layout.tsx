import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutGrid,
  Refrigerator,
  Camera,
  ChefHat,
  ShoppingBasket,
  Settings,
  CreditCard,
} from 'lucide-react-native';
import { spacing, radius } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import { t } from '@/lib/i18n';

// Elevated terracotta center action (the "Scan" tab). Keeps native tab
// navigation working by forwarding the Tabs-provided onPress/accessibility props.
function ScanTabButton({ onPress, accessibilityState, ...rest }: any) {
  const { colors } = useTheme();
  return (
    <Pressable
      {...rest}
      onPress={onPress}
      accessibilityState={accessibilityState}
      style={styles.scanWrap}
    >
      <View
        style={[
          styles.scanButton,
          {
            backgroundColor: colors.primary,
            borderColor: colors.surface,
            shadowColor: colors.primary,
          },
        ]}
      >
        <Camera size={26} color="#fff" strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          height: 76 + insets.bottom,
          paddingBottom: insets.bottom + spacing.xs,
          paddingTop: spacing.sm,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderLight,
          backgroundColor: colors.surface,
          ...(Platform.OS === 'web' && { position: 'relative' }),
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 11,
          marginTop: 2,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.kitchen'),
          tabBarIcon: ({ size, color }) => (
            <LayoutGrid size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: t('tabs.pantry'),
          tabBarIcon: ({ size, color }) => (
            <Refrigerator size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: '',
          tabBarButton: (props) => <ScanTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: t('tabs.recipes'),
          tabBarIcon: ({ size, color }) => (
            <ChefHat size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: t('tabs.list'),
          tabBarIcon: ({ size, color }) => (
            <ShoppingBasket size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: t('tabs.subscription'),
          tabBarIcon: ({ size, color }) => (
            <CreditCard size={size} color={color} strokeWidth={2} />
          ),
          href: null, // Hide from tab bar but keep accessible via navigation
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {
    width: 58,
    height: 58,
    borderRadius: radius.full,
    marginTop: -22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
