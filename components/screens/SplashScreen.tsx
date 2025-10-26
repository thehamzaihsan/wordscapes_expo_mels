// app/components/SplashScreen.js
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import BackgroundImage from "../common/BackgroundImage";
import WordSpringsText from "../common/WordSpringsText"; // Make sure this path is correct
export default function AnimatedSplashScreen() {
  // Create an animated value to track the loading progress
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate the progress value from 0 to 1 over 3 seconds
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000, // 3000 milliseconds = 3 seconds
      useNativeDriver: false, // 'width' is a layout property, so this must be false
    }).start();
  }, [progress]);

  // Map the progress value (0 to 1) to a percentage width ('0%' to '100%')
  const loadingBarWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <BackgroundImage useProfiledBackground={false} />
      <Image
        style={styles.logo}
        source={require("../../assets/images/WorldSprings_logo_1.png")}
        resizeMode="contain"
      />
      <View>
        <WordSpringsText
          style={{ fontFamily: "Pacifico", fontSize: 38, paddingTop: 20 }}
        >
          WORD SPRINGS
        </WordSpringsText>
      </View>

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
    backgroundColor: "#6757F7", // Your desired background color
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
  // --- STYLES FOR THE LOADING BAR ---
  loadingBarContainer: {
    width: "60%", // The bar will be 60% of the screen width
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)", // A semi-transparent white track
    borderRadius: 4,
    marginTop: 30, // Space below the "WORDSPRINGS" text
  },
  loadingBarFill: {
    height: "100%",
    backgroundColor: "#FFFFFF", // Solid white for the fill
    borderRadius: 4,
  },
});
