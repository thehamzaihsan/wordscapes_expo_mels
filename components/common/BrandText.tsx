import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

type BrandTextProps = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  /** Accepted for backwards compatibility with older call sites; unused. */
  variant?: string;
};

/**
 * Display text for the wordmark and screen titles.
 * Set in the bundled Cormorant Garamond serif.
 */
const BrandText = ({ children, style }: BrandTextProps) => {
  const { themeName } = useTheme();
  const isLightMode = themeName === 'light';

  const textShadowStyles = isLightMode
    ? {
        textShadowColor: 'rgba(11, 27, 26, 0.85)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
      }
    : {
        textShadowColor: 'rgba(11, 27, 26, 0.45)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
      };

  return (
    <Text style={[styles.text, textShadowStyles, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Marcellus',
    letterSpacing: 1,
    color: '#ffffff',
  },
});

export default BrandText;
