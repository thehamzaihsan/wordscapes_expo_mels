import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, View } from 'react-native';
import { Difficulty, getDifficultyConfig } from "@/constants/difficulty";
import economy from "@/constants/economy.json";
import {
  generateBonusWords,
  generateCrosswordLevelWithBaseword,
  generateLevelFromJSON,
  initializeGameManager,
} from "@/hooks/game-manager";
import { updateGuestSnapshotFromProgress } from "@/lib/guestSnapshot";
import { mutateLocalStats, syncUser, upsertLocalLevel } from "@/lib/sync";

interface GridCell {
  letter: string | null;
  isRevealed: boolean;
  isActive: boolean;
  belongsToWords: string[];
}

interface WordPlacement {
  word: string;
  startRow: number;
  startCol: number;
  direction: "horizontal" | "vertical";
  isFound: boolean;
}

interface AnimatingLetter {
  id: string;
  letter: string;
  position: Animated.ValueXY;
}

interface UseGameLogicProps {
  difficulty: Difficulty;
  baseWord?: string;
  levelData?: {
    level: number;
    baseWord: string;
    letters: string[];
    crosswordWords: string[];
    difficulty: Difficulty;
  };
  categoryName?: string;
  onNavigate?: (screen: string) => void;
}

export function useGameLogic({
  difficulty,
  baseWord,
  levelData,
  categoryName,
  onNavigate,
}: UseGameLogicProps) {
  // Core game state
  const [gameGrid, setGameGrid] = useState<GridCell[][] | null>(null);
  const [letters, setLetters] = useState<string[]>([]);
  const [crosswordWords, setCrosswordWords] = useState<string[]>([]);
  const [allValidWords, setAllValidWords] = useState<string[]>([]);
  const [wordPlacements, setWordPlacements] = useState<WordPlacement[]>([]);
  const [foundCrosswordWords, setFoundCrosswordWords] = useState<string[]>([]);
  const [foundBonusWords, setFoundBonusWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [animatingLetters, setAnimatingLetters] = useState<AnimatingLetter[]>([]);
  const [cellSize, setCellSize] = useState(40);

  // Hint state
  const [hintAnim, setHintAnim] = useState<
    | { row: number; col: number; anim: Animated.Value }
    | null
  >(null);
  const [hintsLeft, setHintsLeft] = useState(1);
  const [hintedWords, setHintedWords] = useState<string[]>([]);

  // Refs
  const gameCompleteRef = useRef(false);
  const gridCellRefs = useRef<{ [key: string]: View }>({});
  const letterWheelRef = useRef<View>(null);
  const containerRef = useRef<View>(null);
  const scoreScaleAnim = useRef(new Animated.Value(1)).current;

  const diff = getDifficultyConfig(difficulty);

  // Initialize game
  useEffect(() => {
    const initGame = async () => {
      try {
        setLoading(true);
        setError("");

        const { width } = Dimensions.get("window");
        const gridWidth = width * 0.9;
        const maxCellSize = 50;
        const minCellSize = 25;

        let level;
        if (levelData) {
          level = {
            baseWord: levelData.baseWord,
            letters: levelData.letters,
            crosswordWords: levelData.crosswordWords,
            difficulty: levelData.difficulty,
            wordCount: levelData.crosswordWords.length
          };
        } else {
          level = generateCrosswordLevelWithBaseword(baseWord || "planet", { difficulty });
        }

        // Create a compact grid that only shows the base word
        const baseWordLength = level.baseWord.length;
        
        // Set a reasonable default cell size
        const defaultCellSize = 45;
        setCellSize(defaultCellSize);

        // Create a minimal 1-row grid with just the base word
        const grid = [
          Array.from({ length: baseWordLength }, (_, i) => ({
            letter: level.baseWord[i].toUpperCase(),
            isRevealed: false,
            isActive: false,
            belongsToWords: [level.baseWord]
          }))
        ];
        
        setGameGrid(grid);
        setWordPlacements([{
          word: level.baseWord.toUpperCase(),
          startRow: 0,
          startCol: 0,
          direction: "horizontal" as const,
          isFound: false
        }]);
        setCrosswordWords(level.crosswordWords);

        const gameLetters = levelData?.letters || level.letters;
        setLetters(gameLetters);

        const bonusWords = generateBonusWords(level.baseWord, level.crosswordWords, difficulty);
        setAllValidWords([...level.crosswordWords, ...bonusWords]);

        console.log("Game initialized successfully");
      } catch (err) {
        console.error("Game initialization error:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize game");
      } finally {
        setLoading(false);
      }
    };

    initGame();
  }, [baseWord, difficulty, levelData]);

  // Handle word submission
  const handleWordSubmit = useCallback(async (word: string) => {
    const upperWord = word.toUpperCase();
    
    if (foundCrosswordWords.includes(upperWord) || foundBonusWords.includes(upperWord)) {
      return { success: false, type: 'duplicate' as const };
    }

    if (crosswordWords.map(w => w.toUpperCase()).includes(upperWord)) {
      // Handle crossword word found
      setFoundCrosswordWords(prev => [...prev, upperWord]);
      
      const placement = wordPlacements.find(p => p.word.toUpperCase() === upperWord);
      if (placement && gameGrid) {
        const newGrid = [...gameGrid];
        
        if (placement.direction === "horizontal") {
          for (let i = 0; i < placement.word.length; i++) {
            const col = placement.startCol + i;
            if (newGrid[placement.startRow] && newGrid[placement.startRow][col]) {
              newGrid[placement.startRow][col].isRevealed = true;
            }
          }
        } else {
          for (let i = 0; i < placement.word.length; i++) {
            const row = placement.startRow + i;
            if (newGrid[row] && newGrid[row][placement.startCol]) {
              newGrid[row][placement.startCol].isRevealed = true;
            }
          }
        }
        
        setGameGrid(newGrid);
      }

      const wordScore = diff.crosswordWordScore;
      setScore(prev => prev + wordScore);
      
      // Animate score
      Animated.sequence([
        Animated.timing(scoreScaleAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scoreScaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Check for game completion
      const newFoundWords = [...foundCrosswordWords, upperWord];
      if (newFoundWords.length === crosswordWords.length) {
        setGameComplete(true);
        gameCompleteRef.current = true;
        
        // Save completion data
        try {
          if (levelData && categoryName) {
            const completionData = {
              level: levelData.level,
              category: categoryName,
              score: score + wordScore,
              foundBonusWords: foundBonusWords.length,
              completedAt: new Date().toISOString(),
              attempts: 1,
              hintsUsed: 1 - hintsLeft,
            };
            
            await upsertLocalLevel(completionData);
            await mutateLocalStats({
              levelsCompleted: 1,
              totalScore: score + wordScore,
              wordsFound: newFoundWords.length + foundBonusWords.length,
            });
            await updateGuestSnapshotFromProgress();
            await syncUser();
          }
        } catch (error) {
          console.warn("Failed to save completion data:", error);
        }
      }

      return { success: true, type: 'crossword' as const, score: wordScore };
    } else if (allValidWords.map(w => w.toUpperCase()).includes(upperWord)) {
      // Handle bonus word found
      setFoundBonusWords(prev => [...prev, upperWord]);
      
      const wordScore = diff.bonusWordScore;
      setScore(prev => prev + wordScore);
      
      // Animate score
      Animated.sequence([
        Animated.timing(scoreScaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scoreScaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      return { success: true, type: 'bonus' as const, score: wordScore };
    }

    return { success: false, type: 'invalid' as const };
  }, [
    foundCrosswordWords,
    foundBonusWords,
    crosswordWords,
    allValidWords,
    wordPlacements,
    gameGrid,
    diff,
    score,
    hintsLeft,
    levelData,
    categoryName,
    scoreScaleAnim,
  ]);

  // Handle word hint
  const handleWordHint = useCallback((hintedWord: string) => {
    if (hintsLeft <= 0) return;
    
    setHintedWords(prev => [...prev, hintedWord]);
    setHintsLeft(prev => prev - 1);
  }, [hintsLeft]);

  // Handle next level
  const handleNextLevel = useCallback(() => {
    if (levelData && categoryName && onNavigate) {
      onNavigate("levels");
    } else if (onNavigate) {
      onNavigate("levels");
    }
  }, [levelData, categoryName, onNavigate]);

  return {
    // State
    gameGrid,
    letters,
    crosswordWords,
    allValidWords,
    wordPlacements,
    foundCrosswordWords,
    foundBonusWords,
    loading,
    error,
    score,
    gameComplete,
    animatingLetters,
    cellSize,
    hintAnim,
    hintsLeft,
    hintedWords,
    
    // Refs
    gameCompleteRef,
    gridCellRefs,
    letterWheelRef,
    containerRef,
    scoreScaleAnim,
    
    // Actions
    handleWordSubmit,
    handleWordHint,
    handleNextLevel,
    setAnimatingLetters,
    setHintAnim,
  };
}