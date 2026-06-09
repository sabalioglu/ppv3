// components/UI/SkeletonCard.tsx — Stovd loading skeletons (Warm Kitchen).
// Pure RN Animated opacity-breathe "bones" — no Lottie, no new native module.
// Shown while home recommendations load, in place of a bare full-screen spinner.
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, radius } from '@/lib/theme/index';

function Bone({
  w = '100%',
  h,
  r = 10,
  style,
}: {
  w?: DimensionValue;
  h: number;
  r?: number;
  style?: object;
}) {
  const { colors } = useTheme();
  const o = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(o, {
          toValue: 0.55,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [o]);
  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius: r,
          backgroundColor: colors.surfaceVariant,
          opacity: o,
        },
        style,
      ]}
    />
  );
}

export function SkeletonHero() {
  return <Bone h={210} r={radius.xl} />;
}

export function SkeletonRow() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
      ]}
    >
      <Bone w={74} h={74} r={14} />
      <View style={styles.rowBody}>
        <Bone w={'38%'} h={9} r={5} />
        <Bone w={'84%'} h={15} r={6} />
        <Bone w={'52%'} h={11} r={5} />
      </View>
    </View>
  );
}

// Full home loading state: header bones + hero + a few list rows.
export function HomeSkeleton() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Bone w={120} h={11} r={5} />
          <Bone w={36} h={36} r={18} />
        </View>
        <Bone w={'70%'} h={28} r={8} style={styles.title} />
        <SkeletonHero />
        <View style={styles.section}>
          <Bone w={140} h={13} r={6} style={styles.sectionTitle} />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: { marginBottom: 18 },
  section: { marginTop: 26 },
  sectionTitle: { marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 11,
  },
  rowBody: { flex: 1, gap: 8 },
});
