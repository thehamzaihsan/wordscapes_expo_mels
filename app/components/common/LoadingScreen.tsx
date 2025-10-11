import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Bar as ProgressBar } from 'react-native-progress';

const LoadingScreen: React.FC = () => {
  const { theme } = useTheme();
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let startTime = Date.now();
    const duration = 1000; // 1 second

    const updateProgress = () => {
      const now = Date.now();
      const timePassed = now - startTime;
      const newProgress = Math.min(timePassed / duration, 1);
      
      if (newProgress < 1) {
        setProgress(newProgress);
        requestAnimationFrame(updateProgress);
      } else {
        setProgress(1);
      }
    };

    requestAnimationFrame(updateProgress);

    return () => {
      startTime = 0;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: theme.colors.text }]}>Loading</Text>
      <View style={styles.progressContainer}>
        <ProgressBar 
          progress={progress}
          width={200} 
          color={'#ffffff'}
          unfilledColor={theme.colors.background} 
          borderWidth={0}
          height={12}
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
    backgroundColor: '#4cd0fcff',
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
