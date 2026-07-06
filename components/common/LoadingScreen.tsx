import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { APP_NAME } from "@/constants/brand";
import BackgroundImage from "../common/BackgroundImage";
import BrandText from "@/components/common/BrandText";

// Array of possible loading messages
const loadingMessages = [
  "Loading Quest",
  "Preparing Journey",
  "Assembling Words",
  "Charting the Course",
  "Wandering the Grove",
  "Gathering Vowels",
];

const LoadingScreen: React.FC = () => {
  const [currentMessage, setCurrentMessage] = useState('');
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Select a random message when the component first loads
    const randomIndex = Math.floor(Math.random() * loadingMessages.length);
    setCurrentMessage(loadingMessages[randomIndex]);

    // Animate the progress value in a continuous loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [progress]);

  const loadingBarWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <BackgroundImage />
      <BrandText style={styles.wordmark}>{APP_NAME}</BrandText>
      <View style={styles.rule} />

      <BrandText style={styles.loadingText}>
        {currentMessage}
      </BrandText>

      {/* --- LOADING BAR --- */}
      <View style={styles.loadingBarContainer}>
        <Animated.View
          style={[styles.loadingBarFill, { width: loadingBarWidth }]}
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
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 52,
    letterSpacing: 2,
  },
  rule: {
    width: 72,
    height: 2,
    backgroundColor: '#DFA02E',
    borderRadius: 1,
    marginTop: 14,
    marginBottom: 22,
  },
  loadingText: {
    fontSize: 24,
    letterSpacing: 1.5,
    textAlign: 'center',
    opacity: 0.92,
  },
  loadingBarContainer: {
    width: "50%",
    maxWidth: 320,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 3,
    marginTop: 24,
  },
  loadingBarFill: {
    height: "100%",
    backgroundColor: "#DFA02E",
    borderRadius: 3,
  },
});

export default LoadingScreen;
