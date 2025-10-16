import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { Sun, Moon, Smartphone } from 'lucide-react-native';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { spacing, radius } from '../lib/theme/index';

interface ThemeSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

const options: {
  mode: ThemeMode;
  icon: any;
  label: string;
  description: string;
}[] = [
  {
    mode: 'light',
    icon: Sun,
    label: 'Light',
    description: 'Always use light theme',
  },
  {
    mode: 'dark',
    icon: Moon,
    label: 'Dark',
    description: 'Always use dark theme',
  },
  {
    mode: 'system',
    icon: Smartphone,
    label: 'System',
    description: 'Follow system settings',
  },
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  visible,
  onClose,
}) => {
  const { colors, themeMode, setThemeMode } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Choose Theme
          </Text>

          {options.map(({ mode, icon: Icon, label, description }) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.option,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor:
                    themeMode === mode ? colors.primary : colors.border,
                  borderWidth: themeMode === mode ? 2 : 1,
                },
              ]}
              onPress={() => {
                setThemeMode(mode);
                onClose();
              }}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor:
                      themeMode === mode
                        ? colors.primary + '20'
                        : colors.background,
                  },
                ]}
              >
                <Icon
                  size={24}
                  color={
                    themeMode === mode ? colors.primary : colors.textSecondary
                  }
                />
              </View>

              <View style={styles.textContainer}>
                <Text
                  style={[styles.optionLabel, { color: colors.textPrimary }]}
                >
                  {label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {description}
                </Text>
              </View>

              {themeMode === mode && (
                <View
                  style={[
                    styles.checkmark,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: radius.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
