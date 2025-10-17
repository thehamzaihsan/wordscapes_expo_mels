/**
 * Background Image Component
 * Provides a centralized blurred background image for all screens
 */

import { useTheme } from '@/hooks/useTheme';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface BackgroundImageProps {
  blurRadius?: number;
  overlayOpacity?: number;
}

const BackgroundImage: React.FC<BackgroundImageProps> = ({ 
  blurRadius = 0,
  overlayOpacity 
}) => {
  const { theme } = useTheme();
  
  // Dynamic opacity based on theme for better text readability
  const getOverlayOpacity = () => {
    if (overlayOpacity !== undefined) return overlayOpacity;
    
    switch (theme.name) {
      case 'light':
        return 0.35; // Reduced overlay for light theme (was 0.85)
      case 'dark':
        return 0.25;  // Reduced overlay for dark theme (was 0.7)
      case 'game':
        return 0.15;  // Minimal overlay for game theme (was 0.6)
      default:
        return 0.3;   // Reduced default overlay (was 0.75)
    }
  };

  return (
    <>
      {/* Background Image with Blur */}
      <Image
        source={require("../../../images/default_background.jpg")}
        style={styles.backgroundImage}
        contentFit="cover"
        blurRadius={blurRadius}
        priority="high"
        cachePolicy="memory-disk"
      />
      
      {/* Theme-aware overlay for text readability */}
      <View 
        style={[
          styles.overlay,
          { 
            backgroundColor: theme.colors.background,
            opacity: getOverlayOpacity()
          }
        ]} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 2,
  },
});

export default BackgroundImage;