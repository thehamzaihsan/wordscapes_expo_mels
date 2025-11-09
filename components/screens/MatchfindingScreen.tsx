import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
import WordSpringsText from "@/components/common/WordSpringsText";
import ThemedButton from "@/components/ui/ThemedButton";
import Card from "@/components/ui/ThemedCard";
import ThemedText from "@/components/ui/ThemedText";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
// <--- Import React, useState, and useEffect
import { useEffect, useState } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// <--- CLEANED EMOJI LIST (removed bad characters) ---
const avatarEmojis = [
  "🛡️", "🐺", "🦊", "🦅", "🐉", "⚡", "🔥", "🌙", "⭐", "🧠", "🎯",
];

// <--- CLEANED TEXT LIST (removed bad characters) ---
const findingText = [
  "Seeking a Worthy Foe...",
  "Scanning the Arena...",
  "Searching for a Rival...",
  "Get Ready!",
  "Preparing for Battle!",
];

export default function MatchfindingScreenComponent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();

  // --- State for emoji animation ---
  const [emojiIndex, setEmojiIndex] = useState(0);
  const [vsTextIndex, setVsTextIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // --- Effect for emoji animation ---
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setEmojiIndex((prevIndex) => (prevIndex + 1) % avatarEmojis.length);
    }, 200); // Runs every 200ms
    return () => clearInterval(animationInterval);
  }, []);

  // --- Effect for "VS" text animation ---
  useEffect(() => {
    const vsInterval = setInterval(() => {
      setVsTextIndex((prevIndex) => (prevIndex + 1) % findingText.length);
    }, 1000); 
    return () => clearInterval(vsInterval);
  }, []);

  // --- Effect for 3-second navigation to MultiplayerGameScreen ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigating(true);
      router.replace('/multiplayer-game');
    }, 3000); // 3 seconds

    return () => clearTimeout(timer); // Cleanup the timeout
  }, [router]);

  // --- NEW: Responsive logic ---
  const minDimension = Math.min(width, height);
  const isWebOrTablet =
    (Platform.OS as string) === "web" ||
    (Platform.OS !== "web" && minDimension >= 600); // 600px is a good breakpoint

  // Define separate widths
  const webContentWidth = 380;    // Fixed width for web/tablet
  const mobileMaxContentWidth = 380; // Max width for mobile

  // This is the max width for the container
  const maxContentWidth = isWebOrTablet ? webContentWidth : mobileMaxContentWidth;

  // This is the width we use for calculating font/element sizes
  const calculationWidth = isWebOrTablet
    ? webContentWidth // On web, use the fixed width
    : Math.min(minDimension, mobileMaxContentWidth); // On mobile, be responsive *up to* the max
  // --- End of new logic ---

  const createStyles = (currentTheme: any) => {
    // All sizes are now based on our new `calculationWidth`
    const avatarSize = calculationWidth * 0.4;
    const avatarFontSize = avatarSize * 0.4;
    const playerNameFontSize = calculationWidth * 0.085;
    const findingTextFontSize = calculationWidth * 0.09;

    return StyleSheet.create({
      container: {
        flex: 1,
      },
      safeArea: {
        flex: 1,
        paddingHorizontal: currentTheme.spacing.lg,
        width: "100%",
        // This now applies the correct max width (380 on mobile, 500 on web)
        maxWidth: maxContentWidth,
        alignSelf: "center",
      },
      header: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginBottom: currentTheme.spacing.lg,
        marginLeft: 10,
      },
      content: {
        flex: 1,
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: currentTheme.spacing.xl6,
        backgroundColor: "transparent",
        width: "100%",
      },
      playerContainer: {
        alignItems: "center",
        backgroundColor: "transparent",
        width: "100%",
      },
      avatarContainer: {
        width: avatarSize,
        height: avatarSize,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: currentTheme.spacing.md,
      },
      avatarText: {
        fontSize: avatarFontSize,
        lineHeight: avatarFontSize * 1.3,
        fontWeight: currentTheme.typography.fontWeights.bold,
        color: currentTheme.colors.text,
      },
      playerName: {
        fontSize: playerNameFontSize,
        color: "white",
      },
      findingText: {
        fontSize: findingTextFontSize,
        lineHeight: findingTextFontSize * 1.9, // <--- FIXED (was 5)
        color: "orange",
        marginVertical: calculationWidth * 0.06,
        textAlign: "center",
      },
    });
  };

  // <--- UPDATED dependencies
  const styles = useThemedStyles(createStyles);

  const handleBack = () => {
    setIsNavigating(true);
    router.back();
  };

  if (isNavigating) {
    return <LoadingScreen />;
  }


  return (
    <View style={styles.container}>
      <BackgroundImage />
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <View style={styles.header}>
          <ThemedButton
            title="Back"
            variant="glass"
            size="sm"
            leftIcon={<ChevronLeft size={20} color={theme.colors.text} />}
            onPress={handleBack}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.playerContainer}>
            <Card
              variant="glassStrong"
              padding="none"
              style={styles.avatarContainer}
            >
              <ThemedText style={styles.avatarText}>{avatarEmojis[3]}</ThemedText>
            </Card>
            <WordSpringsText style={styles.playerName}>
              Player 1
            </WordSpringsText>
          </View>

          <WordSpringsText style={styles.findingText}>
            {findingText[vsTextIndex]}
          </WordSpringsText>

          <View style={styles.playerContainer}>
            <Card
              variant="glassStrong"
              padding="none"
              style={styles.avatarContainer}
            >
              <ThemedText style={styles.avatarText}>{avatarEmojis[emojiIndex]}</ThemedText>
            </Card>
            <WordSpringsText style={styles.playerName}>
              .....
            </WordSpringsText>
          </View>
        </View>
      </View>
    </View>
  );
}