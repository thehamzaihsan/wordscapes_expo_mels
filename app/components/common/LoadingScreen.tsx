import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import ThemedText from '../ui/ThemedText';
import BackgroundImage from './BackgroundImage';
const LoadingScreen: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <BackgroundImage blurRadius={10} overlayOpacity={0.8} />
      <ThemedText variant='heading3'>Loading</ThemedText>
      <View style={styles.progressContainer}>
        <ActivityIndicator 
          size="large" 
          color={theme.colors.primary} 
          style={{ marginTop: theme.spacing.md }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  progressContainer: {
    width: 220,
    alignItems: 'center',
  },
});

export default LoadingScreen;
