import LetterWheel from "../game/inputWheel";
// import { router } from "@/.expo/types/router";
import { Difficulty, getDifficultyConfig } from "@/constants/difficulty";
import economy from "@/constants/economy.json";
import { generateCrossword } from "@/hooks/crossword-gen";
import {
  generateBonusWords,
  generateLevelFromJSON,
  initializeGameManager,
} from "@/hooks/game-manager";
import {
  loadGuestProgress,
  purchaseHints,
  useHint,
  type GuestProgressPayload
} from "@/hooks/guest-progress";
import { updateGuestSnapshotFromProgress } from "@/lib/guestSnapshot";
import { mutateLocalStats, syncUser, upsertLocalLevel } from "@/lib/sync";
import { Audio } from "expo-av";
import { BlurView } from "expo-blur";
import LottieView from "lottie-react-native";
import { ChevronLeft, Volume2, VolumeX } from "lucide-react-native";

import AsyncStorage from '@react-native-async-storage/async-storage';
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

  // --- MAIN STATE AND REFS ---
  const [gameGrid, setGameGrid] = useState<GridCell[][] | null>(null);
  const [letters, setLetters] = useState<string[]>([]);
  const [sound, setSound] = useState(true);
  const [crosswordWords, setCrosswordWords] = useState<string[]>([]);
  const [guestProgress, setGuestProgress] = useState<GuestProgressPayload | null>(null);

  // Load guest progress on component mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const progress = await loadGuestProgress();
        setGuestProgress(progress);
      } catch (error) {
        console.warn('Failed to load guest progress:', error);
      }
    };
    loadProgress();
  }, []);

  // Load sound preference on component mount
  useEffect(() => {
    const loadSoundPreference = async () => {
      try {
        const savedSound = await AsyncStorage.getItem('@game_sound_enabled');
        if (savedSound !== null) {
          setSound(JSON.parse(savedSound));
        }
      } catch (error) {
        console.warn('Failed to load sound preference:', error);
      }
    };
    console.log("Value of Sound on initial load:", sound);
    loadSoundPreference();
  }, []);

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
  const [purchasingHints, setPurchasingHints] = useState(false);
  const [showHintPurchaseModal, setShowHintPurchaseModal] = useState(false);

  // Get available hints from guest progress
  const availableHints = guestProgress?.meta.hints || 0;

  // Handle word hint from LetterWheel
  const handleWordHint = useCallback(async (hintedWord: string) => {
    if (availableHints <= 0) {
      // Show modal to purchase hints
      setShowHintPurchaseModal(true);
      return;
    }
    
    try {
      // Use a hint and update progress
      const updatedProgress = await useHint();
      if (updatedProgress) {
        setGuestProgress(updatedProgress);
      }
      
      // Could add visual feedback here if needed
      console.log(`Hint used for word: ${hintedWord}`);
    } catch (error) {
      console.error('Failed to use hint:', error);
    }
  }, [availableHints]);

  // Handle hint purchase
  const handlePurchaseHints = useCallback(async () => {
    if (purchasingHints) return;
    
    setPurchasingHints(true);
    try {
      const updatedProgress = await purchaseHints();
      if (updatedProgress) {
        setGuestProgress(updatedProgress);
        setShowHintPurchaseModal(false);
      }
    } catch (error) {
      console.error('Failed to purchase hints:', error);
      // Show error message to user
    } finally {
      setPurchasingHints(false);
    }
  }, [purchasingHints]);

  // --- SOUND STATES (REFACTORED) ---
  const [sounds, setSounds] = useState<{ [key: string]: Audio.Sound | null }>({
    rightWordSound: null,
    wrongWordSound: null,
    bonusWordSound: null,
    levelCompleteSound: null,
  });
  const isUnmounting = useRef(false);

  const diff = getDifficultyConfig(difficulty);

  // --- LOAD AND UNLOAD SOUNDS ---
  useEffect(() => {
    let isMounted = true;
    isUnmounting.current = false;

    // Initialize Audio Session
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.warn('Failed to configure audio mode:', error);
      }
    };

    // Function to safely unload a sound
    const unloadSound = async (sound: Audio.Sound | null) => {
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.unloadAsync();
          }
        } catch (e) {
          console.warn('Error unloading sound:', e);
        }
      }
    };

    // Function to safely unload all sounds
    const unloadAllSounds = async () => {
      await Promise.all(Object.values(sounds).map(unloadSound));
      if (isMounted) {
        setSounds({
          rightWordSound: null,
          wrongWordSound: null,
          bonusWordSound: null,
          levelCompleteSound: null,
        });
      }
    };

    const loadSounds = async () => {
      // First, unload any existing sounds
      await unloadAllSounds();

      // If sound is disabled, we're done
      if (!sound) return;

      try {
        await initAudio();

        // Create all sounds with error handling for each
        const loadSound = async (path: number): Promise<Audio.Sound | null> => {
          try {
            const { sound } = await Audio.Sound.createAsync(path, { shouldPlay: false });
            return sound;
          } catch (error) {
            console.error(`Failed to load sound:`, error);
            return null;
          }
        };

        const [rightRes, wrongRes, bonusRes, levelRes] = await Promise.all([
          loadSound(require("../../../assets/sounds/correct-word.mp3")),
          loadSound(require("../../../assets/sounds/wrong-word.mp3")),
          loadSound(require("../../../assets/sounds/bonus-word.mp3")),
          loadSound(require("../../../assets/sounds/level-complete.mp3")),
        ]);

        // Set sounds only if still mounted and enabled
        if (isMounted && !isUnmounting.current && sound) {
          setSounds({
            rightWordSound: rightRes,
            wrongWordSound: wrongRes,
            bonusWordSound: bonusRes,
            levelCompleteSound: levelRes,
          });
        } else {
          // Clean up if unmounted or sound disabled
          await Promise.all([
            unloadSound(rightRes),
            unloadSound(wrongRes),
            unloadSound(bonusRes),
            unloadSound(levelRes),
          ]);
        }
      } catch (error) {
        console.error("Failed to load sounds:", error);
        if (isMounted && !isUnmounting.current) {
          setSounds({
            rightWordSound: null,
            wrongWordSound: null,
            bonusWordSound: null,
            levelCompleteSound: null,
          });
        }
      }
    };

    // Initialize sounds
    loadSounds();

    return () => {
      isMounted = false;
      isUnmounting.current = true;
      unloadAllSounds();
    };
  }, [sound]); // Re-run when sound preference changes

  // Helper function to play sounds with retries
  const playSound = useCallback(async (soundObject: Audio.Sound | null, maxRetries = 2) => {
    if (!sound || !soundObject || isUnmounting.current) return;

    const attemptPlay = async (retries: number): Promise<void> => {
      try {
        const status = await soundObject.getStatusAsync();
        
        if (!status.isLoaded) {
          throw new Error('Sound not loaded');
        }

        // Ensure sound is at the beginning
        await soundObject.setPositionAsync(0);
        await soundObject.playAsync();
      } catch (error) {
        if (retries > 0 && !isUnmounting.current) {
          // Wait a short time before retrying
          await new Promise(resolve => setTimeout(resolve, 100));
          return attemptPlay(retries - 1);
        }
        
        if (error instanceof Error) {
          // Only log non-"Player not loaded" errors
          if (!error.message.includes("Player is not loaded") && 
              !error.message.includes("Player does not exist")) {
            console.error("Failed to play sound:", error);
          }
        } else {
          console.error("Unknown sound playback error:", error);
        }
      }
    };

    await attemptPlay(maxRetries);
  }, [sound, isUnmounting]);

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
        await playSound(sounds.wrongWordSound);
        return;
      }

      if (crosswordWords.includes(normalizedWord)) {
        // Check if this is the final word
        const isLastWord = foundCrosswordWords.length + 1 === crosswordWords.length;
        
        // Only play right word sound if it's not the last word
        if (!isLastWord) {
          await playSound(sounds.rightWordSound);
        }

        setFoundCrosswordWords((prev) => [...prev, normalizedWord]);
        const points = normalizedWord.length * 100;
        setScore((prev) => prev + points);

        startFloatingLetterAnimation(normalizedWord);

        // If this is the last word, play completion sound and show animation
        if (isLastWord) {
          await playSound(sounds.levelCompleteSound);
          setGameComplete(true);
          gameCompleteRef.current = true; // Set ref to track completion state
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
        });
        
        // Add reward stats (XP only - gems are handled by guest progress system)
        // Only reward XP if this is a first completion
        if (isFirstCompletion) {
          await mutateLocalStats((stats) => {
            // Dynamic XP calculation using economy config
            stats.xp += foundCrosswordWords.length * economy.xp.gainPerWord; // XP per crossword word found
            stats.xp += foundBonusWords.length * economy.xp.gainPerBonusWord; // XP per bonus word found
            // Note: Gems are rewarded through the guest progress system to avoid double-rewarding
          });
        }

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

  // Loading state is now handled by the LoadingScreen component

  // const handleBackPress = (): void => {
  //   router.back();
  // };

  return (
    <View style={styles.container} ref={containerRef}>
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
              <ChevronLeft size={16} color={"#22C55E"} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.levelTitleContainer}>
              <View style={styles.scoreContainer}>
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
                
                <View style={styles.hintsContainer}>
                  <Text style={styles.hintsText}>💡 {availableHints}</Text>
                </View>
                
                <TouchableOpacity
                  onPress={handleSoundToggle}
                  style={styles.soundToggleButton}
                  activeOpacity={0.7}
                >
                  {sound ? (
                    <Volume2 size={20} color="#000000ff" />
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
                hintsLeft={availableHints}
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
          if (gameCompleteRef.current) {
            setGameComplete(false);
          }
        }}
      >
        <View style={styles.modalContainer}>
          <BlurView style={styles.absolute} intensity={80} tint="dark" />
          <View style={styles.animationContainer}>
            <Text style={styles.gameCompleteText}>LEVEL COMPLETED</Text>
            <LottieView
              key={gameComplete ? 'visible' : 'hidden'} // Force remount when showing
              source={require("../../../assets/animations/level-complete.json")}
              autoPlay
              loop={false}
              speed={1.0}
              style={styles.lottieAnimation}
              onAnimationFinish={() => {
                // Animation has completed playing
                gameCompleteRef.current = true;
              }}
            />
            <TouchableOpacity
              style={styles.nextLevelButton}
              onPress={() => {
                setGameComplete(false);
                gameCompleteRef.current = false;
                onNavigate?.("levels");
              }}
            >
              <Text style={styles.nextLevelButtonText}>Back to Levels</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hint Purchase Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={showHintPurchaseModal}
        onRequestClose={() => setShowHintPurchaseModal(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView style={styles.absolute} intensity={80} tint="dark" />
          <View style={styles.hintPurchaseContainer}>
            <Text style={styles.hintPurchaseTitle}>Need Hints?</Text>
            <Text style={styles.hintPurchaseText}>
              Get 3 hints for 100 💎 gems
            </Text>
            <Text style={styles.hintPurchaseSubtext}>
              Available gems: {guestProgress?.meta.gems || 0} 💎
            </Text>
            
            <View style={styles.hintPurchaseButtons}>
              <TouchableOpacity
                style={[styles.hintButton, styles.cancelButton]}
                onPress={() => setShowHintPurchaseModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.hintButton, 
                  styles.purchaseButton,
                  (guestProgress?.meta.gems || 0) < 100 && styles.disabledButton
                ]}
                onPress={handlePurchaseHints}
                disabled={purchasingHints || (guestProgress?.meta.gems || 0) < 100}
              >
                {purchasingHints ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.purchaseButtonText}>
                    {(guestProgress?.meta.gems || 0) < 100 ? 'Not enough gems' : 'Purchase'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  animationContainer: {
    width: '80%',
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gameCompleteText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  nextLevelButton: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: '#8B5CF6',
    borderRadius: 25,
    elevation: 3,
  },
  nextLevelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    alignItems: "center",
    justifyContent: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(229, 231, 235, 0.9)", // Light grey background
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#22C55E", // Changed to match the green theme
    textAlign: "center",
  },
  hintsContainer: {
    backgroundColor: "rgba(229, 231, 235, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  hintsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B5CF6",
    textAlign: "center",
  },
  soundToggleButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#c6c6c6ff",
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
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#16A34A",
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(229, 231, 235, 0.9)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  backButtonText: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "600",
  },
  // --- HINT PURCHASE MODAL STYLES ---
  hintPurchaseContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginHorizontal: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  hintPurchaseTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 10,
  },
  hintPurchaseText: {
    fontSize: 18,
    color: "#374151",
    textAlign: "center",
    marginBottom: 10,
  },
  hintPurchaseSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 25,
  },
  hintPurchaseButtons: {
    flexDirection: "row",
    gap: 15,
  },
  hintButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  purchaseButton: {
    backgroundColor: "#22C55E",
  },
  purchaseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
  },
});