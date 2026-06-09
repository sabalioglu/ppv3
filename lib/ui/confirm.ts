// Cross-platform Alert helpers.
// RN Alert.alert multi-button onPress callbacks do NOT fire on web, so a native
// Alert silently no-ops there. On web we fall back to window.confirm /
// window.alert; on native we show the usual buttoned Alert.
import { Alert, Platform } from 'react-native';
import { t } from '@/lib/i18n';

const isWeb = Platform.OS === 'web';
const hasWindow = typeof window !== 'undefined';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

// Cancel + confirm (destructive by default). onCancel covers binary choices.
export function confirmDestructive({
  title,
  message,
  confirmText,
  cancelText,
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmOptions): void {
  const cancel = cancelText ?? t('common.cancel');
  if (isWeb) {
    // window.confirm gives a single OK/Cancel; the message carries the context.
    if (hasWindow && window.confirm(message)) {
      void onConfirm();
    } else {
      onCancel?.();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: cancel, style: 'cancel', onPress: onCancel },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: () => void onConfirm(),
    },
  ]);
}

// Info alert with one secondary action (e.g. "View list"). On web the action
// maps to the confirm's OK; dismissing skips it.
export function alertWithAction(opts: {
  title: string;
  message?: string;
  actionText: string;
  onAction: () => void;
  okText?: string;
}): void {
  const {
    title,
    message,
    actionText,
    onAction,
    okText = t('common.ok'),
  } = opts;
  if (isWeb) {
    const body = message ? `${title}\n\n${message}` : title;
    if (hasWindow && window.confirm(`${body}\n\n[OK → ${actionText}]`)) {
      onAction();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: actionText, onPress: onAction },
    { text: okText, style: 'cancel' },
  ]);
}

// Single-button notice whose dismissal must run a callback (e.g. close a modal).
export function notify(
  title: string,
  message?: string,
  onDismiss?: () => void,
): void {
  if (isWeb) {
    if (hasWindow) window.alert(message ? `${title}\n\n${message}` : title);
    onDismiss?.();
    return;
  }
  Alert.alert(
    title,
    message,
    onDismiss ? [{ text: t('common.ok'), onPress: onDismiss }] : undefined,
  );
}
