import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import BackgroundImage from "../common/BackgroundImage";
// Import the custom text component from its path alias
import WordSpringsText from "@/components/common/WordSpringsText";

// Array of possible loading messages
const loadingMessages = [
  "Loading Quest",
  "Preparing Journey",
  "Assembling Words",
  "Charting the Course",
  "Warming Up the Springs",
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
      <Image
        style={styles.logo}
        source={require("../../assets/images/WorldSprings_logo_1.png")}
        resizeMode="contain"
      />

      {/* --- Use WordSpringsText component for the message --- */}
      <WordSpringsText style={styles.loadingText}>
        {currentMessage}
      </WordSpringsText>

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
  logo: {
    width: 200,
    height: 200,
  },
  // --- New style for the WordSpringsText component ---
  loadingText: {
    fontSize: 36, // Smaller than the main title, but still prominent
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingBarContainer: {
    width: "60%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    marginTop: 20, // Adjusted space below the new text style
  },
  loadingBarFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
});

export default LoadingScreen;