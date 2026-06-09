// components/UI/LoadingCard.tsx — Stovd branded loading state.
// Brand mark (breathing ChefHat tile) + "Stovd" wordmark + a rotating food tip,
// instead of a bare ActivityIndicator + "Loading…". Pure RN Animated.
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { ChefHat } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Display } from './Display';
import ThemedText from './ThemedText';
import { spacing, radius } from '@/lib/theme/index';
import { i18n, t } from '@/lib/i18n';

interface LoadingCardProps {
  statusText?: string;
}

export default function LoadingCard({ statusText }: LoadingCardProps) {
  const { colors } = useTheme();
  const tips = (i18n.t('common.loaderTips') as unknown as string[]) ?? [];
  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  // Gentle breathing on the brand mark.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Rotate through food tips (only when no explicit status was given).
  useEffect(() => {
    if (statusText || tips.length < 2) return;
    const id = setInterval(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        setIdx((i) => (i + 1) % tips.length);
        Animated.timing(fade, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }).start();
      });
    }, 2400);
    return () => clearInterval(id);
  }, [fade, statusText, tips.length]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const line = statusText ?? tips[idx] ?? t('common.loading');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.tile,
          { backgroundColor: colors.primary, transform: [{ scale }] },
        ]}
      >
        <ChefHat size={26} color="#fff" />
      </Animated.View>
      <Display size="lg" style={styles.wordmark}>
        Stovd
      </Display>
      <Animated.View style={{ opacity: fade }}>
        <ThemedText
          type="body"
          style={[styles.tip, { color: colors.textSecondary }]}
        >
          {line}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  wordmark: { marginBottom: spacing.sm },
  tip: { textAlign: 'center', maxWidth: 280 },
});
