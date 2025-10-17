/**
 * Enhanced Theme System
 * Centralized theme definitions for dynamic theming support
 */

import { Platform } from 'react-native';

// Base color palette
export const BaseColors = {
  // Primary Colors
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  green: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Typography system
export const Typography = {
  fontFamilies: {
    regular: Platform.OS === 'web' 
      ? '"Helvetica Neue", Helvetica, Arial, sans-serif'
      : Platform.OS === 'ios' 
        ? 'Helvetica' 
        : 'Helvetica',
    medium: Platform.OS === 'web'
      ? '"Helvetica Neue", Helvetica, Arial, sans-serif'
      : Platform.OS === 'ios'
        ? 'Helvetica'
        : 'Helvetica',
    bold: Platform.OS === 'web'
      ? '"Helvetica Neue", Helvetica, Arial, sans-serif'
      : Platform.OS === 'ios'
        ? 'Helvetica'
        : 'Helvetica',
    rounded: Platform.OS === 'web'
      ? '"Helvetica Neue", Helvetica, Arial, sans-serif'
      : Platform.OS === 'ios'
        ? 'Helvetica'
        : 'Helvetica',
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xl2: 24,
    xl3: 30,
    xl4: 36,
    xl5: 48,
    xl6: 60,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    xl2: 32,
    xl3: 36,
    xl4: 40,
    xl5: 52,
    xl6: 64,
  },
  fontWeights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

// Spacing system
export const Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xl2: 28,
  xl3: 32,
  xl4: 40,
  xl5: 48,
  xl6: 64,
  xl7: 80,
  xl8: 96,
  xl9: 128,
};

// Border radius system
export const BorderRadius = {
  none: 0,
  sm: 20,
  base: 24,
  md: 32,
  lg: 16,
  xl: 20,
  xl2: 24,
  xl3: 32,
  full: 9999,
};

// Shadow system
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};

// Theme definitions
export const LightTheme = {
  name: 'light',
  colors: {
    // Primary colors
    primary: BaseColors.purple[600],
    primaryLight: BaseColors.purple[500],
    primaryDark: BaseColors.purple[700],
    
    // Secondary colors
    secondary: BaseColors.blue[600],
    secondaryLight: BaseColors.blue[500],
    secondaryDark: BaseColors.blue[700],
    
    // Success/Error/Warning
    success: BaseColors.green[600],
    error: BaseColors.red[600],
    warning: BaseColors.amber[600],
    info: BaseColors.blue[600],
    
    // Background colors
    background: '#ffffff',
    backgroundSecondary: BaseColors.gray[50],
    backgroundTertiary: BaseColors.gray[100],
    
    // Surface colors
    surface: '#ffffff',
    surfaceSecondary: BaseColors.gray[50],
    surfaceTertiary: BaseColors.gray[100],
    
    // Text colors
    text: BaseColors.gray[900],
    textSecondary: BaseColors.gray[600],
    textTertiary: BaseColors.gray[500],
    textInverse: '#ffffff',
    
    // Border colors
    border: BaseColors.gray[400],
    borderSecondary: BaseColors.gray[300],
    borderTertiary: BaseColors.gray[200],
    
    // Game specific
    gameBackground: BaseColors.purple[50],
    gameGrid: '#ffffff',
    gameLetter: BaseColors.gray[800],
    gameAccent: BaseColors.purple[600],
    
    // Difficulty colors
    easy: BaseColors.green[500],
    medium: BaseColors.amber[500],
    hard: BaseColors.red[500],
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.2)',
    
    // Glassmorphism colors (theme-aware) - Fixed for light mode visibility
    glassmorphismBackground: 'rgba(255, 255, 255, 0.75)',
    glassmorphismBorder: 'rgba(255, 255, 255, 1)',
    glassmorphismBackgroundStrong: 'rgba(255, 255, 255, 0.75)',
    glassmorphismBorderStrong: 'rgba(255, 255, 255, 1)',
    
    // Status bar
    statusBar: BaseColors.gray[900],
  },
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

export const DarkTheme = {
  name: 'dark',
  colors: {
    // Primary colors
    primary: BaseColors.purple[500],
    primaryLight: BaseColors.purple[400],
    primaryDark: BaseColors.purple[600],
    
    // Secondary colors
    secondary: BaseColors.blue[500],
    secondaryLight: BaseColors.blue[400],
    secondaryDark: BaseColors.blue[600],
    
    // Success/Error/Warning
    success: BaseColors.green[500],
    error: BaseColors.red[500],
    warning: BaseColors.amber[500],
    info: BaseColors.blue[500],
    
    // Background colors
    background: '#121213',
    backgroundSecondary: BaseColors.gray[900],
    backgroundTertiary: BaseColors.gray[800],
    
    // Surface colors
    surface: BaseColors.gray[800],
    surfaceSecondary: BaseColors.gray[700],
    surfaceTertiary: BaseColors.gray[600],
    
    // Text colors
    text: '#ffffff',
    textSecondary: BaseColors.gray[300],
    textTertiary: BaseColors.gray[400],
    textInverse: BaseColors.gray[900],
    
    // Border colors
    border: BaseColors.gray[600],
    borderSecondary: BaseColors.gray[700],
    borderTertiary: BaseColors.gray[800],
    
    // Game specific
    gameBackground: BaseColors.gray[900],
    gameGrid: BaseColors.gray[800],
    gameLetter: '#ffffff',
    gameAccent: BaseColors.purple[500],
    
    // Difficulty colors
    easy: BaseColors.green[400],
    medium: BaseColors.amber[400],
    hard: BaseColors.red[400],
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    
    // Glassmorphism colors (theme-aware)
    glassmorphismBackground: 'rgba(0, 0, 0, 0.97)',
    glassmorphismBorder: 'rgba(255, 255, 255, 0.2)',
    glassmorphismBackgroundStrong: 'rgba(0, 0, 0, 1)',
    glassmorphismBorderStrong: 'rgba(255, 255, 255, 0.3)',
    
    // Status bar
    statusBar: '#121213',
  },
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

// Game specific theme for the current game style
export const GameTheme = {
  name: 'game',
  colors: {
    // Primary colors
    primary: BaseColors.purple[600],
    primaryLight: BaseColors.purple[500],
    primaryDark: BaseColors.purple[700],
    
    // Secondary colors
    secondary: BaseColors.blue[600],
    secondaryLight: BaseColors.blue[500],
    secondaryDark: BaseColors.blue[700],
    
    // Success/Error/Warning
    success: BaseColors.green[500],
    error: BaseColors.red[500],
    warning: BaseColors.amber[500],
    info: BaseColors.blue[500],
    
    // Background colors - translucent for game overlay feel
    background: 'rgba(18, 18, 19, 0.95)',
    backgroundSecondary: 'rgba(31, 41, 55, 0.85)',
    backgroundTertiary: 'rgba(55, 65, 81, 0.75)',
    
    // Surface colors
    surface: 'rgba(31, 41, 55, 0.85)',
    surfaceSecondary: 'rgba(55, 65, 81, 0.75)',
    surfaceTertiary: 'rgba(75, 85, 99, 0.65)',
    
    // Text colors
    text: '#ffffff',
    textSecondary: BaseColors.gray[300],
    textTertiary: BaseColors.gray[400],
    textInverse: BaseColors.gray[900],
    
    // Border colors
    border: BaseColors.gray[600],
    borderSecondary: BaseColors.gray[700],
    borderTertiary: BaseColors.gray[800],
    
    // Game specific
    gameBackground: 'rgba(18, 18, 19, 0.95)',
    gameGrid: 'rgba(31, 41, 55, 0.85)',
    gameLetter: '#ffffff',
    gameAccent: BaseColors.purple[500],
    
    // Difficulty colors
    easy: BaseColors.green[400],
    medium: BaseColors.amber[400],
    hard: BaseColors.red[400],
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.8)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
    
    // Glassmorphism colors (theme-aware)
    glassmorphismBackground: 'rgba(255, 255, 255, 0.1)',
    glassmorphismBorder: 'rgba(255, 255, 255, 0.2)',
    glassmorphismBackgroundStrong: 'rgba(49, 53, 70, 0.6)',
    glassmorphismBorderStrong: 'rgba(255, 255, 255, 0.3)',
    
    // Status bar
    statusBar: '#121213',
  },
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

export type Theme = typeof LightTheme;
export type ThemeName = 'light' | 'dark' | 'game';

export const themes: Record<ThemeName, Theme> = {
  light: LightTheme,
  dark: DarkTheme,
  game: GameTheme,
};

export default themes;