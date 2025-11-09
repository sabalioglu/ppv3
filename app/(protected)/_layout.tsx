import LoadingCard from '@/components/UI/LoadingCard';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect, Stack } from 'expo-router';

export default function ProtectedLayout() {
  const { isReady, session, isProfileComplete } = useAuth();

  if (!isReady) {
    return <LoadingCard />;
  }

  if (!session || !session?.user) {
    return <Redirect href="/login" />;
  }

  if (session?.user && !isProfileComplete) {
    return <Redirect href="/onboarding" />;
  }

  return (
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
          animation: 'none', // No animation for tab navigator
        }}
      />
      <Stack.Screen
        name="ai-meal-plan"
        options={{
          headerShown: false,
          animation: 'slide_from_right', // Meal plan slides from right
        }}
      />
      <Stack.Screen
        name="recipe/[id]"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          presentation: 'card', // Card-style presentation for recipes
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
