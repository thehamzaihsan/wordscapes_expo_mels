import { Check, Eraser, Lightbulb, Shuffle, X } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path, Polygon } from "react-native-svg";
interface LetterWheelProps {
  letters?: string[];
  onWordComplete?: (word: string) => void;
  onLetterSelect?: (letter: string, index: number) => void;
  validWords?: string[];
  foundWords?: string[]; // Words already found
  onHint?: (word: string) => void; // Callback when hint is used
  hintsLeft?: number;
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
const isLargeScreen = height >= 900;


const LetterWheel: React.FC<LetterWheelProps> = ({
  letters = [],
  onWordComplete,
  onLetterSelect,
  validWords = [],
  foundWords = [],
  onHint,
  hintsLeft = 1,
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
  const letterPositions = useRef<LetterPosition[]>([]);

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
  }, [radius, hexagonSize, width, height]);

  const wheelCenter = wheelSize / 2;

  // Create hexagon path for SVG
  const createHexagonPath = (
    centerX: number,
    centerY: number,
    size: number
  ): string => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(" ");
  };

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

  const addLetter = useCallback(
    (letter: string, index: number): void => {
      if (selectedIndices.includes(index)) {
        return;
      }
      const newIndices = [...selectedIndices, index];
      const newLetters = [...selectedLetters, letter];

      setSelectedIndices(newIndices);
      setSelectedLetters(newLetters);
      setCurrentWord(newLetters.join(""));
      updateConnectionPath(newIndices);
      onLetterSelect?.(letter, index);
    },
    [selectedIndices, selectedLetters, onLetterSelect, updateConnectionPath]
  );

  const resetSelection = useCallback((): void => {
    setSelectedLetters([]);
    setSelectedIndices([]);
    setConnectionPath("");
    setCurrentWord("");
  }, []);

  const submitWord = useCallback((): void => {
    if (selectedLetters.length > 0) {
      const word = selectedLetters.join("").toLowerCase();
      onWordComplete?.(word);
    }
    resetSelection();
  }, [selectedLetters, onWordComplete, resetSelection]);

  const removeLetter = useCallback((): void => {
    if (selectedLetters.length > 0) {
      const newLetters = selectedLetters.slice(0, -1);
      const newIndices = selectedIndices.slice(0, -1);

      setSelectedLetters(newLetters);
      setSelectedIndices(newIndices);
      setCurrentWord(newLetters.join(""));
      updateConnectionPath(newIndices);
    }
  }, [selectedLetters, selectedIndices, updateConnectionPath]);

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
        [lettersToShuffle[i], lettersToShuffle[j]] = [lettersToShuffle[j], lettersToShuffle[i]];
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
          ])
        ])
      );

      Animated.parallel(fadeInAnimations).start(() => {
        setIsShuffling(false);
      });
    });
  }, [letters, animatedLetters, resetSelection, isShuffling]);

  const handleHint = useCallback((): void => {
    if (hintsLeft <= 0) {
      setHintMessage('You have used all your hints for this game.');
      setHintModalVisible(true);
      return;
    }

    // Find valid words that haven't been found yet
    const unFoundWords = validWords.filter(word => 
      !foundWords.some(foundWord => foundWord.toLowerCase() === word.toLowerCase())
    );

    if (unFoundWords.length === 0) {
      setHintMessage('All words have been found!');
      setHintModalVisible(true);
      return;
    }

    // Pick a random unfound word
    const randomIndex = Math.floor(Math.random() * unFoundWords.length);
    const hintWord = unFoundWords[randomIndex];
    
    onHint?.(hintWord);
    setHintMessage(`Try the word: ${hintWord.toUpperCase()}`);
    setHintModalVisible(true);
  }, [hintsLeft, validWords, foundWords, onHint]);

  const isValidWord =
    currentWord.length > 2 && validWords.includes(currentWord.toLowerCase());

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
                const x = Math.cos(angle) * radius + wheelCenter;
                const y = Math.sin(angle) * radius + wheelCenter;
                const isSelected = selectedIndices.includes(index);

                // Only render hexagon if letter is selected
                if (!isSelected) return null;

                return (
                  <Polygon
                    key={`hexagon-${index}`}
                    points={createHexagonPath(x, y, hexagonSize)}
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
                      width: '100%', 
                      height: '100%', 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}
                    onPress={() => addLetter(letter, index)}
                    activeOpacity={0.7}
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
              hintsLeft <= 0 && styles.disabledCenterButton,
            ]}
            onPress={handleHint}
            disabled={hintsLeft <= 0}
          >
            <Lightbulb size={isSmallScreen ? 20 : 24} color="#ffffff" />
            <Text style={styles.hintCountText}>{hintsLeft}</Text>
          </TouchableOpacity>
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
    width: '100%',
    marginBottom: isSmallScreen ? 4 : 8,
  },
  leftShuffleButton: {
    marginRight: isSmallScreen ? 8 : 16,
  },
  rightHintButton: {
    marginLeft: isSmallScreen ? 8 : 16,
  },
  hintButton: {
  backgroundColor: '#F59E0B', // solid gold
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isSmallScreen ? 4 : 6,
    minWidth: isSmallScreen ? 50 : 60,
  },
  hintCountText: {
    color: '#fffbe6',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: isSmallScreen ? 14 : 16,
  },
  currentWord: {
    fontSize: isSmallScreen ? 22 : isMediumScreen ? 23 : 24,
    fontWeight: "bold",
    color: "#ffffffff",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: isSmallScreen ? 20 : 30,
    fontFamily: 'Helvetica',
  },
  wheelContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
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
    fontSize: isSmallScreen ? 25 : isMediumScreen ? 27 : 29,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
  },
  hintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
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
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 12,
    fontFamily: 'Helvetica',
  },
  hintText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    fontFamily: 'Helvetica',
  },
  hintCloseButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hintCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Helvetica',
  },
});
