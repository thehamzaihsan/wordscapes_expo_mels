import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { APP_NAME, APP_TAGLINE } from "@/constants/brand";
import BackgroundImage from "../common/BackgroundImage";
import BrandLogo from "../common/BrandLogo";
import BrandText from "../common/BrandText";

export default function AnimatedSplashScreen() {
  // Create an animated value to track the loading progress
  const progress = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade the brand block in, and fill the loading bar over 3 seconds
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 900,
      useNativeDriver: false,
    }).start();
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false, // 'width' is a layout property, so this must be false
    }).start();
  }, [progress, fadeIn]);

  // Map the progress value (0 to 1) to a percentage width ('0%' to '100%')
  const loadingBarWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <BackgroundImage useProfiledBackground={false} />
      <Animated.View style={[styles.brandBlock, { opacity: fadeIn }]}>
        <BrandLogo size={128} />
        <BrandText style={styles.wordmark}>{APP_NAME}</BrandText>
        <BrandText style={styles.tagline}>{APP_TAGLINE}</BrandText>
      </Animated.View>

      {/* Loading Bar */}
      <View style={styles.loadingBarContainer}>
        <Animated.View
          style={[styles.loadingBarFill, { width: loadingBarWidth }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1B1A",
    alignItems: "center",
    justifyContent: "center",
  },
  brandBlock: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  wordmark: {
    fontSize: 58,
    letterSpacing: 3,
    textAlign: "center",
    marginTop: 18,
  },
  tagline: {
    fontSize: 19,
    letterSpacing: 1.5,
    textAlign: "center",
    opacity: 0.9,
    marginTop: 8,
  },
  // --- STYLES FOR THE LOADING BAR ---
  loadingBarContainer: {
    width: "50%",
    maxWidth: 320,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.25)", // A semi-transparent white track
    borderRadius: 3,
    marginTop: 36, // Space below the brand block
  },
  loadingBarFill: {
    height: "100%",
    backgroundColor: "#DFA02E", // Gold fill
    borderRadius: 3,
  },
});
