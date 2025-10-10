/**
 * Simple Safe Text Component
 * Minimal text component that avoids CSS property errors
 */

import React from 'react';
import { Text as RNText, TextProps, Platform } from 'react-native';

interface SimpleTextProps extends TextProps {
  variant?: 'heading' | 'body' | 'caption';
  color?: string;
}

const SimpleText: React.FC<SimpleTextProps> = ({ 
  children, 
  variant = 'body', 
  color = '#ffffff',
  style,
  ...textProps 
}) => {
  const getStyle = () => {
    const baseStyle = {
      color,
      fontFamily: Platform.OS === 'web' ? "'Helvetica Neue', Helvetica, Arial, sans-serif" : 'Helvetica Neue',
    };

    switch (variant) {
      case 'heading':
        return {
          ...baseStyle,
          fontSize: 20,
          fontWeight: '700' as const,
          lineHeight: 28,
        };
      case 'body':
        return {
          ...baseStyle,
          fontSize: 16,
          fontWeight: '400' as const,
          lineHeight: 24,
        };
      case 'caption':
        return {
          ...baseStyle,
          fontSize: 14,
          fontWeight: '400' as const,
          lineHeight: 20,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <RNText style={[getStyle(), style]} {...textProps}>
      {children}
    </RNText>
  );
};

export default SimpleText;