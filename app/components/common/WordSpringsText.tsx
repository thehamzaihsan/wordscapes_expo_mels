import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type WordSpringsTextProps = {
  children: React.ReactNode;          
  style?: StyleProp<TextStyle>;      
};

const WordSpringsText = ({ children, style }: WordSpringsTextProps) => {
  const { themeName } = useTheme();
  const isLightMode = themeName === 'light';

  const textShadowStyles = isLightMode
    ? {
        textShadowColor: 'rgba(0, 0, 0, 1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      }
    : {
        textShadowColor: 'transparent',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 0,
      };

  return (
    <Text style={[styles.text, textShadowStyles, style]}>
      {children}
    </Text>
  );
};

// --- STYLES (No changes needed here) ---
const styles = StyleSheet.create({
  text: {
    fontFamily: 'Pacifico',
    color: '#EAE0C8',
  },
});

export default WordSpringsText;