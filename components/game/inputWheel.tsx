import { Lightbulb, Shuffle } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
<<<<<<< HEAD
import { Alert, Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
=======
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
<<<<<<< HEAD:app/components/game/inputWheel.tsx
>>>>>>> ui-overhall
import Svg, { Path, Polygon } from "react-native-svg";
=======
import Svg, { Path } from "react-native-svg";

import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";
>>>>>>> ui-overhall:components/game/inputWheel.tsx
interface LetterWheelProps {
  letters?: string[];
  onWordComplete?: (word: string) => void;
  onLetterSelect?: (letter: string, index: number) => void;
  validWords?: string[];
  foundWords?: string[]; // Words already found
  crosswordWords?: string[];
  onHint?: (word: string) => Promise<boolean> | boolean; // returns true if hint applied, false if failed
  hintsLeft?: number;
  canUsePaidHints?: boolean; // If true, allow pressing hint even when hintsLeft is 0 (paid hint flows)
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
  onHint,
  hintsLeft = 1,
  canUsePaidHints = true,
  onNavigate,
}) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [connectionPath, setConnectionPath] = useState<string>("");
  const [currentWord, setCurrentWord] = useState<string>("");
  const [shuffledLetters, setShuffledLetters] = useState<string[]>([]);
  const [animatedLetters, setAnimatedLetters] = useState<AnimatedLetter[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
<<<<<<< HEAD:app/components/game/inputWheel.tsx
=======
  const [hintModalVisible, setHintModalVisible] = useState(false);
  const [hintMessage, setHintMessage] = useState("");
  const [purchaseHintModal, setPurchaseHintModal] = useState(false);
>>>>>>> ui-overhall:components/game/inputWheel.tsx
  const letterPositions = useRef<LetterPosition[]>([]);
  const [submissionTimer, setSubmissionTimer] = useState<NodeJS.Timeout | null>(null);

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
    path += ' Z'; // Close the path
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

    const positions = indices
      .map((idx) => letterPositions.current[idx])
      .filter(Boolean);
    if (positions.length === 0) return;

    let path = `M ${positions[0].x} ${positions[0].y}`;
    for (let i = 1; i < positions.length; i++) {
      path += ` L ${positions[i].x} ${positions[i].y}`;
    }
    setConnectionPath(path);
  }, []);

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

<<<<<<< HEAD
  const handleHint = useCallback((): void => {
    if (hintsLeft <= 0) {
      Alert.alert('No Hints Left', 'You have used all your hints for this game.');
=======
  const handleHint = useCallback(async (): Promise<void> => {
<<<<<<< HEAD:app/components/game/inputWheel.tsx
    const noFreeHints = hintsLeft <= 0;
    if (noFreeHints && !canUsePaidHints) {
      setHintMessage("You have used all your hints for this game.");
      setHintModalVisible(true);
>>>>>>> ui-overhall
=======
    const noHints = hintsLeft <= 0;
    
    // If no hints available, show purchase modal
    if (noHints) {
      setPurchaseHintModal(true);
>>>>>>> ui-overhall:components/game/inputWheel.tsx
      return;
    }

    // Find valid words that haven't been found yet
    const unFoundWords = validWords.filter(
      (word) =>
        !foundWords.some(
          (foundWord) => foundWord.toLowerCase() === word.toLowerCase()
        )
    );

    if (unFoundWords.length === 0) {
<<<<<<< HEAD
      Alert.alert('No Hints Available', 'All words have been found!');
=======
      setHintMessage("All words have been found!");
      setHintModalVisible(true);
>>>>>>> ui-overhall
      return;
    }

    // Pick a random unfound word
    const randomIndex = Math.floor(Math.random() * unFoundWords.length);
    const hintWord = unFoundWords[randomIndex];
<<<<<<< HEAD
    
    onHint?.(hintWord);
    Alert.alert('Hint!', `Try the word: ${hintWord.toUpperCase()}`);
  }, [hintsLeft, validWords, foundWords, onHint]);
=======

    if (!onHint) {
      setHintMessage(`Try the word: ${hintWord.toUpperCase()}`);
      setHintModalVisible(true);
      return;
    }

    // Ask parent to apply the hint (deduct from global hints)
    try {
      const ok = await onHint(hintWord);
      if (ok === false) {
        setPurchaseHintModal(true);
        return;
      }
      
      setHintMessage(`Try the word: ${hintWord.toUpperCase()}`);
      setHintModalVisible(true);
    } catch {
      setHintMessage("Couldn't use a hint right now.");
      setHintModalVisible(true);
    }
<<<<<<< HEAD:app/components/game/inputWheel.tsx

    setHintMessage(`Try the word: ${hintWord.toUpperCase()}`);
    setHintModalVisible(true);
  }, [hintsLeft, validWords, foundWords, onHint, canUsePaidHints]);
>>>>>>> ui-overhall
=======
  }, [hintsLeft, validWords, foundWords, onHint]);
>>>>>>> ui-overhall:components/game/inputWheel.tsx

  // const isValidWord =
  //   currentWord.length > 2 && validWords.includes(currentWord.toLowerCase());

  if (letters.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.currentWord}>No letters available</Text>
      </View>
    );
  }

  return (
<<<<<<< HEAD
      <View style={styles.container}>
        {/* Current word display */}
        <Text style={styles.currentWord}>{currentWord || "Tap letters to form words"}</Text>
        
        <View style={styles.rowWithShuffle}>
          <TouchableOpacity
            style={[
              styles.centerButton, 
              styles.shuffleButton, 
              styles.leftShuffleButton,
              isShuffling && styles.disabledCenterButton
            ]}
            onPress={shuffleLetters}
            disabled={isShuffling}
          >
            <Shuffle size={isSmallScreen ? 20 : 24} color="#ffffff" />
          </TouchableOpacity>
          
          <View
            style={[
              styles.wheelContainer,
              { width: wheelSize, height: wheelSize, borderRadius: wheelCenter },
            ]}
          >
            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
              <Path
                d={connectionPath}
                stroke={isValidWord ? "#10B981" : "#fde047"}
                strokeWidth={4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
=======
    <View style={styles.container}>
      {/* Current word display */}
      <Text style={styles.currentWord}>
        {currentWord || "Tap letters to form words"}
      </Text>
>>>>>>> ui-overhall

      <View style={styles.rowWithShuffle}>
        <TouchableOpacity
          style={[
            styles.centerButton,
            styles.shuffleButton,
            styles.leftShuffleButton,
            isShuffling && styles.disabledCenterButton,
          ]}
          onPress={shuffleLetters}
          disabled={isShuffling}
        >
          <Shuffle size={isSmallScreen ? 20 : 24} color="#ffffff" />
        </TouchableOpacity>

<<<<<<< HEAD
                return (
                  <Polygon
                    key={`hexagon-${index}`}
                    points={createHexagonPath(x, y, hexagonSize)}
                    fill={isSelected ? "#F59E0B" : "#8B5CF6"}
                    stroke={isSelected ? "#F59E0B" : "#8B5CF6"}
                    strokeWidth={2}
                    opacity={1}
                  />
                );
              })}
            </Svg>
=======
        <View
          style={[
            styles.wheelContainer,
            { width: wheelSize, height: wheelSize, borderRadius: wheelCenter },
          ]}
        >
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path
              d={connectionPath}
              stroke="#4CAF50"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.6}
            />
>>>>>>> ui-overhall

            {shuffledLetters.map((letter, index) => {
              const angle =
                (index * 2 * Math.PI) / shuffledLetters.length - Math.PI / 2;
              const x = Math.cos(angle) * radius + wheelCenter;
              const y = Math.sin(angle) * radius + wheelCenter;
              const isSelected = selectedIndices.includes(index);

              // Only render hexagon if letter is selected
              if (!isSelected) return null;

              return (
                <Path
                  key={`hexagon-${index}`}
                  d={createHexagonSVGPath(x, y, hexagonSize)}
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

<<<<<<< HEAD
          <TouchableOpacity
            style={[
              styles.centerButton,
              styles.clearButton,
              selectedLetters.length === 0 && styles.disabledCenterButton,
            ]}
            onPress={resetSelection}
            disabled={selectedLetters.length === 0}
          >
            <X size={isSmallScreen ? 20 : 24} color="#ffffff" />
          </TouchableOpacity>
        </View>
=======
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

        <TouchableOpacity
          style={[
            styles.centerButton,
            styles.hintButton,
            styles.rightHintButton,
          ]}
          onPress={handleHint}
        >
          <Lightbulb size={isSmallScreen ? 20 : 24} color="#ffffff" />
<<<<<<< HEAD:app/components/game/inputWheel.tsx
          <Text style={styles.hintCountText}>{hintsLeft}</Text>
        </TouchableOpacity>
>>>>>>> ui-overhall
      </View>

      {/* Control Buttons outside the wheel */}
      <View style={styles.centerControlsContainer}>
        <TouchableOpacity
          style={[
            styles.centerButton,
            styles.removeButton,
            selectedLetters.length === 0 && styles.disabledCenterButton,
          ]}
          onPress={removeLetter}
          disabled={selectedLetters.length === 0}
        >
          <Eraser size={isSmallScreen ? 20 : 24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.centerButton,
            styles.submitCenterButton,
            currentWord.length < 2 && styles.disabledCenterButton,
          ]}
          onPress={submitWord}
          disabled={currentWord.length < 2}
        >
          <Check size={isSmallScreen ? 20 : 24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.centerButton,
            styles.clearButton,
            selectedLetters.length === 0 && styles.disabledCenterButton,
          ]}
          onPress={resetSelection}
          disabled={selectedLetters.length === 0}
        >
          <X size={isSmallScreen ? 20 : 24} color="#ffffff" />
=======
          {hintsLeft > 0 && (
            <View style={styles.hintDot}>
              <Text style={styles.hintDotText}>{hintsLeft}</Text>
            </View>
          )}
>>>>>>> ui-overhall:components/game/inputWheel.tsx
        </TouchableOpacity>
      </View>

      {/* Hint Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={hintModalVisible}
        onRequestClose={() => setHintModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setHintModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.hintCard}>
              <Lightbulb size={28} color="#FFD700" style={styles.hintIcon} />
              <Text style={styles.hintTitle}>HINT</Text>
              <Text style={styles.hintText}>{hintMessage}</Text>
              <TouchableOpacity
                style={styles.hintCloseButton}
                onPress={() => setHintModalVisible(false)}
              >
                <Text style={styles.hintCloseButtonText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Purchase Hint Modal */}
      <Modal
        visible={purchaseHintModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPurchaseHintModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPurchaseHintModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <ThemedCard style={styles.hintModalCard}>
              <ThemedText style={styles.hintModalTitle}>
                No Hints Available
              </ThemedText>
              <ThemedText style={styles.hintModalText}>
                You're out of hints! Purchase hint packs from the XP Shop to continue getting help with difficult words.
              </ThemedText>
              <View style={styles.hintModalButtons}>
                <ThemedButton
                  variant="outline"
                  title="Cancel"
                  style={styles.hintModalButton}
                  onPress={() => setPurchaseHintModal(false)}
                />
                <ThemedButton
                  variant="primary"
                  title="Go to Shop"
                  style={styles.hintModalButton}
                  onPress={() => {
                    setPurchaseHintModal(false);
                    // Add slight delay to ensure modal closes before navigation
                    setTimeout(() => {
                      if (onNavigate) {
                        onNavigate('xpshop');
                      }
                    }, 100);
                  }}
                />
              </View>
            </ThemedCard>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  rightHintButton: {
    marginLeft: isSmallScreen ? 8 : 16,
  },
  hintButton: {
<<<<<<< HEAD
  backgroundColor: 'rgba(255,215,0,0.7)', // gold
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
=======
    backgroundColor: "#F59E0B", // solid gold
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
>>>>>>> ui-overhall
    paddingHorizontal: isSmallScreen ? 4 : 6,
    minWidth: isSmallScreen ? 50 : 60,
  },
  hintCountText: {
    color: "#fffbe6",
    fontWeight: "bold",
    marginLeft: 4,
    fontSize: isSmallScreen ? 14 : 16,
  },
  hintDot: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  hintDotText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  hintModalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  hintModalButton: {
    flex: 1,
  },
  currentWord: {
<<<<<<< HEAD:app/components/game/inputWheel.tsx
    fontSize: isSmallScreen ? 16 : isMediumScreen ? 17 : 18,
=======
    fontSize: isSmallScreen ? 24 : isMediumScreen ? 25 : 26,
>>>>>>> ui-overhall:components/game/inputWheel.tsx
    fontWeight: "bold",
    color: "#8B5CF6",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: isSmallScreen ? 20 : 30,
    fontFamily: "Helvetica",
    minHeight: 70,
  },
  wheelContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
<<<<<<< HEAD:app/components/game/inputWheel.tsx
  backgroundColor: "rgba(55,65,81,0.85)",
=======
    backgroundColor: "rgba(255, 255, 255, 0.6)",
>>>>>>> ui-overhall:components/game/inputWheel.tsx
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
<<<<<<< HEAD:app/components/game/inputWheel.tsx
    fontSize: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
    fontWeight: "bold",
    color: "#ffffff",
=======
    fontSize: isSmallScreen ? 27 : isMediumScreen ? 29 : 31,
    fontWeight: "600",
    color: "#333333",
>>>>>>> ui-overhall:components/game/inputWheel.tsx
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  letterTextSelected: {
    color: "#000000",
    fontSize: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
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
<<<<<<< HEAD
  backgroundColor: "rgba(255,255,255,0.7)",
=======
    backgroundColor: "#FFFFFF",
>>>>>>> ui-overhall
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  removeButton: {
<<<<<<< HEAD
  backgroundColor: "rgba(239,68,68,0.7)",
  },
  shuffleButton: {
  backgroundColor: "rgba(245,158,11,0.7)",
  },
  submitCenterButton: {
  backgroundColor: "rgba(16,185,129,0.7)",
  },
  clearButton: {
  backgroundColor: "rgba(139,92,246,0.7)",
  },
  disabledCenterButton: {
  backgroundColor: "rgba(209,213,219,0.7)",
=======
    backgroundColor: "#EF4444", // solid red
  },
  shuffleButton: {
    backgroundColor: "#F59E0B", // solid orange
  },
  submitCenterButton: {
    backgroundColor: "#10B981", // solid green
  },
  clearButton: {
    backgroundColor: "#8B5CF6", // solid purple
  },
  disabledCenterButton: {
    backgroundColor: "#D1D5DB", // solid gray
>>>>>>> ui-overhall
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
<<<<<<< HEAD
=======
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxWidth: 300,
  },
  hintCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  hintIcon: {
    marginBottom: 12,
  },
  hintTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#22C55E",
    marginBottom: 12,
    fontFamily: "Helvetica",
  },
  hintText: {
    fontSize: 18,
    color: "#374151",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
    fontFamily: "Helvetica",
  },
  hintCloseButton: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hintCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Helvetica",
  },
<<<<<<< HEAD:app/components/game/inputWheel.tsx
>>>>>>> ui-overhall
});
=======
});
>>>>>>> ui-overhall:components/game/inputWheel.tsx
