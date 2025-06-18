// lib/crossPlatformUtils.ts - Cross-platform Alert.prompt replacement
import { Alert, Platform } from 'react-native';

export const showPrompt = (title: string, message: string, callback: (text: string | null) => void) => {
  if (Platform.OS === 'web') {
    // Web için native browser prompt
    const result = window.prompt(`${title}\n${message}`);
    callback(result);
  } else {
    // Mobile için React Native Alert.prompt
    Alert.prompt(
      title, 
      message, 
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => callback(null),
        },
        {
          text: 'OK',
          onPress: (text) => callback(text || null),
        },
      ],
      'plain-text'
    );
  }
};