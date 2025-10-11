/**
 * Theme Provider and Context
 * Provides theme context throughout the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, Theme, ThemeName } from '@/constants/themes';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
}

const THEME_STORAGE_KEY = '@wordscapes_theme';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'game' // Default to game theme
}) => {
  const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme as ThemeName) in themes) {
        setThemeName(savedTheme as ThemeName);
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (newThemeName: ThemeName) => {
    try {
      setThemeName(newThemeName);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeName);
    } catch (error) {
      console.warn('Failed to save theme to storage:', error);
    }
  };

  const toggleTheme = () => {
    const themeNames: ThemeName[] = ['light', 'dark', 'game'];
    const currentIndex = themeNames.indexOf(themeName);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    setTheme(themeNames[nextIndex]);
  };

  const theme = themes[themeName];

  const value: ThemeContextType = {
    theme,
    themeName,
    setTheme,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
    if (context === undefined) { 
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook for styled components that creates styles with proper typing
export const useThemedStyles = <T extends Record<string, any>>(
  styleFactory: (theme: Theme) => T
): T => {
  const { theme } = useTheme();
  return React.useMemo(() => styleFactory(theme), [theme, styleFactory]);
};

export default ThemeProvider;