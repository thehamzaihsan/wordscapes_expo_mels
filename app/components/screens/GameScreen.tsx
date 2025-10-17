import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import LottieView from "lottie-react-native";
import { ChevronLeft, Volume2, VolumeX } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Difficulty } from "@/constants/difficulty";
import {
  completeLevelAndPersist,
  loadGuestProgress,
  type GuestProgressPayload,
} from "@/hooks/guest-progress";
import { updateGuestSnapshotFromProgress } from "@/lib/guestSnapshot";
import LetterWheel from "../game/inputWheel";
import { useGameLogic } from "../game/useGameLogic";
import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";

interface GameScreenProps {
  onNavigate?: (screen: string) => void;
  difficulty?: Difficulty;
  baseWord?: string;
  levelTitle?: string;
  categoryName?: string;
  levelData?: {
    level: number;
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
  const {
    // state
    gameGrid,
    letters,
    crosswordWords,
    allValidWords,
    foundCrosswordWords,
    foundBonusWords,
    loading,
    error,
    score,
    gameComplete,
    cellSize,
    hintsLeft,

<<<<<<< HEAD
  // --- MAIN STATE ---
  const [gameGrid, setGameGrid] = useState<GridCell[][] | null>(null);
  const [letters, setLetters] = useState<string[]>([]);
  const [sound, setSound] = useState(true);
  const [crosswordWords, setCrosswordWords] = useState<string[]>([]);
=======
    // refs
    // gameCompleteRef,
>>>>>>> ui-overhall

    // actions
    handleWordSubmit,
    handleWordHint,
    revealWordCells,
    // handleNextLevel,
  } = useGameLogic({
    difficulty,
    baseWord,
    levelData,
    categoryName,
    onNavigate,
  });

  // --- Sound toggle (persisted) ---
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem("@game_sound_enabled");
        if (v != null) setSoundEnabled(JSON.parse(v));
      } catch {}
    })();
  }, []);
  const toggleSound = useCallback(async () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      await AsyncStorage.setItem("@game_sound_enabled", JSON.stringify(next));
    } catch {}
  }, [soundEnabled]);

  // Preload sounds
  const correctSoundRef = useRef<Audio.Sound | null>(null);
  const bonusSoundRef = useRef<Audio.Sound | null>(null);
  const wrongSoundRef = useRef<Audio.Sound | null>(null);
  const completeSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [correct, bonus, wrong, complete] = await Promise.all([
          Audio.Sound.createAsync(
            require("../../../assets/sounds/correct-word.mp3"),
            { volume: 0.7 }
          ),
          Audio.Sound.createAsync(
            require("../../../assets/sounds/bonus-word.mp3"),
            { volume: 0.7 }
          ),
          Audio.Sound.createAsync(
            require("../../../assets/sounds/wrong-word.mp3"),
            { volume: 0.6 }
          ),
          Audio.Sound.createAsync(
            require("../../../assets/sounds/level-complete.mp3"),
            { volume: 0.8 }
          ),
        ]);
        if (!mounted) return;
        correctSoundRef.current = correct.sound;
        bonusSoundRef.current = bonus.sound;
        wrongSoundRef.current = wrong.sound;
        completeSoundRef.current = complete.sound;
      } catch {}
    })();
    return () => {
      mounted = false;
      correctSoundRef.current?.unloadAsync();
      bonusSoundRef.current?.unloadAsync();
      wrongSoundRef.current?.unloadAsync();
      completeSoundRef.current?.unloadAsync();
    };
  }, []);

<<<<<<< HEAD
  // Save sound preference when it changes
  const handleSoundToggle = useCallback(async () => {
    const newSoundValue = !sound;
    setSound(newSoundValue);
    try {
      await AsyncStorage.setItem('@game_sound_enabled', JSON.stringify(newSoundValue));
    } catch (error) {
      console.warn('Failed to save sound preference:', error);
    }
  }, [sound]);
  
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

  // --- SOUND STATES (REFACTORED) ---
  const [sounds, setSounds] = useState<{ [key: string]: Audio.Sound | null }>({
    rightWordSound: null,
    wrongWordSound: null,
    bonusWordSound: null,
    levelCompleteSound: null,
  });
  const isUnmounting = useRef(false);

  const diff = getDifficultyConfig(difficulty);

  // --- LOAD AND UNLOAD SOUNDS (REFACTORED) ---
  useEffect(() => {
    isUnmounting.current = false;
    let mounted = true;

    const loadSounds = async () => {
      try {
        const [rightRes, wrongRes, bonusRes, levelRes] = await Promise.all([
          Audio.Sound.createAsync(
            require("../../../assets/sounds/correct-word.mp3")
          ),
          Audio.Sound.createAsync(
            require("../../../assets/sounds/wrong-word.mp3")
          ),
          Audio.Sound.createAsync(
            require("../../../assets/sounds/bonus-word.mp3")
          ),
          Audio.Sound.createAsync(
            require("../../../assets/sounds/level-complete.mp3")
          ),
        ]);

        if (mounted) {
          setSounds({
            rightWordSound: rightRes.sound,
            wrongWordSound: wrongRes.sound,
            bonusWordSound: bonusRes.sound,
            levelCompleteSound: levelRes.sound,
          });
        }
      } catch (error) {
        console.error("Failed to load sounds", error);
      }
    };

    loadSounds();

    return () => {
      mounted = false;
      isUnmounting.current = true; // Signal that the component is unmounting
      // Unload all sounds
      for (const soundKey in sounds) {
        if (sounds[soundKey]) {
          sounds[soundKey]?.unloadAsync();
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty deps so we don't recreate/unload repeatedly

  // Helper function to play sounds (FIXED WITH CALLBACK)
  const playSound = useCallback(async (soundObject: Audio.Sound | null) => {
    if (!sound) return; // Use the sound state variable
    
    // Prevent playing sound if the component is unmounting
    if (isUnmounting.current) {
      return;
    }
    try {
      if (soundObject) {
        await soundObject.replayAsync();
      }
    } catch (e) {
      // This error might still happen in a rare edge case, but the check above should prevent most cases.
      if (!e.message.includes("Player is not loaded")) {
        console.error("Failed to play sound", e);
      }
    }
  }, [sound]); // Add sound as dependency

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
=======
  // --- Flying letter animation setup ---
  type AnimatingLetter = {
    id: string;
    letter: string;
    position: Animated.ValueXY;
  };
  const [animatingLetters, setAnimatingLetters] = useState<AnimatingLetter[]>(
>>>>>>> ui-overhall
    []
  );
  const gridCellRefs = useRef<Record<string, View | null>>({});
  const letterWheelRef = useRef<View>(null);
  const containerRef = useRef<View>(null);

  const measure = (ref: View) =>
    new Promise<{ px: number; py: number; width: number; height: number }>(
      (resolve) => {
        ref.measure((x, y, width, height, px, py) =>
          resolve({ px, py, width, height })
        );
      }
    );

  const startFloatingAnimation = useCallback(
    (word: string) =>
      new Promise<void>(async (resolve) => {
        if (!containerRef.current || !letterWheelRef.current) {
          resolve();
          return;
        }
        const containerBox = await measure(containerRef.current);
        const wheelBox = await measure(letterWheelRef.current);
        const startX = wheelBox.px + wheelBox.width / 2 - containerBox.px;
        const startY = wheelBox.py + wheelBox.height / 2 - containerBox.py;

        const upper = word.toUpperCase();
        const targets: { r: number; c: number }[] = [];
        if (gameGrid && gameGrid.length) {
          const rows = gameGrid.length;
          const cols = gameGrid[0].length;
          // Horizontal scan first
          outer: for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols - upper.length; c++) {
              let ok = true;
              for (let i = 0; i < upper.length; i++) {
                const cell = gameGrid[r][c + i];
                if (!cell?.isActive || cell.letter !== upper[i]) {
                  ok = false;
                  break;
                }
              }
              if (ok) {
                for (let i = 0; i < upper.length; i++)
                  targets.push({ r, c: c + i });
                break outer;
              }
            }
          }
          // If not found horizontally, try vertical
          if (targets.length === 0) {
            outer2: for (let r = 0; r <= rows - upper.length; r++) {
              for (let c = 0; c < cols; c++) {
                let ok = true;
                for (let i = 0; i < upper.length; i++) {
                  const cell = gameGrid[r + i][c];
                  if (!cell?.isActive || cell.letter !== upper[i]) {
                    ok = false;
                    break;
                  }
                }
                if (ok) {
                  for (let i = 0; i < upper.length; i++)
                    targets.push({ r: r + i, c });
                  break outer2;
                }
              }
            }
          }
        }

        if (targets.length === 0) {
          resolve();
          return;
        }

        const letters: AnimatingLetter[] = [];
        const animations: Animated.CompositeAnimation[] = [];
        for (let i = 0; i < upper.length; i++) {
          const t = targets[i];
          const key = `${t.r}-${t.c}`;
          const cellRef = gridCellRefs.current[key];
          if (!cellRef) continue;
          const cellBox = await measure(cellRef);
          const endX = cellBox.px - containerBox.px;
          const endY = cellBox.py - containerBox.py;
          const item: AnimatingLetter = {
            id: `${upper}-${i}`,
            letter: upper[i],
            position: new Animated.ValueXY({ x: startX, y: startY }),
          };
          letters.push(item);
          animations.push(
            Animated.timing(item.position, {
              toValue: { x: endX, y: endY },
              duration: 550,
              useNativeDriver: false,
            })
          );
        }
<<<<<<< HEAD
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
        await playSound(sounds.wrongWordSound);
        return;
      }

      if (crosswordWords.includes(normalizedWord)) {
        await playSound(sounds.rightWordSound);
        setFoundCrosswordWords((prev) => [...prev, normalizedWord]);
        const points = normalizedWord.length * 100;
        setScore((prev) => prev + points);

        startFloatingLetterAnimation(normalizedWord);

        if (foundCrosswordWords.length + 1 === crosswordWords.length) {
          setGameComplete(true);
          setTimeout(() => {
            playSound(sounds.levelCompleteSound);
          }, 1000);
        }
      } else {
        const isValidBonus = allValidWords.some(
          (w) => w.toLowerCase() === normalizedWord
        );
        if (isValidBonus) {
          await playSound(sounds.bonusWordSound);
          setFoundBonusWords((prev) => [...prev, normalizedWord]);
          const points = normalizedWord.length * 10;
          setScore((prev) => prev + points);
        } else {
          await playSound(sounds.wrongWordSound);
        }
      }
    },
    [
      crosswordWords,
      foundCrosswordWords,
      foundBonusWords,
      allValidWords,
      startFloatingLetterAnimation,
      sounds, // Depend on the sounds object
      playSound, // Add playSound dependency
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

        // Check if this is a first completion before updating progress
        const guestMod = await import("@/hooks/guest-progress");
        const levelProgress = await guestMod.loadGuestProgress();
        const categoryLevels = levelProgress?.categories[category];
        const currentLevel = categoryLevels?.find(l => l.level === levelNumber);
        const isFirstCompletion = !currentLevel?.isCompleted;

        // 1. Update legacy guest progress store (kept temporarily for UI relying on it)
        const updated = await guestMod
          .completeLevelAndPersist({
            category,
            levelNumber,
            score,
            bonusWords: foundBonusWords.length,
            crosswordWords: foundCrosswordWords.length, // Add crossword words count
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
          completed: true,
          first_completed_at: new Date().toISOString(),
          last_completed_at: new Date().toISOString(),
=======
        if (!letters.length) {
          resolve();
          return;
        }
        setAnimatingLetters(letters);
        Animated.stagger(90, animations).start(() => {
          setAnimatingLetters([]);
          resolve();
>>>>>>> ui-overhall
        });
      }),
    [gameGrid]
  );

  // Persist completion exactly once per level clear
  const persistedRef = useRef(false);
  useEffect(() => {
    if (!gameComplete || persistedRef.current) return;
    persistedRef.current = true;
    (async () => {
      const levelNumber = levelData?.level || 1;
      const category = categoryName || "Mountain";
      const crosswordCount = crosswordWords.length;
      const bonusCount = foundBonusWords.length;
      console.info("[COMPLETE] Persisting rewards", {
        category,
        levelNumber,
        bonusWords: bonusCount,
        crosswordWords: crosswordCount,
      });

      const prev = await loadGuestProgress();
      const prevMeta = prev?.meta;
      const prevCompleted = prev?.categories?.[category]?.find(
        (l) => l.level === levelNumber
      )?.isCompleted;

      const updated: GuestProgressPayload | null =
        await completeLevelAndPersist({
          category,
          levelNumber,
          score,
          bonusWords: bonusCount,
          crosswordWords: crosswordCount,
          attempts: 1,
          levelDefs: undefined,
        }).catch((e) => {
          console.warn("[COMPLETE] failed to save guest progress", e);
          return null;
        });

      if (updated) {
        console.info("[COMPLETE] Saved guest progress", {
          gemsBefore: prevMeta?.gems,
          gemsAfter: updated.meta.gems,
          xpBefore: prevMeta?.xp,
          xpAfter: updated.meta.xp,
          wasFirstCompletion: !prevCompleted,
        });
        try {
          await updateGuestSnapshotFromProgress(updated);
        } catch {}
      }
    })();
  }, [
    gameComplete,
    levelData?.level,
    categoryName,
    crosswordWords.length,
    foundBonusWords.length,
    score,
  ]);

<<<<<<< HEAD
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Generating crossword...</Text>
      </View>
    );
  }

  // const handleBackPress = (): void => {
  //   router.back();
  // };

=======
>>>>>>> ui-overhall
  return (
    <View style={styles.container} ref={containerRef}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onNavigate?.("levels")}
          style={styles.backButton}
        >
          <ChevronLeft size={16} color="#22C55E" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Text style={styles.score}>Score: {score}</Text>
          <TouchableOpacity onPress={toggleSound} style={styles.soundToggle}>
            {soundEnabled ? (
              <Volume2 size={18} color="#111827" />
            ) : (
              <VolumeX size={18} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <Text style={styles.infoText}>Loading…</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : !gameGrid ? (
        <Text style={styles.infoText}>No grid</Text>
      ) : (
        <>
          {/* Floating letters overlay */}
          {animatingLetters.length > 0 && (
            <View 
              style={[
                StyleSheet.absoluteFill, 
                { zIndex: 1000, elevation: 1000 }
              ]} 
              pointerEvents="none"
            >
<<<<<<< HEAD
              <ChevronLeft size={16} color={"white"} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.levelTitleContainer}>
              <View style={styles.scoreContainer}>
                <Animated.Text
=======
              {animatingLetters.map((it) => (
                <Animated.View
                  key={it.id}
>>>>>>> ui-overhall
                  style={[
                    styles.cell,
                    styles.revealedCell,
                    {
                      position: "absolute",
                      width: cellSize,
                      height: cellSize,
                      zIndex: 1001,
                      elevation: 1001,
                      transform: it.position.getTranslateTransform(),
                    },
                  ]}
                >
<<<<<<< HEAD
                  Score: {score}
                </Animated.Text>
                
                <TouchableOpacity
                  onPress={handleSoundToggle}
                  style={styles.soundToggleButton}
                  activeOpacity={0.7}
                >
                  {sound ? (
                    <Volume2 size={20} color="#8B5CF6" />
                  ) : (
                    <VolumeX size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
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
=======
                  <Text
                    style={[styles.revealedText, { fontSize: cellSize * 0.5 }]}
                  >
                    {it.letter}
                  </Text>
                </Animated.View>
>>>>>>> ui-overhall
              ))}
            </View>
          )}
          <View style={styles.gridContainer}>
            {gameGrid.map((row, r) => (
              <View key={r} style={styles.row}>
                {row.map((cell, c) => (
                  <View
                    key={`${r}-${c}`}
                    ref={(el) => {
                      if (el) gridCellRefs.current[`${r}-${c}`] = el;
                    }}
                    style={[
                      styles.cell,
                      { width: cellSize, height: cellSize },
                      cell.isActive
                        ? cell.isRevealed
                          ? styles.revealedCell
                          : styles.hiddenCell
                        : styles.emptyCell,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        { fontSize: cellSize * 0.5 },
                        cell.isRevealed
                          ? styles.revealedText
                          : styles.hiddenText,
                      ]}
                    >
                      {cell.isRevealed ? cell.letter : ""}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.wheel} ref={letterWheelRef} collapsable={false}>
            {letters.length ? (
              <LetterWheel
                letters={letters}
                onLetterSelect={() => {}}
                onWordComplete={async (w) => {
                  const result = await handleWordSubmit(w, {
                    deferReveal: true,
                  });
                  try {
                    if (result?.success) {
                      if (result.type === "crossword") {
                        if (soundEnabled)
                          await correctSoundRef.current?.replayAsync();
                        // Fire floating animation toward target cells
                        await startFloatingAnimation(w);
                        revealWordCells(w);
                      } else if (result.type === "bonus") {
                        if (soundEnabled)
                          await bonusSoundRef.current?.replayAsync();
                      }
                    } else {
                      if (soundEnabled)
                        await wrongSoundRef.current?.replayAsync();
                    }
                  } catch {}
                }}
                validWords={allValidWords}
                foundWords={[...foundCrosswordWords, ...foundBonusWords]}
                onHint={handleWordHint}
                hintsLeft={hintsLeft}
                canUsePaidHints={true}
              />
            ) : (
              <Text style={styles.infoText}>No letters</Text>
            )}
          </View>
        </>
      )}

<<<<<<< HEAD
      <Modal
        transparent={true}
        animationType="fade"
        visible={gameComplete}
        onRequestClose={() => {
          setGameComplete(false);
        }}
      >
=======
      <Modal transparent visible={gameComplete} onRequestClose={() => {}}>
>>>>>>> ui-overhall
        <View style={styles.modalContainer}>
          <ThemedCard style={styles.modalCard} variant="glassStrong" padding="lg">
            <ThemedText >LEVEL COMPLETED</ThemedText>
            <LottieView
              source={require("../../../assets/animations/level-complete.json")}
              autoPlay
              loop={false}
<<<<<<< HEAD
              style={styles.lottieAnimation}
            />
            <TouchableOpacity
              style={styles.nextLevelButton}
              onPress={() => onNavigate?.("levels")}
=======
              style={{ width: 200, height: 200 }}
            />
            {/* Play complete sound once when modal opens */}
            {gameComplete && (
              <View style={{ height: 0, width: 0 }}>
                {/* Trigger on open */}
                {(() => {
                  if (soundEnabled)
                    completeSoundRef.current?.replayAsync().catch(() => {});
                  return null;
                })()}
              </View>
            )}
            <ThemedButton
              variant="primary"
              title="Back to Levels"
              style={styles.nextButton}
              onPress={() => {
                onNavigate?.("levels");
              }}
>>>>>>> ui-overhall
            >
            </ThemedButton>
          </ThemedCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
    // backgroundColor: "#121213",
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
  levelHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flex: 0,
=======
  container: { flex: 1, padding: 16, alignItems: "center" },
  header: {
>>>>>>> ui-overhall
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
<<<<<<< HEAD
    gap: 12,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00ff33ff",
    textAlign: "center",
  },
  soundToggleButton: {
    padding: 8,
    backgroundColor: "rgba(55,65,81,0.8)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
=======
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  backButton: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },
  backButtonText: { color: "#22C55E", fontWeight: "600" },
  score: { fontSize: 18, fontWeight: "bold", color: "#22C55E" },
  soundToggle: {
    marginLeft: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
>>>>>>> ui-overhall
  },
  infoText: { color: "#6B7280" },
  errorText: { color: "red" },
  gridContainer: { marginTop: 8 },
  row: { flexDirection: "row" },
  cell: {
    margin: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    width: 40,
    height: 40,
  },
  emptyCell: { backgroundColor: "transparent" },
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
  cellText: { fontWeight: "bold" },
  hiddenText: { color: "transparent" },
  revealedText: { color: "#fff" },
  wheel: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "80%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
<<<<<<< HEAD
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
=======
  nextButton: {
    marginTop: 12,
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  nextButtonText: { color: "#fff", fontWeight: "bold" },
});
>>>>>>> ui-overhall
