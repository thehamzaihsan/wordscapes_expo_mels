import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";

import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";

// Native driver is not supported on react-native-web
const USE_NATIVE_DRIVER = Platform.OS !== "web";

const CONFETTI_COLORS = [
  "#FDE047", // yellow
  "#F97316", // orange
  "#22C55E", // green
  "#3B82F6", // blue
  "#EC4899", // pink
  "#A78BFA", // violet
  "#F43F5E", // rose
  "#34D399", // emerald
];

const CONFETTI_COUNT = 28;

type ConfettiParticle = {
  id: number;
  progress: Animated.Value;
  color: string;
  size: number;
  isRound: boolean;
  dx: number;
  peakY: number;
  endY: number;
  rotation: number;
  duration: number;
  delay: number;
};

function createParticles(): ConfettiParticle[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const angleBias = (i / CONFETTI_COUNT) * 2 - 1; // spread across -1..1
    return {
      id: i,
      progress: new Animated.Value(0),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 7,
      isRound: Math.random() < 0.4,
      dx: angleBias * 170 + (Math.random() - 0.5) * 60,
      peakY: -(70 + Math.random() * 130),
      endY: 140 + Math.random() * 140,
      rotation: (Math.random() - 0.5) * 1080,
      duration: 950 + Math.random() * 500,
      delay: Math.random() * 200,
    };
  });
}

interface LevelCompleteCelebrationProps {
  title?: string;
  score: number;
  buttonLabel: string;
  /** Called after the exit animation finishes. */
  onNext: () => void;
  animationsEnabled?: boolean;
  /** Optional extra content rendered at the top of the card (e.g. a Lottie). */
  children?: React.ReactNode;
}

/**
 * Rewarding level-complete overlay: dark backdrop fade, confetti burst,
 * springy card entrance with staggered rows, an animated score count-up,
 * and a smooth exit before advancing to the next level.
 *
 * Implemented with the core RN Animated API only, so it works on
 * react-native-web (useNativeDriver is disabled on web).
 */
export default function LevelCompleteCelebration({
  title = "Level Complete!",
  score,
  buttonLabel,
  onNext,
  animationsEnabled = true,
  children,
}: LevelCompleteCelebrationProps) {
  const overlayOpacity = useRef(new Animated.Value(animationsEnabled ? 0 : 1)).current;
  const cardScale = useRef(new Animated.Value(animationsEnabled ? 0.7 : 1)).current;
  const cardOpacity = useRef(new Animated.Value(animationsEnabled ? 0 : 1)).current;
  // Staggered rows: 0 = title, 1 = score, 2 = button
  const rowAnims = useRef(
    [0, 1, 2].map(() => new Animated.Value(animationsEnabled ? 0 : 1))
  ).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;

  const [displayScore, setDisplayScore] = useState(animationsEnabled ? 0 : score);
  const exitingRef = useRef(false);

  const particles = useMemo(
    () => (animationsEnabled ? createParticles() : []),
    [animationsEnabled]
  );

  // Entrance choreography (runs once on mount — the component is only
  // mounted while the level-complete modal is visible).
  useEffect(() => {
    if (!animationsEnabled) {
      setDisplayScore(score);
      return;
    }

    // Backdrop + card pop in together
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();

    // Rows slide/fade in one after another
    Animated.stagger(
      100,
      rowAnims.map((v) =>
        Animated.spring(v, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: USE_NATIVE_DRIVER,
        })
      )
    ).start();

    // Confetti burst
    Animated.parallel(
      particles.map((p) =>
        Animated.timing(p.progress, {
          toValue: 1,
          duration: p.duration,
          delay: p.delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        })
      )
    ).start();

    // Score count-up (listener-driven so it works without native driver)
    const listenerId = scoreAnim.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });
    Animated.timing(scoreAnim, {
      toValue: score,
      duration: 900,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // drives state via listener
    }).start(() => setDisplayScore(score));

    return () => {
      scoreAnim.removeListener(listenerId);
    };
    // Intentionally mount-only: values are captured when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exit: shrink + fade the card while the dark backdrop stays up, so the
  // next level fades in from the dark instead of the old grid flashing back.
  const handleNext = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;

    if (!animationsEnabled) {
      onNext();
      return;
    }

    Animated.parallel([
      Animated.timing(cardScale, {
        toValue: 0.9,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start(() => {
      onNext();
    });
  }, [animationsEnabled, cardOpacity, cardScale, onNext]);

  const rowStyle = (index: number) => ({
    opacity: rowAnims[index],
    transform: [
      {
        translateY: rowAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      {/* Confetti burst layer */}
      {particles.length > 0 && (
        <View style={styles.confettiLayer} pointerEvents="none">
          {particles.map((p) => (
            <Animated.View
              key={p.id}
              style={{
                position: "absolute",
                left: "50%",
                top: "38%",
                width: p.size,
                height: p.isRound ? p.size : p.size * 1.6,
                borderRadius: p.isRound ? p.size / 2 : 2,
                backgroundColor: p.color,
                opacity: p.progress.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [1, 1, 0],
                }),
                transform: [
                  {
                    translateX: p.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, p.dx],
                    }),
                  },
                  {
                    translateY: p.progress.interpolate({
                      inputRange: [0, 0.45, 1],
                      outputRange: [0, p.peakY, p.endY],
                    }),
                  },
                  {
                    rotate: p.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", `${p.rotation}deg`],
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>
      )}

      <Animated.View
        style={[
          styles.cardWrapper,
          { opacity: cardOpacity, transform: [{ scale: cardScale }] },
        ]}
      >
        <ThemedCard style={styles.card} padding="lg">
          {children}
          <Animated.View style={rowStyle(0)}>
            <ThemedText variant="heading2" style={styles.title}>
              {title}
            </ThemedText>
          </Animated.View>
          <Animated.View style={rowStyle(1)}>
            <ThemedText variant="body1" style={styles.score}>
              Score: {displayScore}
            </ThemedText>
          </Animated.View>
          <Animated.View style={[rowStyle(2), styles.buttonRow]}>
            <ThemedButton
              variant="primary"
              title={buttonLabel}
              style={styles.button}
              onPress={handleNext}
            />
          </Animated.View>
        </ThemedCard>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  cardWrapper: {
    width: "80%",
    maxWidth: 420,
    alignItems: "stretch",
  },
  card: {
    borderRadius: 16,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  score: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  buttonRow: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  button: {
    marginTop: 4,
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
