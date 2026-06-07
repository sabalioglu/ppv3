// Cross-platform destructive confirm.
// RN Alert.alert multi-button onPress callbacks do NOT fire on web, so a native
// Alert silently no-ops there. On web we fall back to window.confirm; on native
// we show the usual cancel + destructive Alert.
import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void | Promise<void>;
}

export function confirmDestructive({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
}: ConfirmOptions): void {
  if (Platform.OS === 'web') {
    // window.confirm gives a single OK/Cancel; the message carries the context.
    if (typeof window !== 'undefined' && window.confirm(message)) {
      void onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    {
      text: confirmText,
      style: 'destructive',
      onPress: () => void onConfirm(),
    },
  ]);
}
