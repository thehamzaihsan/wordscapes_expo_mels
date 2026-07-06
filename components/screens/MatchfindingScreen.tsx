import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
import BrandText from "@/components/common/BrandText";
import Card from "@/components/ui/ThemedCard";
import ThemedText from "@/components/ui/ThemedText";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { ArrowLeft, Swords, Zap } from "lucide-react-native";
import { useEffect, useState } from "react";
import { 
  Platform, 
  StyleSheet, 
  useWindowDimensions, 
  View, 
  Animated,
  TouchableOpacity 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

// <--- CLEANED EMOJI LIST (removed bad characters) ---
const avatarEmojis = [
  "🛡️",
  "🐺",
  "🦊",
  "🦅",
  "🐉",
  "⚡",
  "🔥",
  "🌙",
  "⭐",
  "🧠",
  "🎯",
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
  const { theme, themeName } = useTheme();
  const { width, height } = useWindowDimensions();
  const { session, loading: authLoading } = useSupabaseAuth();

  const { waiting, range, matchId, error } = useMatchmaking({
    userId: session?.user?.id ?? null,
  });

  const [emojiIndex, setEmojiIndex] = useState(0);
  const [vsTextIndex, setVsTextIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Animation values
  const pulseAnim = useState(() => new Animated.Value(1))[0];
  const scaleAnim = useState(() => new Animated.Value(0.95))[0];
  const opacityAnim = useState(() => new Animated.Value(0))[0];
  const rotateAnim = useState(() => new Animated.Value(0))[0];

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session?.user?.id) {
      router.replace("/multiplayer-hub");
    }
  }, [authLoading, session, router]);

  // Pulse animation for avatars
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Scale animation for cards
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fade in animation
  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Rotate animation for VS icon
  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    rotate.start();
    return () => rotate.stop();
  }, []);

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

  // Navigate to game when a match is found
  useEffect(() => {
    if (matchId) {
      setIsNavigating(true);
      router.replace({
        pathname: "/multiplayer-game",
        params: { match: matchId },
      });
    }
  }, [matchId, router]);

  // --- NEW: Responsive logic ---
  const minDimension = Math.min(width, height);
  const isWebOrTablet =
    (Platform.OS as string) === "web" ||
    (Platform.OS !== "web" && minDimension >= 600); // 600px is a good breakpoint

  // Define separate widths
  const webContentWidth = 380; // Fixed width for web/tablet
  const mobileMaxContentWidth = 380; // Max width for mobile

  // This is the max width for the container
  const maxContentWidth = isWebOrTablet
    ? webContentWidth
    : mobileMaxContentWidth;

  // This is the width we use for calculating font/element sizes
  const calculationWidth = isWebOrTablet
    ? webContentWidth // On web, use the fixed width
    : Math.min(minDimension, mobileMaxContentWidth); // On mobile, be responsive *up to* the max
  // --- End of new logic ---

  const createStyles = (currentTheme: any) => {
    const avatarSize = calculationWidth * 0.35;
    const avatarFontSize = avatarSize * 0.5;
    const playerNameFontSize = calculationWidth * 0.06;
    const findingTextFontSize = calculationWidth * 0.07;

    return StyleSheet.create({
      container: {
        flex: 1,
      },
      safeArea: {
        flex: 1,
        paddingHorizontal: currentTheme.spacing.lg,
        width: "100%",
        maxWidth: maxContentWidth,
        alignSelf: "center",
      },
      header: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginBottom: currentTheme.spacing.xl,
        paddingTop: currentTheme.spacing.md,
      },
      backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: currentTheme.colors.surfaceVariant + '40',
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(10px)",
      },
      content: {
        flex: 1,
        justifyContent: "space-evenly",
        alignItems: "center",
        paddingBottom: currentTheme.spacing.xl4,
        backgroundColor: "transparent",
        width: "100%",
      },
      playerContainer: {
        alignItems: "center",
        backgroundColor: "transparent",
        width: "100%",
        gap: currentTheme.spacing.md,
      },
      avatarContainer: {
        width: avatarSize,
        height: avatarSize,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      },
      avatarGradient: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      },
      avatarText: {
        fontSize: avatarFontSize,
        textAlign: "center",
      },
      playerName: {
        fontSize: playerNameFontSize,
        color: "white",
        fontWeight: "600",
      },
      vsContainer: {
        alignItems: "center",
        gap: currentTheme.spacing.md,
        paddingVertical: currentTheme.spacing.xl,
      },
      vsIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: currentTheme.colors.primary + '20',
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: currentTheme.colors.primary + '40',
      },
      findingTextContainer: {
        alignItems: "center",
        gap: currentTheme.spacing.sm,
        paddingHorizontal: currentTheme.spacing.lg,
      },
      findingText: {
        fontSize: findingTextFontSize,
        color: currentTheme.colors.primary,
        textAlign: "center",
        fontWeight: "700",
      },
      rangeText: {
        fontSize: findingTextFontSize * 0.7,
        color: currentTheme.colors.textSecondary,
        textAlign: "center",
      },
      statusBadge: {
        paddingHorizontal: currentTheme.spacing.lg,
        paddingVertical: currentTheme.spacing.sm,
        borderRadius: currentTheme.borderRadius.full,
        marginTop: currentTheme.spacing.md,
      },
      statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "white",
      },
      loadingDots: {
        flexDirection: "row",
        gap: currentTheme.spacing.xs,
        marginTop: currentTheme.spacing.sm,
      },
      dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: currentTheme.colors.primary,
      },
    });
  };

  // <--- UPDATED dependencies
  const styles = useThemedStyles(createStyles);

  const handleBack = () => {
    setIsNavigating(true);
    router.push("/multiplayer-hub");
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Show loading while checking auth or if no session (will redirect)
  if (authLoading || !session?.user?.id || isNavigating) {
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
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Animated.View 
          style={[
            styles.content,
            { opacity: opacityAnim }
          ]}
        >
          {/* Player 1 (You) */}
          <Animated.View 
            style={[
              styles.playerContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Card
                variant="glassStrong"
                padding="none"
                style={styles.avatarContainer}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primary + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradient}
                >
                  <ThemedText style={styles.avatarText}>
                    {avatarEmojis[3]}
                  </ThemedText>
                </LinearGradient>
              </Card>
            </Animated.View>
            <BrandText style={styles.playerName}>You</BrandText>
            <Card variant="glassStrong" padding="sm" style={styles.statusBadge}>
              <ThemedText style={[styles.statusText, { color: themeName === 'light' ? 'black' : 'white' }]}>
                Ready
              </ThemedText>
            </Card>
          </Animated.View>

          {/* VS Section */}
          <View style={styles.vsContainer}>
            <Animated.View 
              style={[
                styles.vsIconContainer,
                { transform: [{ rotate: spin }] }
              ]}
            >
              <Swords size={40} color={theme.colors.primary} />
            </Animated.View>
            
            <View style={styles.findingTextContainer}>
              <BrandText style={styles.findingText}>
                {error ? error : findingText[vsTextIndex]}
              </BrandText>
              {waiting && !error && (
                <ThemedText style={[styles.rangeText, { color: 'white' }]}>
                  Range: ±{range}
                </ThemedText>
              )}
              
              {/* Loading dots animation */}
              {waiting && !error && (
                <View style={styles.loadingDots}>
                  {[0, 1, 2].map((i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          opacity: pulseAnim.interpolate({
                            inputRange: [1, 1.1],
                            outputRange: [0.3, 1],
                          }),
                          transform: [{
                            translateY: pulseAnim.interpolate({
                              inputRange: [1, 1.1],
                              outputRange: [0, -5],
                            })
                          }]
                        }
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Player 2 (Opponent) */}
          <Animated.View 
            style={[
              styles.playerContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Card
                variant="glassStrong"
                padding="none"
                style={styles.avatarContainer}
              >
                <LinearGradient
                  colors={[theme.colors.warning, theme.colors.warning + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradient}
                >
                  <ThemedText style={styles.avatarText}>
                    {avatarEmojis[emojiIndex]}
                  </ThemedText>
                </LinearGradient>
              </Card>
            </Animated.View>
            <BrandText style={styles.playerName}>
              {waiting ? "Searching..." : "Opponent"}
            </BrandText>
            {waiting && (
              <Card variant="glassStrong" padding="sm" style={styles.statusBadge}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Zap size={14} color={themeName === 'light' ? 'black' : 'white'} />
                  <ThemedText style={[styles.statusText, { color: themeName === 'light' ? 'black' : 'white' }]}>
                    Searching
                  </ThemedText>
                </View>
              </Card>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}
