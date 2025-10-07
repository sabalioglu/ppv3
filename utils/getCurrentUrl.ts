import { Platform } from 'react-native';

export const getCurrentUrl = () => {
  return Platform.OS === 'web' ? `${window.location.origin}` : `pantrypal://`;
};
