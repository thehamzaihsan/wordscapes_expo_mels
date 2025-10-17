import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

type WordSpringsTextProps = {
  children: React.ReactNode;          
  style?: StyleProp<TextStyle>;      
};

const WordSpringsText = ({ children, style }: WordSpringsTextProps) => {
  return (
    <Text style={[styles.text, style]}>
      {children}
    </Text>
  );
};

// --- STYLES (No changes needed here) ---
const styles = StyleSheet.create({
  text: {
    fontFamily: 'Cormorant-Garamond',
    color: '#EAE0C8',
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default WordSpringsText;