/**
 * Enhanced Theme System — "Alpine Dusk"
 * Centralized theme definitions for dynamic theming support.
 *
 * Palette direction: the app plays over full-bleed nature photography
 * (mountain / ocean / forest), so surfaces are deep pine-teal ink glass,
 * the primary is a lagoon teal-green, and a single warm gold accent
 * carries rewards / XP / warmth.
 */

import { Platform } from 'react-native';

// Base color palette
export const BaseColors = {
  // Lagoon teal-green — primary
  lagoon: {
    50: '#EEF7F5',
    100: '#D7EDE8',
    200: '#AFDBD2',
    300: '#7EC4B6',
    400: '#4FAB9A',
    500: '#2F9484',
    600: '#207D6E',
    700: '#17655A',
    800: '#114E45',
    900: '#0C3A34',
  },
  // Sunrise gold — accent / rewards / warning
  gold: {
    50: '#FDF8EC',
    100: '#FAEDCB',
    200: '#F5DD9B',
    300: '#EFC96B',
    400: '#E9B647',
    500: '#DFA02E',
    600: '#C08324',
    700: '#99661D',
    800: '#734B17',
    900: '#543711',
  },
  // Fern — success
  fern: {
    50: '#EFF7F0',
    100: '#D8EDDC',
    200: '#B0DBB8',
    300: '#87C594',
    400: '#66BC76',
    500: '#4CAA5E',
    600: '#3B8F4C',
    700: '#2E713C',
    800: '#23552E',
    900: '#1A3F22',
  },
  // Coral — error
  coral: {
    50: '#FDF1F0',
    100: '#F9DBD9',
    200: '#F2B6B2',
    300: '#EC948E',
    400: '#E97C74',
    500: '#E15A51',
    600: '#C4463E',
    700: '#9E362F',
    800: '#772923',
    900: '#571E1A',
  },
  // Sky — info
  sky: {
    50: '#F0F6FB',
    100: '#DBEAF5',
    200: '#B6D4EA',
    300: '#8FBCDD',
    400: '#6FA8D0',
    500: '#4A90C2',
    600: '#3A76A3',
    700: '#2E5D81',
    800: '#234660',
    900: '#193344',
  },
  // Ink — teal-tinted neutrals
  ink: {
    50: '#F4F8F7',
    100: '#E6EEEC',
    200: '#CFDDDA',
    300: '#AEC2BE',
    400: '#85A09B',
    500: '#64807B',
    600: '#4B6560',
    700: '#38504B',
    800: '#243835',
    900: '#132322',
    950: '#0B1B1A',
  },
};

// Typography system
export const Typography = {
  fontFamilies: {
    regular: Platform.OS === 'web'
      ? "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
      : 'Helvetica',
    medium: Platform.OS === 'web'
      ? "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
      : 'Helvetica',
    bold: Platform.OS === 'web'
      ? "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
      : 'Helvetica',
    rounded: Platform.OS === 'web'
      ? "ui-rounded, 'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif"
      : 'Helvetica',
    // Display serif for the wordmark and level titles (bundled font)
    display: 'Marcellus',
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

// Border radius system — a monotonic scale (was previously jumbled)
export const BorderRadius = {
  none: 0,
  sm: 8,
  base: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xl2: 24,
  xl3: 28,
  full: 9999,
};

// Shadow system
export const Shadows = {
  sm: {
    shadowColor: '#0B1B1A',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.14,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#0B1B1A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
  },
  lg: {
    shadowColor: '#0B1B1A',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  xl: {
    shadowColor: '#0B1B1A',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const DarkThemeShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 12,
  },
};

// Theme definitions
export const LightTheme = {
  name: 'light',
  colors: {
    // Primary colors
    primary: BaseColors.lagoon[600],
    primaryLight: BaseColors.lagoon[500],
    primaryDark: BaseColors.lagoon[700],

    // Secondary colors — warm gold accent
    secondary: BaseColors.gold[600],
    secondaryLight: BaseColors.gold[500],
    secondaryDark: BaseColors.gold[700],

    // Success/Error/Warning
    success: BaseColors.fern[600],
    error: BaseColors.coral[600],
    warning: BaseColors.gold[600],
    info: BaseColors.sky[600],

    // Background colors
    background: '#F2F7F6',
    backgroundSecondary: BaseColors.ink[100],
    backgroundTertiary: BaseColors.ink[200],

    // Surface colors
    surface: '#ffffff',
    surfaceSecondary: BaseColors.ink[50],
    surfaceTertiary: BaseColors.ink[100],

    // Text colors
    text: BaseColors.ink[900],
    textSecondary: BaseColors.ink[600],
    textTertiary: BaseColors.ink[500],
    textInverse: '#ffffff',

    // Border colors
    border: BaseColors.ink[300],
    borderSecondary: BaseColors.ink[200],
    borderTertiary: BaseColors.ink[100],

    // Game specific
    gameBackground: BaseColors.lagoon[50],
    gameGrid: '#ffffff',
    gameLetter: BaseColors.ink[800],
    gameAccent: BaseColors.lagoon[600],

    // Difficulty colors
    easy: BaseColors.fern[500],
    medium: BaseColors.gold[500],
    hard: BaseColors.coral[500],

    // Overlay colors
    overlay: 'rgba(11, 27, 26, 0.5)',
    overlayLight: 'rgba(11, 27, 26, 0.2)',

    // Glassmorphism colors (theme-aware)
    glassmorphismBackground: 'rgba(255, 255, 255, 0.78)',
    glassmorphismBorder: 'rgba(255, 255, 255, 0.95)',
    glassmorphismBackgroundStrong: 'rgba(255, 255, 255, 0.86)',
    glassmorphismBorderStrong: 'rgba(255, 255, 255, 1)',

    // Status bar
    statusBar: BaseColors.ink[900],
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
    primary: BaseColors.lagoon[500],
    primaryLight: BaseColors.lagoon[400],
    primaryDark: BaseColors.lagoon[600],

    // Secondary colors — warm gold accent
    secondary: BaseColors.gold[500],
    secondaryLight: BaseColors.gold[400],
    secondaryDark: BaseColors.gold[600],

    // Success/Error/Warning
    success: BaseColors.fern[500],
    error: BaseColors.coral[500],
    warning: BaseColors.gold[500],
    info: BaseColors.sky[500],

    // Background colors
    background: BaseColors.ink[950],
    backgroundSecondary: BaseColors.ink[900],
    backgroundTertiary: BaseColors.ink[800],

    // Surface colors
    surface: BaseColors.ink[900],
    surfaceSecondary: BaseColors.ink[800],
    surfaceTertiary: BaseColors.ink[700],

    // Text colors
    text: BaseColors.ink[50],
    textSecondary: BaseColors.ink[200],
    textTertiary: BaseColors.ink[300],
    textInverse: BaseColors.ink[900],

    // Border colors
    border: BaseColors.ink[700],
    borderSecondary: BaseColors.ink[800],
    borderTertiary: BaseColors.ink[900],

    // Game specific
    gameBackground: BaseColors.ink[950],
    gameGrid: BaseColors.ink[900],
    gameLetter: BaseColors.ink[50],
    gameAccent: BaseColors.lagoon[400],

    // Difficulty colors
    easy: BaseColors.fern[400],
    medium: BaseColors.gold[400],
    hard: BaseColors.coral[400],

    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',

    // Glassmorphism colors (theme-aware)
    glassmorphismBackground: 'rgba(11, 27, 26, 0.72)',
    glassmorphismBorder: 'rgba(175, 219, 210, 0.18)',
    glassmorphismBackgroundStrong: 'rgba(11, 27, 26, 0.85)',
    glassmorphismBorderStrong: 'rgba(175, 219, 210, 0.28)',

    // Status bar
    statusBar: BaseColors.ink[950],
  },
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: DarkThemeShadows,
};

// Game specific theme for the current game style
export const GameTheme = {
  name: 'game',
  colors: {
    // Primary colors
    primary: BaseColors.lagoon[500],
    primaryLight: BaseColors.lagoon[400],
    primaryDark: BaseColors.lagoon[600],

    // Secondary colors — warm gold accent
    secondary: BaseColors.gold[500],
    secondaryLight: BaseColors.gold[400],
    secondaryDark: BaseColors.gold[600],

    // Success/Error/Warning
    success: BaseColors.fern[500],
    error: BaseColors.coral[500],
    warning: BaseColors.gold[500],
    info: BaseColors.sky[500],

    // Background colors - translucent for game overlay feel
    background: 'rgba(9, 22, 21, 0.85)',
    backgroundSecondary: 'rgba(19, 35, 34, 0.75)',
    backgroundTertiary: 'rgba(36, 56, 53, 0.65)',

    // Surface colors
    surface: 'rgba(19, 35, 34, 0.75)',
    surfaceSecondary: 'rgba(36, 56, 53, 0.65)',
    surfaceTertiary: 'rgba(56, 80, 75, 0.55)',

    // Text colors
    text: '#ffffff',
    textSecondary: BaseColors.ink[200],
    textTertiary: BaseColors.ink[300],
    textInverse: BaseColors.ink[900],

    // Border colors
    border: BaseColors.ink[600],
    borderSecondary: BaseColors.ink[700],
    borderTertiary: BaseColors.ink[800],

    // Game specific
    gameBackground: 'rgba(9, 22, 21, 0.85)',
    gameGrid: 'rgba(19, 35, 34, 0.75)',
    gameLetter: '#ffffff',
    gameAccent: BaseColors.lagoon[400],

    // Difficulty colors
    easy: BaseColors.fern[400],
    medium: BaseColors.gold[400],
    hard: BaseColors.coral[400],

    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.8)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',

    // Glassmorphism colors (theme-aware)
    glassmorphismBackground: 'rgba(10, 24, 23, 0.62)',
    glassmorphismBorder: 'rgba(191, 235, 224, 0.16)',
    glassmorphismBackgroundStrong: 'rgba(10, 24, 23, 0.78)',
    glassmorphismBorderStrong: 'rgba(191, 235, 224, 0.24)',

    // Status bar
    statusBar: '#0B1B1A',
  },
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: DarkThemeShadows,
};

export type Theme = typeof LightTheme;
export type ThemeName = 'light' | 'dark' | 'game';

export const themes: Record<ThemeName, Theme> = {
  light: LightTheme,
  dark: DarkTheme,
  game: GameTheme,
};

export default themes;
