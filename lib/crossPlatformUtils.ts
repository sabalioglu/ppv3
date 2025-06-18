// lib/crossPlatformUtils.ts - YENİ DOSYA OLUŞTUR
import { Alert, Platform } from 'react-native';

export const showPrompt = (title: string, message: string, callback: (text: string) => void) => {
  if (Platform.OS === 'web') {
    // Web için native browser prompt
    const result = window.prompt(`${title}\n${message}`);
    if (result !== null) {
      callback(result);
    }
  } else {
    // Mobile için React Native Alert.prompt
    Alert.prompt(title, message, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: callback,
      },
    ]);
  }
};

// Kullanım: Alert.prompt yerine showPrompt kullanın
// showPrompt('Title', 'Message', (text) => { /* callback logic */ });
