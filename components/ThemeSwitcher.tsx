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

interface ThemeSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ visible, onClose }) => {
  const { theme, themeMode, setThemeMode } = useTheme();

  const options: { mode: ThemeMode; icon: any; label: string; description: string }[] = [
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
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Choose Theme
          </Text>
          
          {options.map(({ mode, icon: Icon, label, description }) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.option,
                { 
                  backgroundColor: theme.surfaceVariant,
                  borderColor: themeMode === mode ? theme.primary : theme.border,
                  borderWidth: themeMode === mode ? 2 : 1,
                },
              ]}
              onPress={() => {
                setThemeMode(mode);
                onClose();
              }}
            >
              <View style={[
                styles.iconContainer,
                { backgroundColor: themeMode === mode ? theme.primary + '20' : theme.background }
              ]}>
                <Icon
                  size={24}
                  color={themeMode === mode ? theme.primary : theme.textSecondary}
                />
              </View>
              
              <View style={styles.textContainer}>
                <Text style={[
                  styles.optionLabel,
                  { color: theme.textPrimary }
                ]}>
                  {label}
                </Text>
                <Text style={[
                  styles.optionDescription,
                  { color: theme.textSecondary }
                ]}>
                  {description}
                </Text>
              </View>
              
              {themeMode === mode && (
                <View style={[
                  styles.checkmark,
                  { backgroundColor: theme.primary }
                ]}>
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

// Compact version for settings
export const ThemeSwitcherButton: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: theme.surfaceVariant }]}
      onPress={toggleTheme}
    >
      {isDark ? (
        <Moon size={20} color={theme.textPrimary} />
      ) : (
        <Sun size={20} color={theme.textPrimary} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    borderRadius: 12,
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
