import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import ThemedButton from './ThemedButton';
import ThemedText from './ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, shadows, spacing } from '@/lib/theme/index';

export type Button = {
  text: string;
  onPress?: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  message: string;
  buttons: Button[];
  onClose: () => void;
};

export default function CustomAlert({
  visible,
  title,
  message,
  buttons,
  onClose,
}: Props) {
  const { colors } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.background, ...shadows.xl },
          ]}
        >
          <ThemedText type="body" bold style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="caption">{message}</ThemedText>
          <View style={styles.buttons}>
            {buttons.map((btn, idx) => (
              <ThemedButton
                key={idx}
                text={btn.text}
                variant="bold"
                style={styles.button}
                onPress={() => {
                  btn.onPress?.();
                  onClose();
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    borderRadius: radius.md,
    width: '80%',
  },
  title: {
    marginBottom: spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  button: {
    marginBottom: 0,
    marginTop: 0,
    marginLeft: 12,
    padding: spacing.xs,
  },
});
