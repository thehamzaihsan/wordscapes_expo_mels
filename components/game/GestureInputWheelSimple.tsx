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
  foundWords?: string[];
  crosswordWords?: string[];
  onHint?: (word: string) => Promise<boolean> | boolean;
  hintsLeft?: number;
  canUsePaidHints?: boolean;
  onNavigate?: (screen: string) => void;
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

const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 900;

const GestureInputWheel: React.FC<LetterWheelProps> = ({
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
  const isDragging = useRef(false);
  const currentTouches = useRef<Set<number>>(new Set());
  const wheelContainerRef = useRef<HTMLDivElement>(null);

  const hexagonSize = isSmallScreen ? 28 : isMediumScreen ? 32 : 35;
  const hexagonPadding = isSmallScreen ? 18 : isMediumScreen ? 22 : 25;
  const minRadius = isSmallScreen ? 60 : isMediumScreen ? 70 : 75;

  const radius = useMemo(() => {
    const numLetters = shuffledLetters.length;
    if (numLetters === 0) return minRadius;
    const spacePerLetter = hexagonSize * 2 + hexagonPadding;
    const requiredCircumference = numLetters * spacePerLetter;
    const radiusFromCircumference = requiredCircumference / (2 * Math.PI);
    return Math.max(minRadius, radiusFromCircumference);
  }, [shuffledLetters.length, hexagonSize, hexagonPadding, minRadius]);

  const wheelSize = useMemo(() => {
    const baseSize = (radius + hexagonSize) * 2 + 20;
    const maxSize = Math.min(width * 0.9, height * 0.4);
    return Math.min(baseSize, maxSize);
  }, [radius, hexagonSize]);

  const wheelCenter = wheelSize / 2;

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
    path += " Z";
    return path;
  };

  const resetSelection = useCallback((): void => {
    setSelectedLetters([]);
    setSelectedIndices([]);
    setConnectionPath("");
    setCurrentWord("");
    isDragging.current = false;
    currentTouches.current.clear();
  }, []);

  useEffect(() => {
    setShuffledLetters([...letters]);
    const newAnimatedLetters = letters.map((letter, index) => ({
      letter,
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
      index,
    }));
    setAnimatedLetters(newAnimatedLetters);
  }, [letters]);

  useEffect(() => {
    if (shuffledLetters.length === 0) return;
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
    if (shuffledLetters.length === 0) return;
    const positions = indices.map((idx) => {
      const angle = (idx * 2 * Math.PI) / shuffledLetters.length - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
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
    (index: number): void => {
      if (isShuffling) return;
      
      console.log('[Touch] Letter pressed:', index, shuffledLetters[index]);
      
      if (!isDragging.current) {
        // Start new word
        isDragging.current = true;
        currentTouches.current.clear();
        currentTouches.current.add(index);
        
        const newIndices = [index];
        const newLetters = [shuffledLetters[index]];
        
        setSelectedIndices(newIndices);
        setSelectedLetters(newLetters);
        setCurrentWord(newLetters.join(""));
        updateConnectionPath(newIndices);
        onLetterSelect?.(shuffledLetters[index], index);
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
          onLetterSelect?.(shuffledLetters[index], index);
        }
      }
    },
    [isShuffling, selectedIndices, shuffledLetters, updateConnectionPath, onLetterSelect]
  );

  const handleLetterRelease = useCallback((): void => {
    if (!isDragging.current) return;
    
    console.log('[Touch] Released, word:', currentWord);
    
    isDragging.current = false;
    
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
    
    // Find which letter is at this position
    const touchRadius = hexagonSize * 2;
    for (let i = 0; i < letterPositions.current.length; i++) {
      const pos = letterPositions.current[i];
      const dx = relativeX - pos.x;
      const dy = relativeY - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= touchRadius && !currentTouches.current.has(i)) {
        handleLetterPress(i);
        break;
      }
    }
  }, [isShuffling, hexagonSize, handleLetterPress]);

  const handleWheelMouseUp = useCallback(() => {
    handleLetterRelease();
  }, [handleLetterRelease]);

  const shuffleLetters = useCallback((): void => {
    if (isShuffling) return;
    setIsShuffling(true);
    resetSelection();

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

    Animated.parallel(fadeOutAnimations).start(() => {
      const lettersToShuffle = [...letters];
      for (let i = lettersToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lettersToShuffle[i], lettersToShuffle[j]] = [
          lettersToShuffle[j],
          lettersToShuffle[i],
        ];
      }

      setShuffledLetters(lettersToShuffle);

      const newAnimatedLetters = lettersToShuffle.map((letter, index) => ({
        letter,
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.3),
        index,
      }));
      setAnimatedLetters(newAnimatedLetters);

      const fadeInAnimations = newAnimatedLetters.map((animLetter, index) =>
        Animated.sequence([
          Animated.delay(index * 100),
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

    if (noHints) {
      setPurchaseHintModal(true);
      return;
    }

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

    const randomIndex = Math.floor(Math.random() * unFoundWords.length);
    const hintWord = unFoundWords[randomIndex];

    if (!onHint) {
      setHintMessage(`Try the word: ${hintWord.toUpperCase()}`);
      setHintModalVisible(true);
      return;
    }

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

  if (letters.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.currentWord}>No letters available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.currentWord}>
        {currentWord || "Drag through letters to form words"}
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
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />

            {shuffledLetters.map((letter, index) => {
              const angle =
                (index * 2 * Math.PI) / shuffledLetters.length - Math.PI / 2;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const isSelected = selectedIndices.includes(index);

              if (!isSelected) return null;

              const hexagonCenterX = wheelCenter + x;
              const hexagonCenterY = wheelCenter + y;

              return (
                <Path
                  key={`hexagon-${index}`}
                  d={createHexagonSVGPath(
                    hexagonCenterX,
                    hexagonCenterY,
                    hexagonSize
                  )}
                  fill="#4CAF50"
                  stroke="#43A047"
                  strokeWidth={2}
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
                  onPressIn={() => handleLetterPress(index)}
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

export default GestureInputWheel;

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
    backgroundColor: "#F59E0B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: isSmallScreen ? 4 : 6,
    minWidth: isSmallScreen ? 40 : 50,
    minHeight: isSmallScreen ? 40 : 50,
    borderRadius: 99999,
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
  hintModalCard: {
    padding: 24,
    margin: 20,
  },
  hintModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  hintModalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
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
  shuffleButton: {
    backgroundColor: "#F59E0B",
    minWidth: isSmallScreen ? 40 : 50,
    minHeight: isSmallScreen ? 40 : 50,
    borderRadius: 99999,
  },
  disabledCenterButton: {
    backgroundColor: "#D1D5DB",
    opacity: 0.6,
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
