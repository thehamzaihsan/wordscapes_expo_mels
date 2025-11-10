import { Shuffle } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
interface LetterWheelProps {
  letters?: string[];
  onWordComplete?: (word: string) => void;
  onLetterSelect?: (letter: string, index: number) => void;
  validWords?: string[];
  foundWords?: string[]; // Words already found
  crosswordWords?: string[];
  onNavigate?: (screen: string) => void; // Navigation function
}

interface LetterPosition {
  x: number;
  y: number;
  letter: string;
  index: number;
}

interface AnimatedLetter {
  letter: string;
  opacity: Animated.Value;
  scale: Animated.Value;
  index: number;
}

const { width, height } = Dimensions.get("window");

// Responsive values based on screen height
const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 900;
// const isLargeScreen = height >= 900; // not used

const LetterWheel: React.FC<LetterWheelProps> = ({
  letters = [],
  onWordComplete,
  onLetterSelect,
  validWords = [],
  foundWords = [],
  crosswordWords = [],
  onNavigate,
}) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [connectionPath, setConnectionPath] = useState<string>("");
  const [currentWord, setCurrentWord] = useState<string>("");
  const [shuffledLetters, setShuffledLetters] = useState<string[]>([]);
  const [animatedLetters, setAnimatedLetters] = useState<AnimatedLetter[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const letterPositions = useRef<LetterPosition[]>([]);
  const [submissionTimer, setSubmissionTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // --- REFINED DYNAMIC SIZING WITH RESPONSIVE VALUES ---
  const hexagonSize = isSmallScreen ? 28 : isMediumScreen ? 32 : 35;
  // Increased padding to create more space, especially for more letters
  const hexagonPadding = isSmallScreen ? 18 : isMediumScreen ? 22 : 25;
  // A reasonable minimum radius for a small number of letters
  const minRadius = isSmallScreen ? 60 : isMediumScreen ? 70 : 75;

  // Calculate radius based on the circumference needed for the letters
  const radius = useMemo(() => {
    const numLetters = shuffledLetters.length;
    if (numLetters === 0) {
      return minRadius;
    }

    // Calculate the total space needed for one letter (its diameter + padding)
    const spacePerLetter = hexagonSize * 2 + hexagonPadding;

    // Determine the total circumference required to fit all letters without them touching
    const requiredCircumference = numLetters * spacePerLetter;

    // Convert the circumference to the radius needed (C = 2 * PI * r)
    const radiusFromCircumference = requiredCircumference / (2 * Math.PI);

    // Use the calculated radius, but ensure it doesn't shrink below the minimum
    return Math.max(minRadius, radiusFromCircumference);
  }, [shuffledLetters.length, hexagonSize, hexagonPadding, minRadius]);

  // Calculate the total wheel size based on the dynamic radius
  const wheelSize = useMemo(() => {
    // Diameter is (radius + hexagon size) * 2, plus some overall padding for the container
    const baseSize = (radius + hexagonSize) * 2 + 20;
    // Ensure it doesn't exceed screen dimensions, leave some margin
    const maxSize = Math.min(width * 0.9, height * 0.4);
    return Math.min(baseSize, maxSize);
  }, [radius, hexagonSize]);

  const wheelCenter = wheelSize / 2;

  // Create hexagon path as SVG path (more reliable on web)
  const createHexagonSVGPath = (
    centerX: number,
    centerY: number,
    size: number
  ): string => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);
      points.push({ x, y });
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    path += " Z"; // Close the path
    return path;
  };

  const resetSelection = useCallback((): void => {
    setSelectedLetters([]);
    setSelectedIndices([]);
    setConnectionPath("");
    setCurrentWord("");
  }, []);

  useEffect(() => {
    setShuffledLetters([...letters]);
    // Initialize animated letters
    const newAnimatedLetters = letters.map((letter, index) => ({
      letter,
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
      index,
    }));
    setAnimatedLetters(newAnimatedLetters);
  }, [letters]);

  useEffect(() => {
    if (shuffledLetters.length === 0) {
      return;
    }
    // Calculate letter positions in a circle
    letterPositions.current = shuffledLetters.map((letter, index) => {
      const angle =
        (index * 2 * Math.PI) / shuffledLetters.length - Math.PI / 2;
      const x = Math.cos(angle) * radius + wheelCenter;
      const y = Math.sin(angle) * radius + wheelCenter;
      return { x, y, letter, index };
    });
  }, [shuffledLetters, wheelSize, radius, wheelCenter]);

  useEffect(() => {
    // Clear any existing timer when a new letter is selected
    if (submissionTimer) {
      clearTimeout(submissionTimer);
    }

    // Only set a new timer if there's a word of at least 2 letters
    if (currentWord.length >= 2) {
      const newTimer = setTimeout(() => {
        // When the timer runs out, submit the word regardless of correctness
        if (onWordComplete) {
          onWordComplete(currentWord.toLowerCase());
        }
        // Reset the wheel for the next word
        // A small delay gives visual feedback before clearing
        setTimeout(() => resetSelection(), 100);
      }, 600); // 1-second delay before submission. You can adjust this value.

      setSubmissionTimer(newTimer);
    }

    // Cleanup function to clear the timer if the component unmounts
    return () => {
      if (submissionTimer) {
        clearTimeout(submissionTimer);
      }
    };
  }, [currentWord, onWordComplete, resetSelection]);

  const updateConnectionPath = useCallback((indices: number[]): void => {
    if (indices.length === 0) {
      setConnectionPath("");
      return;
    }

    if (shuffledLetters.length === 0) return;

    // Calculate the actual center positions of the hexagons
    const positions = indices.map((idx) => {
      const angle = (idx * 2 * Math.PI) / shuffledLetters.length - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      // Return the center of the hexagon (same as rendering logic)
      return {
        x: wheelCenter + x,
        y: wheelCenter + y,
      };
    });

    if (positions.length === 0) return;

    let path = `M ${positions[0].x} ${positions[0].y}`;
    for (let i = 1; i < positions.length; i++) {
      path += ` L ${positions[i].x} ${positions[i].y}`;
    }
    setConnectionPath(path);
  }, [shuffledLetters.length, radius, wheelCenter]);

  const handleLetterPress = useCallback(
    (letter: string, index: number): void => {
      const isAlreadySelected = selectedIndices.includes(index);

      let newIndices: number[];
      if (isAlreadySelected) {
        // Unselect the letter by filtering it out
        newIndices = selectedIndices.filter((i) => i !== index);
      } else {
        // Add the new letter to the end
        newIndices = [...selectedIndices, index];
      }

      // Rebuild the word from the new indices to maintain correct order
      const newLetters = newIndices.map((i) => shuffledLetters[i]);

      setSelectedIndices(newIndices);
      setSelectedLetters(newLetters);
      setCurrentWord(newLetters.join(""));
      updateConnectionPath(newIndices);

      if (!isAlreadySelected) {
        onLetterSelect?.(letter, index);
      }
    },
    [selectedIndices, onLetterSelect, updateConnectionPath, shuffledLetters]
  );

  const shuffleLetters = useCallback((): void => {
    if (isShuffling) return;

    setIsShuffling(true);
    resetSelection();

    // Animate letters disappearing
    const fadeOutAnimations = animatedLetters.map((animLetter) =>
      Animated.parallel([
        Animated.timing(animLetter.opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animLetter.scale, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    );

    // Run all fade out animations
    Animated.parallel(fadeOutAnimations).start(() => {
      // Shuffle the letters array
      const lettersToShuffle = [...letters];
      for (let i = lettersToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lettersToShuffle[i], lettersToShuffle[j]] = [
          lettersToShuffle[j],
          lettersToShuffle[i],
        ];
      }

      setShuffledLetters(lettersToShuffle);

      // Update animated letters with new order
      const newAnimatedLetters = lettersToShuffle.map((letter, index) => ({
        letter,
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.3),
        index,
      }));
      setAnimatedLetters(newAnimatedLetters);

      // Animate letters appearing with delay
      const fadeInAnimations = newAnimatedLetters.map((animLetter, index) =>
        Animated.sequence([
          Animated.delay(index * 100), // Staggered delay
          Animated.parallel([
            Animated.timing(animLetter.opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(animLetter.scale, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      Animated.parallel(fadeInAnimations).start(() => {
        setIsShuffling(false);
      });
    });
  }, [letters, animatedLetters, resetSelection, isShuffling]);

  if (letters.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.currentWord}>No letters available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Current word display */}
      <Text style={styles.currentWord}>
        {currentWord || "Tap letters to form words"}
      </Text>

      <View style={styles.rowWithShuffle}>
        <View
          style={[
            styles.wheelContainer,
            { width: wheelSize, height: wheelSize, borderRadius: wheelCenter },
          ]}
        >
          <Svg 
            style={StyleSheet.absoluteFill} 
            pointerEvents="none"
            width={wheelSize}
            height={wheelSize}
            viewBox={`0 0 ${wheelSize} ${wheelSize}`}
          >
            <Path
              d={connectionPath}
              stroke="#4CAF50"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.6}
            />

            {shuffledLetters.map((letter, index) => {
              const angle =
                (index * 2 * Math.PI) / shuffledLetters.length - Math.PI / 2;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const isSelected = selectedIndices.includes(index);

              // Only render hexagon if letter is selected
              if (!isSelected) return null;

              // Use the exact same coordinates as the letter positioning
              // Letter is positioned at: left: wheelCenter + x - hexagonSize, top: wheelCenter + y - hexagonSize
              // Letter container size: width: hexagonSize * 2, height: hexagonSize * 2
              // So letter center is at: (wheelCenter + x - hexagonSize + hexagonSize, wheelCenter + y - hexagonSize + hexagonSize)
              // Which simplifies to: (wheelCenter + x, wheelCenter + y)
              const hexagonCenterX = wheelCenter + x;
              const hexagonCenterY = wheelCenter + y;

              return (
                <Path
                  key={`hexagon-${index}`}
                  d={createHexagonSVGPath(hexagonCenterX, hexagonCenterY, hexagonSize)}
                  fill="#4CAF50"
                  stroke="#43A047"
                  strokeWidth={1.5}
                  opacity={0.95}
                />
              );
            })}
          </Svg>

          {shuffledLetters.map((letter, index) => {
            const angle =
              (index * 2 * Math.PI) / shuffledLetters.length - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const isSelected = selectedIndices.includes(index);
            const selectionOrder = selectedIndices.indexOf(index) + 1;
            const animLetter = animatedLetters[index];

            if (!animLetter) return null;

            return (
              <Animated.View
                key={`${letter}-${index}`}
                style={[
                  styles.letterHexagon,
                  {
                    left: wheelCenter + x - hexagonSize,
                    top: wheelCenter + y - hexagonSize,
                    width: hexagonSize * 2,
                    height: hexagonSize * 2,
                    opacity: animLetter.opacity,
                    transform: [{ scale: animLetter.scale }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={{
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => handleLetterPress(letter, index)}
                  activeOpacity={1}
                  disabled={isShuffling}
                >
                  <Text
                    style={[
                      styles.letterText,
                      isSelected && styles.letterTextSelected,
                    ]}
                  >
                    {letter.toUpperCase()}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectionNumber}>
                      <Text style={styles.selectionNumberText}>
                        {selectionOrder}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Center shuffle button */}
        <TouchableOpacity
          style={[
            styles.centerButton,
            styles.centerShuffleButton,
            isShuffling && styles.disabledCenterButton,
          ]}
          onPress={shuffleLetters}
          disabled={isShuffling}
        >
          <Shuffle size={isSmallScreen ? 24 : 28} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LetterWheel;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isSmallScreen ? 10 : 20,
  },
  rowWithShuffle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: isSmallScreen ? 4 : 8,
  },
  leftShuffleButton: {
    marginRight: isSmallScreen ? 8 : 16,
  },
  centerShuffleButton: {
    position: "absolute",
    backgroundColor: "#8B5CF6", // purple color
  },
  currentWord: {
    fontSize: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
    fontWeight: "bold",
    color: "#ffffffff",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: isSmallScreen ? 20 : 30,
    fontFamily: "Helvetica",
  },
  wheelContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    // borderRadius is applied dynamically inline
    overflow: "hidden",
  },
  letterHexagon: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  letterText: {
    fontSize: isSmallScreen ? 27 : isMediumScreen ? 29 : 31,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
  },
  letterTextSelected: {
    color: "#FFFFFF",
    fontSize: isSmallScreen ? 25 : isMediumScreen ? 27 : 29,
  },
  selectionNumber: {
    position: "absolute",
    top: isSmallScreen ? -10 : -12,
    right: isSmallScreen ? -6 : -8,
    backgroundColor: "rgba(239,68,68,0.7)",
    borderRadius: isSmallScreen ? 10 : 12,
    width: isSmallScreen ? 20 : 24,
    height: isSmallScreen ? 20 : 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 6,
  },
  selectionNumberText: {
    color: "#fff",
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: "bold",
  },
  centerControlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: isSmallScreen ? 8 : 12,
    marginTop: isSmallScreen ? 15 : 20,
  },
  centerButton: {
    width: isSmallScreen ? 40 : 48,
    height: isSmallScreen ? 40 : 48,
    borderRadius: isSmallScreen ? 20 : 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  removeButton: {
    backgroundColor: "#EF4444", // solid red
  },
  shuffleButton: {
    backgroundColor: "#F59E0B", // solid orange
    minWidth: isSmallScreen ? 40 : 50,
    minHeight: isSmallScreen ? 40 : 50,
    borderRadius: 99999,
  },
  submitCenterButton: {
    backgroundColor: "#10B981", // solid green
  },
  clearButton: {
    backgroundColor: "#8B5CF6", // solid purple
  },
  disabledCenterButton: {
    backgroundColor: "#D1D5DB", // solid gray
    opacity: 0.6,
  },
  centerButtonText: {
    color: "#ffffff",
    fontSize: isSmallScreen ? 18 : 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  submitButtonText: {
    fontSize: isSmallScreen ? 20 : 24,
  },
});
