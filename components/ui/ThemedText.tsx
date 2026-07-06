/**
 * Centralized Text Component
 * Dynamic text component with theme support
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/hooks/useTheme';

type TextVariant = 
  | 'display' 
  | 'heading1' 
  | 'heading2' 
  | 'heading3' 
  | 'heading4' 
  | 'body1' 
  | 'body2' 
  | 'caption' 
  | 'overline'
  | 'button';

type TextColor = 
  | 'primary' 
  | 'secondary' 
  | 'text' 
  | 'textSecondary' 
  | 'textTertiary' 
  | 'textInverse'
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info';

interface TextProps extends Omit<RNTextProps, 'style'> {
  variant?: TextVariant;
  color?: TextColor;
  weight?: keyof Theme['typography']['fontWeights'];
  align?: 'left' | 'center' | 'right' | 'justify';
  style?: TextStyle;
}

const Text: React.FC<TextProps> = ({
  children,
  variant = 'body1',
  color = 'text',
  weight,
  align = 'left',
  style,
  ...textProps
}) => {
  const { theme } = useTheme();

  const getVariantStyles = (): TextStyle => {
    // Use proper React Native font family strings
    const baseFont = theme.typography.fontFamilies?.regular || 'System';
    const mediumFont = theme.typography.fontFamilies?.medium || 'System';
    const boldFont = theme.typography.fontFamilies?.bold || 'System';
    // Brand display serif for headings; single-weight face, so no faux bold
    const displayFont = theme.typography.fontFamilies?.display || boldFont;

    const baseStyles: TextStyle = {
      fontSize: theme.typography.fontSizes.base,
      lineHeight: theme.typography.lineHeights.base,
      fontWeight: theme.typography.fontWeights.normal,
      fontFamily: baseFont,
    };

    switch (variant) {
      case 'display':
        return {
          ...baseStyles,
          fontSize: theme.typography.fontSizes.xl6,
          lineHeight: theme.typography.lineHeights.xl6,
          fontWeight: theme.typography.fontWeights.normal,
          fontFamily: displayFont,
          letterSpacing: 0.5,
        };
      case 'heading1':
        return {
          ...baseStyles,
          fontSize: theme.typography.fontSizes.xl5,
          lineHeight: theme.typography.lineHeights.xl5,
          fontWeight: theme.typography.fontWeights.normal,
          fontFamily: displayFont,
          letterSpacing: 0.5,
        };
      case 'heading2':
        return {
          ...baseStyles,
          fontSize: theme.typography.fontSizes.xl4,
          lineHeight: theme.typography.lineHeights.xl4,
          fontWeight: theme.typography.fontWeights.normal,
          fontFamily: displayFont,
          letterSpacing: 0.5,
        };
      case 'heading3':
        return {
          ...baseStyles,
          fontSize: theme.typography.fontSizes.xl3,
          lineHeight: theme.typography.lineHeights.xl3,
          fontWeight: theme.typography.fontWeights.normal,
          fontFamily: displayFont,
          letterSpacing: 0.5,
        };
      case 'heading4':
        return {
          ...baseStyles,
          fontSize: theme.typography.fontSizes.xl2,
          lineHeight: theme.typography.lineHeights.xl2,
          fontWeight: theme.typography.fontWeights.normal,
          fontFamily: displayFont,
          letterSpacing: 0.5,
        };
      case 'body1':
        return {
          ...baseStyles,
          fontSize: theme.typography.fontSizes.base,
          lineHeight: theme.typography.lineHeights.base,
          fontWeight: theme.typography.fontWeights.normal,
          fontFamily: baseFont,
        };
      case 'body2':
        return {
          ...baseStyles,
          fontSize: theme.typography.fontSizes.sm,
          lineHeight: theme.typography.lineHeights.sm,
          fontWeight: theme.typography.fontWeights.normal,
          fontFamily: baseFont,
        };
      case 'caption':
        return {
          ...baseStyles,
          fontSize: theme.typography.fontSizes.xs,
          lineHeight: theme.typography.lineHeights.xs,
          fontWeight: theme.typography.fontWeights.normal,
          fontFamily: baseFont,
        };
      case 'overline':
        return {
          ...baseStyles,
          fontSize: theme.typography.fontSizes.xs,
          lineHeight: theme.typography.lineHeights.xs,
          fontWeight: theme.typography.fontWeights.semibold,
          fontFamily: mediumFont,
          letterSpacing: 1.5,
        };
      case 'button':
        return {
          ...baseStyles,
          fontSize: theme.typography.fontSizes.base,
          lineHeight: theme.typography.lineHeights.base,
          fontWeight: theme.typography.fontWeights.semibold,
          fontFamily: mediumFont,
        };
      default:
        return baseStyles;
    }
  };

  const getColorStyles = (): { color: string } => {
    switch (color) {
      case 'primary':
        return { color: theme.colors.primary };
      case 'secondary':
        return { color: theme.colors.secondary };
      case 'text':
        return { color: theme.colors.text };
      case 'textSecondary':
        return { color: theme.colors.textSecondary };
      case 'textTertiary':
        return { color: theme.colors.textTertiary };
      case 'textInverse':
        return { color: theme.colors.textInverse };
      case 'success':
        return { color: theme.colors.success };
      case 'error':
        return { color: theme.colors.error };
      case 'warning':
        return { color: theme.colors.warning };
      case 'info':
        return { color: theme.colors.info };
      default:
        return { color: theme.colors.text };
    }
  };

  const variantStyles = getVariantStyles();
  const colorStyles = getColorStyles();
  const isDisplayVariant =
    variant === 'display' ||
    variant === 'heading1' ||
    variant === 'heading2' ||
    variant === 'heading3' ||
    variant === 'heading4';

  const finalStyle: TextStyle = {
    ...variantStyles,
    ...colorStyles,
    textAlign: align,
    // Headings keep the brand display face regardless of `weight`
    ...(weight && !isDisplayVariant && {
      fontWeight: theme.typography.fontWeights[weight],
      fontFamily: weight === 'bold' || weight === 'extrabold' 
        ? theme.typography.fontFamilies.bold 
        : weight === 'medium' || weight === 'semibold'
        ? theme.typography.fontFamilies.medium
        : theme.typography.fontFamilies.regular,
    }),
    ...(Array.isArray(style) ? StyleSheet.flatten(style) : style || {}),
  };

  return (
    <RNText style={finalStyle} {...textProps}>
      {children}
    </RNText>
  );
};

export default Text;