// lib/imageUtils.ts
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export const convertImageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      // Web için fetch API kullan
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            // "data:image/jpeg;base64," kısmını çıkar
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('Failed to read file as base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // Native için expo-file-system kullan
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to convert image to base64');
  }
};

export const validateImageSize = (base64: string, maxSizeKB: number): boolean => {
  try {
    // Base64 string boyutunu hesapla (KB cinsinden)
    const sizeInBytes = (base64.length * 3) / 4;
    const sizeInKB = sizeInBytes / 1024;
    
    console.log(`Image size: ${sizeInKB.toFixed(2)} KB (max: ${maxSizeKB} KB)`);
    
    return sizeInKB <= maxSizeKB;
  } catch (error) {
    console.error('Error validating image size:', error);
    return false;
  }
};

export const cleanBase64 = (base64: string): string => {
  // Remove data URL prefix if present
  return base64.replace(/^data:image\/[a-z]+;base64,/, '');
};