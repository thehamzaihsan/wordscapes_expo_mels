import LetterWheel from "./inputWheel";
// import { router } from "@/.expo/types/router";
import { Difficulty, getDifficultyConfig } from "@/constants/difficulty";
import { upsertLocalLevel, mutateLocalStats, syncUser } from "@/lib/sync";
import { updateGuestSnapshotFromProgress } from "@/lib/guestSnapshot";
import { generateCrossword } from "@/hooks/crossword-gen";
import {
  generateBonusWords,
  generateLevelFromJSON,
  initializeGameManager,
} from "@/hooks/game-manager";
import { Audio } from "expo-av";
import { BlurView } from "expo-blur";
import LottieView from "lottie-react-native";
import { ChevronLeft } from "lucide-react-native";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// --- MISSING TYPES AND CONSTANTS ---
const { width, height } = Dimensions.get("window");
const GRID_AREA_WIDTH = width * 0.9;
const GRID_AREA_HEIGHT = height * 0.4;

interface GridCell {
  letter: string | null;
  isRevealed: boolean;
  isActive: boolean;
  belongsToWords: string[];
}

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
}

interface AnimatingLetter {
  id: string;
  letter: string;
  position: Animated.ValueXY;
}
interface WordPlacement {
  word: string;
  startRow: number;
  startCol: number;
  direction: "horizontal" | "vertical";
  isFound: boolean;
}

interface GameScreenProps {
  onNavigate?: (screen: string) => void;
  difficulty?: Difficulty;
  baseWord?: string;
  levelTitle?: string;
  categoryName?: string; // LOCAL STORAGE: Receive category name
  levelData?: {
    level: number; // LOCAL STORAGE: Receive level number
    baseWord: string;
    letters: string[];
    crosswordWords: string[];
    difficulty: Difficulty;
  };
}

export default function GameScreen({
  onNavigate,
  difficulty = "medium",
  baseWord = "planet",
  levelTitle = "Planet",
  categoryName,
  levelData,
}: GameScreenProps) {

  // --- MAIN STATE ---
  const [gameGrid, setGameGrid] = useState<GridCell[][] | null>(null);
  const [letters, setLetters] = useState<string[]>([]);
  const [crosswordWords, setCrosswordWords] = useState<string[]>([]);
  const [allValidWords, setAllValidWords] = useState<string[]>([]); // All words for bonus checking
  const [wordPlacements, setWordPlacements] = useState<WordPlacement[]>([]);
  const [foundCrosswordWords, setFoundCrosswordWords] = useState<string[]>([]);
  const [foundBonusWords, setFoundBonusWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempts] = useState(0); // placeholder for future attempt tracking
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const gameCompleteRef = useRef(false); // track transition
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animatingLetters, setAnimatingLetters] = useState<AnimatingLetter[]>([]);
  const gridCellRefs = useRef<{ [key: string]: View }>({});
  const letterWheelRef = useRef<View>(null);
  const containerRef = useRef<View>(null);
  const scoreScaleAnim = useRef(new Animated.Value(1)).current;
  const [cellSize, setCellSize] = useState(40);

  // --- HINT STATE ---
  const [hintAnim, setHintAnim] = useState<
    | { row: number; col: number; anim: Animated.Value }
    | null
  >(null);
  const [hintsLeft, setHintsLeft] = useState(1); // Only 1 hint per game
  const [hintedWordss, setHintedWords] = useState<string[]>([]);

  // Handle word hint from LetterWheel
  const handleWordHint = useCallback((hintedWord: string) => {
    if (hintsLeft <= 0) return;
    
    // Add to hinted words to track what was hinted
    setHintedWords(prev => [...prev, hintedWord]);
    setHintsLeft(prev => prev - 1);
    
    // Could add visual feedback here if needed
  }, [hintsLeft]);

  // --- SOUND STATES ---
  const [rightWordSound, setRightWordSound] = useState<Audio.Sound | null>(
    null
  );
  const [wrongWordSound, setWrongWordSound] = useState<Audio.Sound | null>(
    null
  );
  const [bonusWordSound, setBonusWordSound] = useState<Audio.Sound | null>(
    null
  );
  const [levelCompleteSound, setLevelCompleteSound] =
    useState<Audio.Sound | null>(null);

  const diff = getDifficultyConfig(difficulty);

  // --- LOAD AND UNLOAD SOUNDS ---
  useEffect(() => {
    let mounted = true;
    // Only load once
    (async () => {
      try {
        const [rightRes, wrongRes, bonusRes, levelRes] = await Promise.all([
          Audio.Sound.createAsync(
            require("../../assets/sounds/correct-word.mp3")
          ),
          Audio.Sound.createAsync(
            require("../../assets/sounds/wrong-word.mp3")
          ),
          Audio.Sound.createAsync(
            require("../../assets/sounds/bonus-word.mp3")
          ),
          Audio.Sound.createAsync(
            require("../../assets/sounds/level-complete.mp3")
          ),
        ]);
        if (!mounted) return;
        setRightWordSound(rightRes.sound);
        setWrongWordSound(wrongRes.sound);
        setBonusWordSound(bonusRes.sound);
        setLevelCompleteSound(levelRes.sound);
      } catch (error) {
        console.error("Failed to load sounds", error);
      }
    })();
    return () => {
      mounted = false;
      rightWordSound?.unloadAsync();
      wrongWordSound?.unloadAsync();
      bonusWordSound?.unloadAsync();
      levelCompleteSound?.unloadAsync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty deps so we don't recreate/unload repeatedly

  // Helper function to play sounds
  const playSound = async (soundObject: Audio.Sound | null) => {
    try {
      if (soundObject) {
        await soundObject.replayAsync();
      }
    } catch (e) {
      console.error("Failed to play sound", e);
    }
  };

  useEffect(() => {
    if (score === 0) return;
    Animated.sequence([
      Animated.timing(scoreScaleAnim, {
        toValue: 1.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scoreScaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [score, scoreScaleAnim]);

  useEffect(() => {
    const particleColors = ["#8B5CF6", "#EF4444", "#F59E0B", "#10B981"];
    const createParticle = (id: number): Particle => ({
      id,
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(Math.random() * 0.3 + 0.1),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    });

    const particleArray = Array.from({ length: 20 }, (_, i) =>
      createParticle(i)
    );
    setParticles(particleArray);

    const animateParticle = (particle: Particle) => {
      const duration = Math.random() * 10000 + 8000;
      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: Math.random() * width,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: Math.random() * height,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: Math.random() * 0.3 + 0.1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]).start(() => animateParticle(particle));
    };

    particleArray.forEach(animateParticle);
  }, [levelData]);

  const createGameGrid = useCallback(
    (basicGrid: string[][], placements: WordPlacement[]): GridCell[][] => {
      const rows = basicGrid.length;
      const cols = basicGrid[0]?.length || 0;

      const gameGrid: GridCell[][] = Array(rows)
        .fill(null)
        .map(() =>
          Array(cols)
            .fill(null)
            .map(() => ({
              letter: null,
              isRevealed: false,
              isActive: false,
              belongsToWords: [],
            }))
        );

      placements.forEach((placement) => {
        const { word, startRow, startCol, direction } = placement;
        for (let i = 0; i < word.length; i++) {
          const row = direction === "horizontal" ? startRow : startRow + i;
          const col = direction === "horizontal" ? startCol + i : startCol;
          if (row >= 0 && row < rows && col >= 0 && col < cols) {
            gameGrid[row][col].letter = word[i].toUpperCase();
            gameGrid[row][col].isActive = true;
            gameGrid[row][col].belongsToWords.push(word);
          }
        }
      });
      return gameGrid;
    },
    []
  );

  const measureComponent = (
    ref: View
  ): Promise<{ px: number; py: number; width: number; height: number }> => {
    return new Promise((resolve) => {
      ref.measure((fx, fy, width, height, px, py) => {
        resolve({ px, py, width, height });
      });
    });
  };

  const revealWordInGrid = useCallback((foundWord: string) => {
    const normalizedFoundWord = foundWord.toLowerCase();

    setWordPlacements((prev) => {
      const targetPlacement = prev.find(
        (placement) =>
          placement.word === normalizedFoundWord && !placement.isFound
      );
      if (!targetPlacement) return prev;

      const newPlacements = prev.map((p) =>
        p === targetPlacement ? { ...p, isFound: true } : p
      );

      setGameGrid((prevGrid) => {
        if (!prevGrid) return prevGrid;
        const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
        const { word, startRow, startCol, direction } = targetPlacement;

        for (let i = 0; i < word.length; i++) {
          const row = direction === "horizontal" ? startRow : startRow + i;
          const col = direction === "horizontal" ? startCol + i : startCol;
          if (newGrid[row]?.[col]) {
            newGrid[row][col].isRevealed = true;
          }
        }
        return newGrid;
      });
      return newPlacements;
    });
  }, []);

  const startFloatingLetterAnimation = useCallback(
    async (word: string) => {
      const normalizedWord = word.toLowerCase();
      const placement = wordPlacements.find(
        (p) => p.word === normalizedWord && !p.isFound
      );

      if (!placement || !letterWheelRef.current || !containerRef.current) {
        revealWordInGrid(word);
        return;
      }

      const containerMeasurement = await measureComponent(containerRef.current);
      const containerAbsX = containerMeasurement.px;
      const containerAbsY = containerMeasurement.py;

      const { startRow, startCol, direction } = placement;

      const wheelMeasurement = await measureComponent(letterWheelRef.current);
      const startX =
        wheelMeasurement.px + wheelMeasurement.width / 2 - containerAbsX;
      const startY =
        wheelMeasurement.py + wheelMeasurement.height / 2 - containerAbsY;

      const animations: Animated.CompositeAnimation[] = [];
      const lettersToAnimate: AnimatingLetter[] = [];

      for (let i = 0; i < word.length; i++) {
        const row = direction === "horizontal" ? startRow : startRow + i;
        const col = direction === "horizontal" ? startCol + i : startCol;
        const cellRef = gridCellRefs.current[`${row}-${col}`];

        if (cellRef) {
          const cellMeasurement = await measureComponent(cellRef);
          const endX = cellMeasurement.px - containerAbsX;
          const endY = cellMeasurement.py - containerAbsY;

          const letterInfo: AnimatingLetter = {
            id: `${word}-${i}`,
            letter: word[i].toUpperCase(),
            position: new Animated.ValueXY({ x: startX, y: startY }),
          };
          lettersToAnimate.push(letterInfo);

          animations.push(
            Animated.timing(letterInfo.position, {
              toValue: { x: endX, y: endY },
              duration: 600,
              useNativeDriver: false,
            })
          );
        }
      }

      setAnimatingLetters(lettersToAnimate);

      Animated.stagger(100, animations).start(() => {
        revealWordInGrid(word);
        setAnimatingLetters([]);
      });
    },
    [wordPlacements, revealWordInGrid]
  );

  const handleLetterSelect = useCallback((letter: string, index: number) => {
    // ...
  }, []);

  const handleWordComplete = useCallback(
    async (word: string) => {
      const normalizedWord = word.toLowerCase().trim();
      if (normalizedWord.length < 2) {
        return;
      }
      if (
        foundCrosswordWords.includes(normalizedWord) ||
        foundBonusWords.includes(normalizedWord)
      ) {
        await playSound(wrongWordSound);
        return;
      }

      if (crosswordWords.includes(normalizedWord)) {
        await playSound(rightWordSound);
        setFoundCrosswordWords((prev) => [...prev, normalizedWord]);
        const points = normalizedWord.length * 100;
        setScore((prev) => prev + points);

        startFloatingLetterAnimation(normalizedWord);

        if (foundCrosswordWords.length + 1 === crosswordWords.length) {
          setGameComplete(true);
          setTimeout(() => {
            playSound(levelCompleteSound);
          }, 1000);
        }
      } else {
        const isValidBonus = allValidWords.some(
          (w) => w.toLowerCase() === normalizedWord
        );
        if (isValidBonus) {
          await playSound(bonusWordSound);
          setFoundBonusWords((prev) => [...prev, normalizedWord]);
          const points = normalizedWord.length * 10;
          setScore((prev) => prev + points);
        } else {
          await playSound(wrongWordSound);
        }
      }
    },
    [
      crosswordWords,
      foundCrosswordWords,
      foundBonusWords,
      allValidWords,
      startFloatingLetterAnimation,
      rightWordSound,
      wrongWordSound,
      bonusWordSound,
      levelCompleteSound,
    ]
  );

  const extractWordPlacements = useCallback(
    (grid: string[][], words: string[]): WordPlacement[] => {
      const placements: WordPlacement[] = [];
      const rows = grid.length;
      const cols = grid[0]?.length || 0;

      const isBoundary = (r: number, c: number) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return true;
        return grid[r][c] === "";
      };

      words.forEach((word) => {
        const upperWord = word.toUpperCase();

        // Horizontal placements
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col <= cols - word.length; col++) {
            let isSubstringMatch = true;
            for (let i = 0; i < word.length; i++) {
              if (grid[row][col + i] !== upperWord[i]) {
                isSubstringMatch = false;
                break;
              }
            }
            if (isSubstringMatch) {
              const isProperWord =
                isBoundary(row, col - 1) && isBoundary(row, col + word.length);
              if (isProperWord) {
                placements.push({
                  word: word.toLowerCase(),
                  startRow: row,
                  startCol: col,
                  direction: "horizontal",
                  isFound: false,
                });
              }
            }
          }
        }

        // Vertical placements
        for (let row = 0; row <= rows - word.length; row++) {
          for (let col = 0; col < cols; col++) {
            let isSubstringMatch = true;
            for (let i = 0; i < word.length; i++) {
              if (grid[row + i][col] !== upperWord[i]) {
                isSubstringMatch = false;
                break;
              }
            }
            if (isSubstringMatch) {
              const isProperWord =
                isBoundary(row - 1, col) && isBoundary(row + word.length, col);
              if (isProperWord) {
                placements.push({
                  word: word.toLowerCase(),
                  startRow: row,
                  startCol: col,
                  direction: "vertical",
                  isFound: false,
                });
              }
            }
          }
        }
      });
      return placements;
    },
    []
  );

  const getManualBonusWords = useCallback(
    (baseWord: string, excludeWords: string[]): string[] => {
      return [];
    },
    []
  );

  const init = useCallback(() => {
    initializeGameManager();
    setLoading(true);

    let success = false;
    let currentAttempts = 0;

    while (!success && currentAttempts < 5) {
      try {
        let levelDataToUse =
          levelData || generateLevelFromJSON(baseWord, difficulty);
        const availableWords = levelDataToUse.crosswordWords.map((w) =>
          w.toLowerCase()
        );
        const wordsForGrid = availableWords.slice(
          0,
          Math.min(availableWords.length, diff.minWords + 3)
        );

        if (wordsForGrid.length < 3) throw new Error("Not enough words");

        const grid = generateCrossword(wordsForGrid);
        if (grid) {
          const crosswordGrid = grid.map((row) =>
            row.map((cell) => cell || "")
          );
          const placements = extractWordPlacements(crosswordGrid, wordsForGrid);

          if (placements.length > 0) {
            const gameGrid = createGameGrid(crosswordGrid, placements);

            const numRows = gameGrid.length;
            const numCols = gameGrid[0].length;
            const sizeByWidth = GRID_AREA_WIDTH / numCols;
            const sizeByHeight = GRID_AREA_HEIGHT / numRows;
            const newCellSize = Math.min(sizeByWidth, sizeByHeight) - 2; // Subtract margin
            setCellSize(newCellSize);

            const bonusWords = generateBonusWords(
              levelDataToUse.baseWord,
              availableWords,
              difficulty
            );
            const manualBonusWords = getManualBonusWords(
              levelDataToUse.baseWord,
              availableWords
            );
            const allBonusWords = [
              ...new Set([...bonusWords, ...manualBonusWords]),
            ];
            const allWords = [...availableWords, ...allBonusWords];

            setLetters(levelDataToUse.letters.map((l) => l.toLowerCase()));
            setCrosswordWords(availableWords);
            setAllValidWords(allWords);
            setWordPlacements(placements);
            setGameGrid(gameGrid);
            success = true;
          }
        }
      } catch {
        setError("Failed to generate level. Please try again.");
      }
      currentAttempts++;
    }
    setLoading(false);
  }, [
    difficulty,
    baseWord,
    levelData,
    diff.minWords,
    extractWordPlacements,
    createGameGrid,
    getManualBonusWords,
  ]);

  useEffect(() => {
    init();
  }, [init]);

  // Debug: log incoming levelData once on mount
  useEffect(() => {
    if (levelData) {
      console.log("[INIT] GameScreen received levelData:", levelData);
      console.log(
        "[INIT] Letters length:",
        levelData.letters?.length,
        "Crossword words length:",
        levelData.crosswordWords?.length
      );
    }
  }, [levelData]);

  // Persist completion when it first toggles to true
  useEffect(() => {
    if (gameComplete && !gameCompleteRef.current) {
      gameCompleteRef.current = true;
      // Lazy import to avoid circular issues
      (async () => {
        const levelNumber = levelData?.level || 1;
        const category = categoryName || "Forest";

        // 1. Update legacy guest progress store (kept temporarily for UI relying on it)
        const guestMod = await import("@/hooks/guest-progress");
        const updated = await guestMod
          .completeLevelAndPersist({
            category,
            levelNumber,
            score,
            bonusWords: foundBonusWords.length,
            attempts: attempts + 1,
            levelDefs: undefined,
          })
          .catch((err) => {
            console.warn("Failed legacy persist", err);
            return null;
          });

        // 2. Mutate unified snapshot (offline-first) regardless of legacy success
        await upsertLocalLevel({
          user_id: (updated as any)?._snapshotUserId || "guest-temp", // will be remapped later if guest
          level: levelNumber,
          theme: category,
          stars: 0, // stars unknown here; could map from updated if needed
          completed: true,
          first_completed_at: new Date().toISOString(),
          last_completed_at: new Date().toISOString(),
        });
        // Add reward stats (simple estimate based on score + bonus words)
        await mutateLocalStats((stats) => {
          stats.xp +=
            Math.max(1, Math.floor(score / 20)) +
            Math.min(50, foundBonusWords.length * 5);
          stats.coin += 50; // placeholder reward
        });

        // 3. If we have guest progress updated, mirror to snapshot via helper (ensures stars etc.)
        if (updated) {
          updateGuestSnapshotFromProgress(updated).catch(() => {});
        }

        // 4. Attempt background sync if user authenticated
        try {
          // We can't use hook here; fetch current session via supabase directly
          const { supabase } = await import("@/lib/supabase");
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const uid = session?.user?.id;
          if (uid) {
            syncUser(uid).catch(() => {});
          }
        } catch (e) {
          console.warn("Post-completion sync attempt failed", e);
        }
      })();
    }
  }, [
    gameComplete,
    score,
    foundBonusWords.length,
    attempts,
    levelData,
    categoryName,
  ]);

  const renderFloatingParticles = () => (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {renderFloatingParticles()}
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Generating crossword...</Text>
      </View>
    );
  }

  // const handleBackPress = (): void => {
  //   router.back();
  // };

  return (
    <View style={styles.container} ref={containerRef}>
      {renderFloatingParticles()}

      <View
        style={[StyleSheet.absoluteFillObject, { zIndex: 1 }]}
        pointerEvents="none"
      >
        {animatingLetters.map(({ id, letter, position }) => (
          <Animated.View
            key={id}
            style={[
              styles.cell,
              styles.revealedCell,
              {
                width: cellSize,
                height: cellSize,
                position: "absolute",
                left: 0,
                top: 0,
                transform: position.getTranslateTransform(),
              },
            ]}
          >
            <Text
              style={[styles.revealedCellText, { fontSize: cellSize * 0.5 }]}
            >
              {letter}
            </Text>
          </Animated.View>
        ))}
      </View>

      {gameGrid ? (
        <>
          <View style={styles.levelHeader}>
            <TouchableOpacity
              onPress={() => onNavigate?.("levels")}
              style={styles.backButton}
            >
              <ChevronLeft size={16} color={"white"} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.levelTitleContainer}>
              <Animated.Text
                style={[
                  styles.scoreText,
                  {
                    transform: [{ scale: scoreScaleAnim }],
                  },
                ]}
              >
                Score: {score}
              </Animated.Text>
            </View>
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.grid}>
              {gameGrid.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {row.map((cell, colIndex) => {
                    if (!cell.isActive) {
                      return (
                        <View
                          key={colIndex}
                          style={[
                            styles.emptyCell,
                            { width: cellSize, height: cellSize },
                          ]}
                        />
                      );
                    }
                    // Animate the cell if it's the one revealed by hint
                    const isHinted =
                      hintAnim &&
                      hintAnim.row === rowIndex &&
                      hintAnim.col === colIndex;
                    const animatedStyle = isHinted
                      ? {
                          transform: [
                            {
                              scale: hintAnim.anim.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [1, 1.5, 1],
                              }),
                            },
                          ],
                          backgroundColor: hintAnim.anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [
                              styles.revealedCell.backgroundColor,
                              '#ffe066',
                            ],
                          }),
                        }
                      : {};
                    return (
                      <Animated.View
                        key={colIndex}
                        ref={(el) => {
                          if (el)
                            gridCellRefs.current[`${rowIndex}-${colIndex}`] =
                              el as View;
                        }}
                        style={[
                          styles.cell,
                          { width: cellSize, height: cellSize },
                          cell.isRevealed
                            ? styles.revealedCell
                            : styles.hiddenCell,
                          animatedStyle,
                        ]}
                      >
                        <Text
                          style={[
                            styles.cellText,
                            { fontSize: cellSize * 0.5 },
                            cell.isRevealed
                              ? styles.revealedCellText
                              : styles.hiddenCellText,
                          ]}
                        >
                          {cell.isRevealed ? cell.letter : ""}
                        </Text>
                      </Animated.View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          <View
            style={styles.wheelSection}
            ref={letterWheelRef}
            collapsable={false}
          >
            {letters.length > 0 ? (
              <LetterWheel
                letters={letters}
                onLetterSelect={handleLetterSelect}
                onWordComplete={handleWordComplete}
                validWords={[...crosswordWords, ...allValidWords]}
                foundWords={[...foundCrosswordWords, ...foundBonusWords]}
                onHint={handleWordHint}
                hintsLeft={hintsLeft}
              />
            ) : (
              <Text style={styles.errorText}>No letters available</Text>
            )}
          </View>
        </>
      ) : (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Modal
        transparent={true}
        animationType="fade"
        visible={gameComplete}
        onRequestClose={() => {
          setGameComplete(false);
        }}
      >
        <View style={styles.modalContainer}>
          <BlurView style={styles.absolute} intensity={80} tint="dark" />
          <View style={styles.animationContainer}>
            <Text style={styles.gameCompleteText}>LEVEL COMPLETED</Text>
            <LottieView
              source={require("../../assets/animations/level-complete.json")}
              autoPlay
              loop={false}
              style={styles.lottieAnimation}
            />
            <TouchableOpacity
              style={styles.nextLevelButton}
              onPress={() => onNavigate?.("levels")}
            >
              <Text style={styles.nextLevelButtonText}>Back to Levels</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
    backgroundColor: "#121213",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#121213",
  },
  loadingText: {
    marginTop: 10,
    color: "#AAA",
  },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  levelHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flex: 0,
    width: "100%",
  },
  levelTitleContainer: {
    // flex: 1,
    // alignItems: "center",
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00ff33ff",
    textAlign: "center",
  },
  gridContainer: {
    width: GRID_AREA_WIDTH,
    height: GRID_AREA_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  grid: {
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
  },
  emptyCell: {
    margin: 1,
  },
  cell: {
    margin: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  hiddenCell: {
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  revealedCell: {
    backgroundColor: "#8B5CF6",
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  cellText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  hiddenCellText: {
    color: "transparent",
  },
  revealedCellText: {
    color: "#fff",
  },
  wheelSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    minHeight: 200,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginVertical: 10,
    textAlign: "center",
  },
  // --- MODAL AND ANIMATION STYLES ---
  modalContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  animationContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  lottieAnimation: {
    width: 250,
    height: 250,
  },
  gameCompleteText: {
    color: "#ffffffff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  nextLevelButton: {
    marginTop: 15,
    backgroundColor: "#8B5CF6",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextLevelButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    paddingEnd: 16,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
