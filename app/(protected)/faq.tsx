// app/(protected)/faq.tsx — in-app Help & FAQ (Warm Editorial, EN + TR).
// Accordion list driven by lib/faq/content by the active locale.
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LocaleContext';
import { Display, Eyebrow } from '@/components/UI/Display';
import { spacing, radius, fonts } from '@/lib/theme/index';
import { FAQ } from '@/lib/faq/content';

export default function FaqScreen() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState<number | null>(0);

  const items = FAQ[locale] ?? FAQ.en;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Eyebrow style={styles.kicker}>{t('settings.faqKicker')}</Eyebrow>
          <Display size="xl">{t('settings.faqTitle')}</Display>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('settings.faqSubtitle')}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          {items.map((item, idx) => {
            const expanded = open === idx;
            return (
              <View key={idx}>
                {idx > 0 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: colors.divider },
                    ]}
                  />
                )}
                <Pressable
                  style={styles.questionRow}
                  onPress={() => setOpen(expanded ? null : idx)}
                >
                  <Text
                    style={[styles.question, { color: colors.textPrimary }]}
                  >
                    {item.q}
                  </Text>
                  {expanded ? (
                    <ChevronUp size={18} color={colors.primary} />
                  ) : (
                    <ChevronDown size={18} color={colors.textSecondary} />
                  )}
                </Pressable>
                {expanded && (
                  <Text
                    style={[styles.answer, { color: colors.textSecondary }]}
                  >
                    {item.a}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
  },
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  kicker: { marginBottom: 6 },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  question: {
    flex: 1,
    fontSize: 15.5,
    fontFamily: fonts.bodySemibold,
    lineHeight: 21,
  },
  answer: {
    fontSize: 14.5,
    fontFamily: fonts.body,
    lineHeight: 22,
    paddingBottom: spacing.md,
    paddingRight: spacing.sm,
  },
});
