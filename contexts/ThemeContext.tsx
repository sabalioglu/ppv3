import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, type Colors } from '@/lib/theme/index';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colors: Colors;
  setThemeMode: (mode: ThemeMode) => void;
  themeMode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  setThemeMode: () => {},
  themeMode: 'dark',
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = '@ai_food_pantry_theme';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [colors, setColors] = useState<Colors>(darkColors);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when mode or system theme changes
  useEffect(() => {
    const newTheme = themeMode === 'system' ? systemColorScheme : themeMode;
    setColors(newTheme === 'dark' ? darkColors : lightColors);
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeMode(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  return (
    <ThemeContext.Provider
      value={{
        colors,
        setThemeMode: handleSetThemeMode,
        themeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
