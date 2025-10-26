// BackgroundSelectionScreen.tsx
import backgroundsData from "@/constants/backgrounds.json";
import { loadGuestProgress } from "@/hooks/guest-progress";
import { useTheme } from "@/hooks/useTheme";
import { useBackgroundSelection } from "@/contexts/BackgroundContext";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { CheckCircle2, ChevronLeft, Lock, Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";

// === Import images at top (web-safe)
import defaultImg from "../../images/default_background.jpg";
import forestImg from "../../images/forest.png";
import mountainImg from "../../images/mountain.jpg";
import oceanImg from "../../images/ocean.jpg";

const { backgrounds } = backgroundsData;

const IMAGES: Record<string, any> = {
  "mountain.jpg": mountainImg,
  "ocean.jpg": oceanImg,
  "forest.png": forestImg,
  default: defaultImg,
};

const getBackgroundImage = (imageName: string) => {
  return IMAGES[imageName] ?? IMAGES["default"];
};

const getResponsiveValues = (w: number, h: number, platformIsWeb: boolean) => {
  const isSmall = h < 700;
  const isTablet = w >= 768;
  const padding = isSmall ? 12 : 20;
  const cardSpacing = isSmall ? 10 : 16;
  // On web we want a max width but it should shrink on small web viewports (mobile web)
  const containerWidthNumber = platformIsWeb
    ? Math.min(1100, Math.max(320, w))
    : w;
  const containerWidthStyle = platformIsWeb ? containerWidthNumber : "100%";
  const numColumns =
    isTablet || (platformIsWeb && containerWidthNumber >= 768) ? 3 : 2;
  const cardWidth =
    (containerWidthNumber - padding * 2 - cardSpacing * (numColumns - 1)) /
    numColumns;
  const cardHeight = isSmall ? 200 : 260;
  return {
    padding,
    cardSpacing,
    numColumns,
    cardWidth,
    cardHeight,
    containerWidthNumber,
    containerWidthStyle,
    isSmall,
  };
};

// Only use native driver on native platforms — web falls back
const SUPPORTS_NATIVE_DRIVER = Platform.OS !== "web";

type BgItem = (typeof backgrounds)[0];

// Background card component
const BackgroundCard = React.memo(
  ({
    item,
    isUnlocked,
    isSelected,
    fadeAnim,
    scaleAnim,
    onSelect,
    styles,
    isWeb,
  }: {
    item: BgItem;
    isUnlocked: boolean;
    isSelected: boolean;
    fadeAnim: Animated.Value;
    scaleAnim: Animated.Value;
    onSelect: (category: string) => void;
    styles: any;
    isWeb: boolean;
  }) => {
    const [cardScale] = useState(new Animated.Value(1));

    const handlePressIn = () => {
      Animated.spring(cardScale, {
        toValue: 0.97,
        useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      }).start();
    };
    const handlePressOut = () => {
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { scale: cardScale }],
          },
        ]}
      >
        <Pressable
          onPress={() => isUnlocked && onSelect(item.category)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!isUnlocked}
          android_ripple={{ color: "#00000012" }}
          style={({ pressed }) => [{ opacity: pressed ? 0.98 : 1 }]}
        >
          <View
            style={[
              styles.backgroundCard,
              isSelected && styles.selectedCard,
              !isUnlocked && styles.lockedCard,
            ]}
          >
            {/* background image (expo-image) */}
            <Image
              source={getBackgroundImage(item.image)}
              style={styles.backgroundImage}
              contentFit="cover"
              priority="high"
            />

            {/* gradient overlay */}
            <View style={styles.gradientOverlay} />

            {/* selection badge */}
            {isSelected && (
              <View style={styles.selectionBadge}>
                <CheckCircle2 size={20} color="#fff" fill="#fff" />
              </View>
            )}

            {/* lock overlay or blur fallback */}
            {!isUnlocked &&
              (isWeb ? (
                // web fallback: semi transparent center overlay
                <View style={styles.lockOverlay}>
                  <View style={styles.lockContent}>
                    <Lock size={28} color="#fff" />
                    <ThemedText
                      variant="body2"
                      weight="bold"
                      style={styles.lockText}
                    >
                      {item.xpNeeded.toLocaleString()} XP
                    </ThemedText>
                    <ThemedText variant="caption" style={styles.lockSubtext}>
                      Keep playing to unlock
                    </ThemedText>
                  </View>
                </View>
              ) : (
                // native: BlurView
                <BlurView intensity={30} style={styles.lockOverlay}>
                  <View style={styles.lockContent}>
                    <Lock size={28} color="#fff" />
                    <ThemedText
                      variant="body2"
                      weight="bold"
                      style={styles.lockText}
                    >
                      {item.xpNeeded.toLocaleString()} XP
                    </ThemedText>
                    <ThemedText variant="caption" style={styles.lockSubtext}>
                      Keep playing to unlock
                    </ThemedText>
                  </View>
                </BlurView>
              ))}

            {/* card content */}
            <View style={styles.cardContent}>
              <View style={styles.nameRow}>
                <ThemedText
                  variant="heading3"
                  weight="bold"
                  style={styles.categoryName}
                >
                  {item.name}
                </ThemedText>
                {item.xpNeeded === 0 && (
                  <View style={styles.freeBadge}>
                    <Star size={12} color="#FFD700" fill="#FFD700" />
                    <ThemedText
                      variant="caption"
                      weight="bold"
                      style={styles.freeText}
                    >
                      FREE
                    </ThemedText>
                  </View>
                )}
              </View>

              {isUnlocked && !isSelected && (
                <View style={styles.unlockedIndicator}>
                  <ThemedText
                    variant="caption"
                    weight="bold"
                    style={styles.unlockedText}
                  >
                    Tap to select
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

// Provide a displayName for better devtools / lint warnings
// Assign displayName at runtime (harmless) — no need to surface types here
(BackgroundCard as any).displayName = "BackgroundCard";

export default function BackgroundSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const responsive = getResponsiveValues(width, height, isWeb);
  const styles = createStyles(theme, responsive);
  const [userXp, setUserXp] = useState(0);
  const { selectedBackground, saveBackground } = useBackgroundSelection();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.96));

  useEffect(() => {
    (async () => {
      try {
        const progress = await loadGuestProgress();
        if (progress?.meta?.xp != null) setUserXp(progress.meta.xp);
      } catch {
        // ignore
      }
    })();

    // entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const handleSelectBackground = async (category: string) => {
    const bg = backgrounds.find((b) => b.category === category);
    if (bg && userXp >= bg.xpNeeded) {
      console.log(`[BackgroundSelection] Selecting background: ${category}`);
      await saveBackground(category as any); // Save using the hook
      console.log(`[BackgroundSelection] Successfully saved background: ${category}`);
    } else {
      console.log(`[BackgroundSelection] Cannot select ${category} - insufficient XP (${userXp} < ${bg?.xpNeeded})`);
    }
  };

  const renderItem = ({ item }: { item: BgItem }) => {
    const isUnlocked = userXp >= item.xpNeeded;
    const isSelected = selectedBackground === item.category;
    return (
      <BackgroundCard
        item={item}
        isUnlocked={isUnlocked}
        isSelected={isSelected}
        fadeAnim={fadeAnim}
        scaleAnim={scaleAnim}
        onSelect={handleSelectBackground}
        styles={styles}
        isWeb={isWeb}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedButton
          title="Back"
          variant="glass"
          size="sm"
          leftIcon={<ChevronLeft size={20} color={theme.colors.text} />}
          onPress={() => router.push("/levels")}
          style={styles.backButton}
        />
        <ThemedCard variant="glassStrong">
          <View style={styles.headerContent}>
            <ThemedText variant="heading1" weight="bold" style={styles.title}>
              Wallpapers
            </ThemedText>
            <ThemedText variant="body2" style={styles.subtitle}>
              Personalize your game experience
            </ThemedText>
          </View>
        </ThemedCard>
      </View>

      <FlatList
        data={backgrounds}
        renderItem={renderItem}
        keyExtractor={(i) => i.category}
        numColumns={responsive.numColumns}
        // When numColumns changes (e.g. on resize / mobile web) we must force a remount
        // because React Native's FlatList does not support changing numColumns on the fly.
        key={`bg-grid-cols-${responsive.numColumns}`}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={responsive.numColumns > 1 ? styles.row : undefined}
      />
    </View>
  );
}

const createStyles = (theme: any, responsive: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: responsive.padding,
    },
    header: {
      width: "100%",
      marginVertical: 16,
    },
    backButton: { alignSelf: "flex-start", marginBottom: 8 },
    headerContent: { alignItems: "center", padding: 8 },
    title: { textAlign: "center", fontSize: responsive.isSmall ? 22 : 30 },
    subtitle: {
      textAlign: "center",
      opacity: 0.75,
      fontSize: responsive.isSmall ? 13 : 15,
    },
    gridContainer: {
      width: responsive.maxContainerWidth,
      alignSelf: "center",
      paddingHorizontal: responsive.padding,
      paddingBottom: 60,
      gap: responsive.cardSpacing,
    },
    row: { justifyContent: "space-between", gap: responsive.cardSpacing },

    cardContainer: {
      width: responsive.cardWidth,
      marginBottom: responsive.cardSpacing,
      borderRadius: 14,
      overflow: "hidden",
    },
    backgroundCard: {
      borderRadius: 14,
      overflow: "hidden",
      minHeight: responsive.cardHeight,
      backgroundColor: "#111",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    selectedCard: {
      borderWidth: 2,
      borderColor: theme.colors.success,
      shadowColor: theme.colors.success,
      shadowOpacity: 0.22,
    },
    lockedCard: { opacity: 0.85 },

    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      height: responsive.cardHeight,
      width: "100%",
      zIndex: 0,
    },
    gradientOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.28)",
      zIndex: 1,
    },
    selectionBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 34,
      height: 34,
      borderRadius: 18,
      backgroundColor: theme.colors?.success || "rgba(34,197,94,0.92)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 3,
    },

    lockOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 4,
      justifyContent: "center",
      alignItems: "center",
    },
    lockContent: {
      alignItems: "center",
      padding: 12,
      backgroundColor:
        Platform.OS === "web" ? "rgba(0,0,0,0.45)" : "transparent",
      borderRadius: 8,
    },
    lockText: { color: "#fff", textAlign: "center", marginTop: 8 },
    lockSubtext: { color: "#fff", opacity: 0.9, marginTop: 4, fontSize: 12 },

    cardContent: {
      zIndex: 5,
      padding: 12,
      height: responsive.cardHeight,
      justifyContent: "flex-end",
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    categoryName: {
      color: "#fff",
      textShadowColor: "rgba(0,0,0,0.6)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    freeBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,215,0,0.95)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    freeText: { color: "#1A1A1A", fontSize: 10, marginLeft: 6 },
    unlockedIndicator: {
      backgroundColor: theme.colors?.success || "rgba(34,197,94,0.92)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: "flex-start",
      marginTop: 6,
    },
    unlockedText: { color: "#fff", fontSize: 12 },
  });
