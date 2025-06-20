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
} from 'react-native';
import {
  User,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Heart,
  Star,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { supabase } from '@/lib/supabase';
import { spacing } from '@/lib/theme';

interface SettingItem {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  dangerous?: boolean;
}

export default function SettingsScreen() {
  const { theme, isDark, themeMode } = useTheme();
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const getThemeModeText = () => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
    }
  };

  const SettingSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
        {children}
      </View>
    </View>
  );

  const SettingRow: React.FC<SettingItem> = ({ icon: Icon, title, subtitle, onPress, rightElement, dangerous }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.surfaceVariant }]}>
        <Icon size={20} color={dangerous ? theme.error : theme.primary} />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.settingTitle, { color: dangerous ? theme.error : theme.textPrimary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {rightElement || (onPress && <ChevronRight size={20} color={theme.textSecondary} />)}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: theme.textPrimary }]}>
              {userName}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {userEmail}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <SettingSection title="APPEARANCE">
          <SettingRow
            icon={Moon}
            title="Theme"
            subtitle={getThemeModeText()}
            onPress={() => setShowThemeSwitcher(true)}
          />
        </SettingSection>

        {/* Preferences */}
        <SettingSection title="PREFERENCES">
          <SettingRow
            icon={Bell}
            title="Notifications"
            subtitle="Expiry alerts and recommendations"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : theme.surface}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon={Globe}
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Coming Soon', 'Language selection will be available soon!')}
          />
        </SettingSection>

        {/* Account */}
        <SettingSection title="ACCOUNT">
          <SettingRow
            icon={User}
            title="Edit Profile"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon!')}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon={Shield}
            title="Privacy & Security"
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon!')}
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="SUPPORT">
          <SettingRow
            icon={HelpCircle}
            title="Help & FAQ"
            onPress={() => Alert.alert('Coming Soon', 'Help section will be available soon!')}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon={Heart}
            title="Send Feedback"
            onPress={() => Alert.alert('Coming Soon', 'Feedback feature will be available soon!')}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon={Star}
            title="Rate App"
            onPress={() => Alert.alert('Coming Soon', 'App rating will be available soon!')}
          />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title="ACCOUNT ACTIONS">
          <SettingRow
            icon={LogOut}
            title="Sign Out"
            dangerous
            onPress={handleLogout}
          />
        </SettingSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: theme.textSecondary }]}>
            AI Food Pantry
          </Text>
          <Text style={[styles.appVersion, { color: theme.textDisabled }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Theme Switcher Modal */}
      <ThemeSwitcher
        visible={showThemeSwitcher}
        onClose={() => setShowThemeSwitcher(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md + 36 + spacing.md,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
  },
});
