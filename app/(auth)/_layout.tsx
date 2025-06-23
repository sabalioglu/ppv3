import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{
          title: 'Login',
        }}
      />
      <Stack.Screen 
        name="onboarding" 
        options={{
          title: 'Get Started',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="callback" 
        options={{
          title: 'Authenticating...',
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
