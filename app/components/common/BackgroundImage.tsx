/**
 * Background Image Component
 * Provides a centralized blurred background image for all screens
 */

import { useTheme } from '@/hooks/useTheme';
import { Image } from 'expo-image';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Use a static import so it works reliably on native and web
import bgImage from '../../../images/default_background.jpg';

interface BackgroundImageProps {
  blurRadius?: number;
  overlayOpacity?: number;
}

const BackgroundImage: React.FC<BackgroundImageProps> = ({
  blurRadius = 0,
  overlayOpacity,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Extend the background to cover behind safe-area paddings
  const containerInsetStyle = {
    top: -insets.top,
    bottom: -insets.bottom,
    left: -insets.left,
    right: -insets.right,
  } as const;

  const getOverlayOpacity = () => {
    if (overlayOpacity !== undefined) return overlayOpacity;
    switch (theme.name) {
      case 'light':
        return 0.1;
      case 'dark':
        return 0.25;
      case 'game':
        return 0.15;
      default:
        return 0.75;
    }
  };

  return (
    <View
      pointerEvents="none"
      style={[styles.container, containerInsetStyle]}
    >
     
        {/* <View>
          <Text>hello</Text>
          <Image
            source={bgImage}
            style={styles.backgroundImage}
            // resizeMode="cover"
            // imageStyle={
            //   blurRadius > 0
            //     ? {
            //         filter: `blur(${blurRadius}px)`,
            //         WebkitFilter: `blur(${blurRadius}px)`,
            //       } as any
            //     : undefined
            // }
          />
        </View> */}
        <Image
          source={bgImage}
          style={styles.backgroundImage}
          contentFit="cover"
          blurRadius={blurRadius}
          priority="high"
          cachePolicy="memory-disk"
          transition={200}
        />
      

      {/* Theme-aware overlay for text readability */}
      <View
        pointerEvents="none"
        style={[
          styles.overlay,
          {
            backgroundColor: theme.colors.background,
            opacity: getOverlayOpacity(),
          },
        ]}
      />

      {/* Fallback background for web if image fails to load */}
      {Platform.OS === 'web' && (
        <View
          pointerEvents="none"
          style={[
            styles.fallbackBackground,
            { backgroundColor: theme.colors.surfaceSecondary },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject, // fill parent
    zIndex: 0,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  fallbackBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1, // keep behind the image
  },
});

export default BackgroundImage;