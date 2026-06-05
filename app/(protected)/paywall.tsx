// app/(protected)/paywall.tsx — native RevenueCat paywall.
//
// Opened when a metered action hits its free-tier limit (MealPlanQuotaError) or
// from settings. On web this screen still renders but purchase is a no-op
// (RC is native-only); web users subscribe via the existing Stripe checkout.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Check, X, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { fonts } from '@/lib/theme/constants/typography';
import { spacing } from '@/lib/theme/constants/spacing';
import { radius } from '@/lib/theme/constants/radius';
import { t } from '@/lib/i18n';
import { useEntitlement } from '@/hooks/useEntitlement';
import {
  getOfferingPackages,
  purchase,
  restorePurchases,
  type PackageLite,
} from '@/lib/purchases';

export default function PaywallScreen() {
  const { colors } = useTheme();
  const { refresh } = useEntitlement();
  const [packages, setPackages] = useState<PackageLite[]>([]);
  const [selected, setSelected] = useState<PackageLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const pkgs = await getOfferingPackages();
      setPackages(pkgs);
      setSelected(pkgs[0] ?? null);
      setLoading(false);
    })();
  }, []);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as never);
  };

  const onPurchase = async () => {
    if (!selected) {
      Alert.alert(t('paywall.unavailableTitle'), t('paywall.unavailableBody'));
      return;
    }
    setBusy(true);
    try {
      const ok = await purchase(selected);
      if (ok) {
        await refresh();
        close();
      }
    } catch {
      Alert.alert(t('paywall.purchaseFailedTitle'), t('paywall.purchaseFailedBody'));
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    setBusy(true);
    try {
      const ok = await restorePurchases();
      if (ok) {
        await refresh();
        Alert.alert(t('paywall.restoredTitle'), t('paywall.restoredBody'));
        close();
      } else {
        Alert.alert(
          t('paywall.nothingToRestoreTitle'),
          t('paywall.nothingToRestoreBody'),
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const features = [
    t('paywall.featureUnlimitedPlans'),
    t('paywall.featureUnlimitedScans'),
    t('paywall.featureUnlimitedImports'),
    t('paywall.featurePriority'),
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={close}
        hitSlop={12}
        accessibilityLabel={t('paywall.close')}
      >
        <X size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Sparkles size={14} color="#fff" />
          <Text style={styles.badgeText}>{t('paywall.kicker')}</Text>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('paywall.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('paywall.subtitle')}
        </Text>

        <View style={styles.features}>
          {features.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={[styles.tick, { backgroundColor: colors.success }]}>
                <Check size={13} color="#fff" />
              </View>
              <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                {f}
              </Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t('paywall.loading')}
            </Text>
          </View>
        ) : (
          packages.map((p) => {
            const active = selected?.identifier === p.identifier;
            return (
              <TouchableOpacity
                key={p.identifier}
                onPress={() => setSelected(p)}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: active ? colors.primary : colors.borderLight,
                  },
                ]}
              >
                <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
                  {p.title}
                </Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>
                  {p.priceString}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary }]}
          onPress={onPurchase}
          disabled={busy || loading}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>{t('paywall.cta')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onRestore} disabled={busy} hitSlop={8}>
          <Text style={[styles.restore, { color: colors.textSecondary }]}>
            {t('paywall.restore')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.legal, { color: colors.textSecondary }]}>
          {t('paywall.legal')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 32 },
  closeBtn: { position: 'absolute', top: 48, right: 16, zIndex: 10, padding: 8 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  badgeText: { color: '#fff', fontFamily: fonts.bodySemibold, fontSize: 12 },
  title: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 38 },
  subtitle: { fontFamily: fonts.body, fontSize: 15, marginTop: spacing.sm },
  features: { marginTop: spacing.lg, gap: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontFamily: fonts.bodyMedium, fontSize: 15, flex: 1 },
  loadingBox: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
  loadingText: { fontFamily: fonts.body, fontSize: 13 },
  planCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  planTitle: { fontFamily: fonts.bodySemibold, fontSize: 16 },
  planPrice: { fontFamily: fonts.displayBold, fontSize: 22, marginTop: 4 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  cta: {
    height: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 17 },
  restore: { textAlign: 'center', fontFamily: fonts.bodyMedium, fontSize: 14, paddingVertical: 4 },
  legal: { textAlign: 'center', fontFamily: fonts.body, fontSize: 11, lineHeight: 16 },
});
