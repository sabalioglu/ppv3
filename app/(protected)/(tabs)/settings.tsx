import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Linking,
} from 'react-native';

// Canonical web host serving the legal pages (public/*.html via _redirects).
// Change here if the Stovd marketing domain differs.
const LEGAL_BASE = 'https://stovd.app';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Bell,
  Moon,
  Globe,
  Shield,
  CircleHelp as HelpCircle,
  LogOut,
  Trash2,
  ChevronRight,
  Heart,
  Star,
  Crown,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { supabase } from '@/lib/supabase';
import { spacing, radius, fonts } from '@/lib/theme/index';
import { router } from 'expo-router';
import { Display, Eyebrow } from '@/components/UI/Display';
import { t } from '@/lib/i18n';

interface SettingItem {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  dangerous?: boolean;
  muted?: boolean;
}

export default function SettingsScreen() {
  const { colors, themeMode } = useTheme();
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [subscription, setSubscription] = useState<any>(null);

  React.useEffect(() => {
    loadUserData();
    loadSubscription();
  }, []);

  const loadUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        setUserEmail(user.email || '');
        setUserName(profile?.full_name || user.email?.split('@')[0] || 'User');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error loading subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const getSubscriptionName = (priceId: string): string => {
    if (priceId === 'price_1S0JK3Emd2R9npIslZBvpCQK') {
      return t('settings.premiumName');
    }
    return t('settings.premiumFallback');
  };

  const doLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert(t('settings.logoutError'), error.message);
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error: any) {
      Alert.alert(t('settings.logoutError'), t('settings.logoutErrorMessage'));
    }
  };

  const handleLogout = async () => {
    // RN Alert.alert multi-button callbacks don't fire on web -> use window.confirm.
    if (Platform.OS === 'web') {
      if (window.confirm(t('settings.logoutMessage'))) {
        await doLogout();
      }
      return;
    }
    Alert.alert(t('settings.logoutTitle'), t('settings.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: doLogout },
    ]);
  };

  const doDeleteAccount = async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: {},
      });
      if (error) {
        Alert.alert(t('settings.deleteError'), error.message);
        return;
      }
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert(t('settings.deleteError'), t('settings.deleteErrorMessage'));
    }
  };

  const handleDeleteAccount = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('settings.deleteConfirm'))) {
        await doDeleteAccount();
      }
      return;
    }
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteConfirmCta'),
        style: 'destructive',
        onPress: doDeleteAccount,
      },
    ]);
  };

  const getThemeModeText = () => {
    switch (themeMode) {
      case 'light':
        return t('settings.themeLight');
      case 'dark':
        return t('settings.themeDark');
      case 'system':
        return t('settings.themeSystem');
    }
  };

  const comingSoon = (msg: string) => () =>
    Alert.alert(t('settings.comingSoon'), msg);

  const SettingSection: React.FC<{
    title: string;
    children: React.ReactNode;
  }> = ({ title, children }) => (
    <View style={styles.section}>
      <Eyebrow style={styles.sectionTitle}>{title}</Eyebrow>
      <View
        style={[
          styles.sectionContent,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );

  const SettingRow: React.FC<SettingItem> = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    rightElement,
    dangerous,
    muted,
  }) => {
    const iconTint = dangerous
      ? colors.error
      : muted
        ? colors.textSecondary
        : colors.primary;
    const titleTint = dangerous ? colors.error : colors.textPrimary;
    return (
      <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: dangerous
                ? colors.error + '14'
                : colors.surfaceVariant,
            },
          ]}
        >
          <Icon size={19} color={iconTint} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.settingTitle, { color: titleTint }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.settingSubtitle, { color: colors.textSecondary }]}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {rightElement ||
          (onPress && <ChevronRight size={18} color={colors.textSecondary} />)}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerArea}>
          <Eyebrow style={styles.headerKicker}>
            {t('settings.headerKicker')}
          </Eyebrow>
          <Display size="xl" style={styles.screenTitle}>
            {t('settings.title')}
          </Display>

          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Display size="md" color="#fff" style={styles.avatarText}>
                {(userName.charAt(0) || 'S').toUpperCase()}
              </Display>
            </View>
            <View style={styles.profileInfo}>
              <Display size="sm" color={colors.textPrimary} numberOfLines={1}>
                {userName}
              </Display>
              <Text
                style={[styles.userEmail, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {userEmail}
              </Text>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <SettingSection title={t('settings.groupAppearance')}>
          <SettingRow
            icon={Moon}
            title={t('settings.theme')}
            subtitle={getThemeModeText()}
            onPress={() => setShowThemeSwitcher(true)}
          />
        </SettingSection>

        {/* Preferences */}
        <SettingSection title={t('settings.groupPreferences')}>
          <SettingRow
            icon={Bell}
            title={t('settings.notifications')}
            subtitle={t('settings.notificationsSubtitle')}
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : colors.surface}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow
            icon={Globe}
            title={t('settings.language')}
            subtitle={t('settings.languageValue')}
            muted
            onPress={comingSoon(t('settings.languageComingSoon'))}
          />
        </SettingSection>

        {/* Account */}
        <SettingSection title={t('settings.groupAccount')}>
          {subscription && subscription.subscription_status === 'active' && (
            <>
              <SettingRow
                icon={Crown}
                title={t('settings.mySubscription')}
                subtitle={`${getSubscriptionName(
                  subscription.price_id,
                )} · ${t('settings.subscriptionActive')}`}
                onPress={() => router.push('/subscription')}
              />
              <View
                style={[styles.divider, { backgroundColor: colors.divider }]}
              />
            </>
          )}
          <SettingRow
            icon={User}
            title={t('settings.editProfile')}
            muted
            onPress={comingSoon(t('settings.profileComingSoon'))}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow
            icon={Shield}
            title={t('settings.privacySecurity')}
            onPress={() => Linking.openURL(`${LEGAL_BASE}/privacy`)}
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title={t('settings.groupSupport')}>
          {(!subscription || subscription.subscription_status !== 'active') && (
            <>
              <SettingRow
                icon={Crown}
                title={t('settings.goPremium')}
                subtitle={t('settings.goPremiumSubtitle')}
                onPress={() => router.push('/subscription')}
              />
              <View
                style={[styles.divider, { backgroundColor: colors.divider }]}
              />
            </>
          )}
          <SettingRow
            icon={HelpCircle}
            title={t('settings.helpFaq')}
            muted
            onPress={comingSoon(t('settings.helpComingSoon'))}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow
            icon={Heart}
            title={t('settings.sendFeedback')}
            muted
            onPress={comingSoon(t('settings.feedbackComingSoon'))}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow
            icon={Star}
            title={t('settings.rateApp')}
            muted
            onPress={comingSoon(t('settings.rateComingSoon'))}
          />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title={t('settings.groupDanger')}>
          <SettingRow
            icon={LogOut}
            title={t('settings.logout')}
            dangerous
            onPress={handleLogout}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow
            icon={Trash2}
            title={t('settings.deleteAccount')}
            subtitle={t('settings.deleteAccountSubtitle')}
            dangerous
            onPress={handleDeleteAccount}
          />
        </SettingSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Display size="sm" color={colors.textSecondary}>
            Stovd
          </Display>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
            {t('settings.version', { version: '1.0.0' })}
          </Text>
        </View>
      </ScrollView>

      {/* Theme Switcher Modal */}
      <ThemeSwitcher
        visible={showThemeSwitcher}
        onClose={() => setShowThemeSwitcher(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerKicker: {
    marginBottom: 6,
  },
  screenTitle: {
    marginBottom: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...{
      shadowColor: '#3C2814',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontFamily: fonts.bodySemibold,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  userEmail: {
    fontSize: 13,
    fontFamily: fonts.body,
  },
  section: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...{
      shadowColor: '#3C2814',
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1,
    },
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15.5,
    fontFamily: fonts.bodyMedium,
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: fonts.body,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md + 38 + spacing.md,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: 4,
  },
  appVersion: {
    fontSize: 13,
    fontFamily: fonts.body,
  },
});
