import { Lightbulb, Shuffle } from "lucide-react-native";
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
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";
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
  const [hintModalVisible, setHintModalVisible] = useState(false);
  const [hintMessage, setHintMessage] = useState("");
  const [purchaseHintModal, setPurchaseHintModal] = useState(false);
  const letterPositions = useRef<LetterPosition[]>([]);
  const [submissionTimer, setSubmissionTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const isDragging = useRef(false);
  const currentTouches = useRef<Set<number>>(new Set());
  const wheelContainerRef = useRef<HTMLDivElement>(null);

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
    // Timer disabled - word submission happens on release only
    // Clear any existing timer when component unmounts
    return () => {
      if (submissionTimer) {
        clearTimeout(submissionTimer);
      }
    };
  }, [submissionTimer]);

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
      if (isShuffling) return;
      
      console.log('[Touch] Letter pressed:', index, letter);
      
      if (!isDragging.current) {
        // Start new word
        isDragging.current = true;
        currentTouches.current.clear();
        currentTouches.current.add(index);
        
        const newIndices = [index];
        const newLetters = [letter];
        
        setSelectedIndices(newIndices);
        setSelectedLetters(newLetters);
        setCurrentWord(newLetters.join(""));
        updateConnectionPath(newIndices);
        onLetterSelect?.(letter, index);
      } else {
        // Continue word if not already selected
        if (!currentTouches.current.has(index)) {
          currentTouches.current.add(index);
          
          const newIndices = [...selectedIndices, index];
          const newLetters = newIndices.map((i) => shuffledLetters[i]);
          
          setSelectedIndices(newIndices);
          setSelectedLetters(newLetters);
          setCurrentWord(newLetters.join(""));
          updateConnectionPath(newIndices);
          onLetterSelect?.(letter, index);
        }
      }
    },
    [isShuffling, selectedIndices, shuffledLetters, updateConnectionPath, onLetterSelect]
  );

  const handleLetterRelease = useCallback((): void => {
    if (!isDragging.current) return;
    
    console.log('[Touch] Released, word:', currentWord);
    
    isDragging.current = false;
    
    // Submit word immediately on release
    if (currentWord.length >= 2) {
      setTimeout(() => {
        if (onWordComplete) {
          onWordComplete(currentWord.toLowerCase());
        }
        resetSelection();
      }, 50);
    } else {
      resetSelection();
    }
  }, [currentWord, onWordComplete, resetSelection]);

  // Handle mouse/touch move over wheel for web
  const handleWheelMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current || isShuffling) return;
    
    let clientX: number;
    let clientY: number;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    if (!wheelContainerRef.current) return;
    
    const rect = wheelContainerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    
    // Find which letter is at this position - reduced hitbox
    const touchRadius = hexagonSize * 0.9; // Reduced from 1.2 to 0.9 for tighter detection
    for (let i = 0; i < letterPositions.current.length; i++) {
      const pos = letterPositions.current[i];
      const dx = relativeX - pos.x;
      const dy = relativeY - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= touchRadius && !currentTouches.current.has(i)) {
        handleLetterPress(shuffledLetters[i], i);
        break;
      }
    }
  }, [isShuffling, hexagonSize, shuffledLetters, handleLetterPress]);

  const handleWheelMouseUp = useCallback(() => {
    handleLetterRelease();
  }, [handleLetterRelease]);

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

  const handleHint = useCallback(async (): Promise<void> => {
    const noHints = hintsLeft <= 0;

    // If no hints available, show purchase modal
    if (noHints) {
      setPurchaseHintModal(true);
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
      setHintMessage("All words have been found!");
      setHintModalVisible(true);
      return;
    }

    // Pick a random unfound word
    const randomIndex = Math.floor(Math.random() * unFoundWords.length);
    const hintWord = unFoundWords[randomIndex];

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
  }, [hintsLeft, validWords, foundWords, onHint]);

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
    <View style={styles.container}>
      {/* Current word display */}
      <Text style={styles.currentWord}>
        {currentWord || "Swipe to form words"}
      </Text>

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

        <View
          ref={wheelContainerRef as any}
          style={[
            styles.wheelContainer,
            { width: wheelSize, height: wheelSize, borderRadius: wheelCenter },
          ]}
          onMouseMove={handleWheelMove as any}
          onTouchMove={handleWheelMove as any}
          onMouseUp={handleWheelMouseUp as any}
          onTouchEnd={handleWheelMouseUp as any}
          onMouseLeave={handleWheelMouseUp as any}
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
              strokeWidth={6}
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
                  onPressIn={() => handleLetterPress(letter, index)}
                  onPressOut={handleLetterRelease}
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
          {hintsLeft > 0 && (
            <View style={styles.hintDot}>
              <Text style={styles.hintDotText}>{hintsLeft}</Text>
            </View>
          )}
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
                You're out of hints! Purchase hint packs from the XP Shop to
                continue getting help with difficult words.
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
                        onNavigate("xpshop");
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
    backgroundColor: "#F59E0B", // solid gold
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: isSmallScreen ? 4 : 6,
    minWidth: isSmallScreen ? 40 : 50,
    minHeight: isSmallScreen ? 40 : 50,
    borderRadius: 99999,
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
    fontSize: isSmallScreen ? 30 : isMediumScreen ? 33 : 36,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
  },
  letterTextSelected: {
    color: "#FFFFFF",
    fontSize: isSmallScreen ? 28 : isMediumScreen ? 31 : 34,
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
});
