// components/LanguageSwitcher.tsx — bottom-sheet language picker.
// Mirrors ThemeSwitcher; selecting a language applies it instantly (reactive)
// and persists the choice via the LocaleContext.
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useTranslation } from '@/contexts/LocaleContext';
import type { AppLocale } from '@/lib/i18n';
import { spacing, radius, fonts } from '@/lib/theme/index';

interface LanguageSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

const LANGUAGES: { code: AppLocale; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'tr', label: 'Türkçe', native: 'Turkish' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();

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
            {t('settings.languageChoose')}
          </Text>

          {LANGUAGES.map(({ code, label, native }) => {
            const selected = locale === code;
            return (
              <TouchableOpacity
                key={code}
                style={[
                  styles.option,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: selected ? colors.primary : colors.border,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  setLocale(code);
                  onClose();
                }}
              >
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: selected
                        ? colors.primary + '20'
                        : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: selected ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    {code.toUpperCase()}
                  </Text>
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
                    {native}
                  </Text>
                </View>

                {selected && (
                  <View
                    style={[
                      styles.checkmark,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Check size={15} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
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
    fontFamily: fonts.displayBold,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: radius.md,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  badgeText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  textContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: fonts.bodySemibold,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: fonts.body,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
