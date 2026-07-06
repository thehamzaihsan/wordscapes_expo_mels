/**
 * Minimal Web-Safe Theme System
 * Ensures no CSS property conflicts on web
 */

import { Platform } from 'react-native';

// Simple spacing system with only named keys
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xl2: 32,
  xl3: 40,
  xl4: 48,
};

// Simple color system
export const colors = {
  // Game theme colors
  background: '#121213',
  surface: 'rgba(31,41,55,0.85)',
  text: '#ffffff',
  textSecondary: '#d1d5db',
  textTertiary: '#9ca3af',
  textInverse: '#111827',
  primary: '#2F9484',
  secondary: '#3b82f6',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  border: '#374151',
  borderSecondary: '#4b5563',
};

// Simple typography
export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xl2: 24,
    xl3: 30,
  },
  fontWeights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  fontFamilies: {
    regular: Platform.select({
      web: "system-ui, -apple-system, sans-serif",
      default: 'System',
    }) || 'System',
    medium: Platform.select({
      web: "system-ui, -apple-system, sans-serif",
      default: 'System',
    }) || 'System',
    bold: Platform.select({
      web: "system-ui, -apple-system, sans-serif",
      default: 'System',
    }) || 'System',
  },
};

// Simple border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Minimal theme object
export const minimalTheme = {
  colors,
  spacing,
  typography,
  borderRadius,
};

export type MinimalTheme = typeof minimalTheme;

export default minimalTheme;