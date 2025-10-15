import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, View } from "react-native";

import { Difficulty } from "@/constants/difficulty";
import {
  generateCrossword,
  type Grid as GeneratedGrid,
} from "@/hooks/crossword-gen";
import {
  generateBonusWords,
  generateCrosswordLevelWithBaseword,
} from "@/hooks/game-manager";
import { loadGuestProgress, saveGuestProgress } from "@/hooks/guest-progress";
import { updateGuestSnapshotFromProgress } from "@/lib/guestSnapshot";
import { showToast } from "@/lib/toast";

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
  const [animatingLetters, setAnimatingLetters] = useState<AnimatingLetter[]>(
    []
  );
  const [cellSize, setCellSize] = useState(40);

  // Hint state
  const [hintAnim, setHintAnim] = useState<{
    row: number;
    col: number;
    anim: Animated.Value;
  } | null>(null);
  const [hintsLeft, setHintsLeft] = useState(1);
  const [hintedWords, setHintedWords] = useState<string[]>([]);

  // Refs
  const gameCompleteRef = useRef(false);
  const gridCellRefs = useRef<{ [key: string]: View }>({});
  const letterWheelRef = useRef<View>(null);
  const containerRef = useRef<View>(null);
  const scoreScaleAnim = useRef(new Animated.Value(1)).current;
  const { width, height } = Dimensions.get("window");
  const GRID_AREA_WIDTH = width * 0.9;
  const GRID_AREA_HEIGHT = height * 0.4;

  // Helpers: extract placements from generated grid and build cell grid
  const extractWordPlacements = useCallback(
    (grid: GeneratedGrid, words: string[]) => {
      type Placement = WordPlacement;
      const placements: Placement[] = [];
      const rows = grid.length;
      const cols = grid[0]?.length || 0;
      const isBoundary = (r: number, c: number) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return true;
        return grid[r][c] == null;
      };
      words.forEach((word) => {
        const upperWord = word.toUpperCase();
        // Horizontal
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c <= cols - upperWord.length; c++) {
            let ok = true;
            for (let i = 0; i < upperWord.length; i++) {
              if (grid[r][c + i] !== upperWord[i]) {
                ok = false;
                break;
              }
            }
            if (!ok) continue;
            const proper =
              isBoundary(r, c - 1) && isBoundary(r, c + upperWord.length);
            if (proper) {
              placements.push({
                word: upperWord,
                startRow: r,
                startCol: c,
                direction: "horizontal",
                isFound: false,
              });
            }
          }
        }
        // Vertical
        for (let r = 0; r <= rows - upperWord.length; r++) {
          for (let c = 0; c < cols; c++) {
            let ok = true;
            for (let i = 0; i < upperWord.length; i++) {
              if (grid[r + i][c] !== upperWord[i]) {
                ok = false;
                break;
              }
            }
            if (!ok) continue;
            const proper =
              isBoundary(r - 1, c) && isBoundary(r + upperWord.length, c);
            if (proper) {
              placements.push({
                word: upperWord,
                startRow: r,
                startCol: c,
                direction: "vertical",
                isFound: false,
              });
            }
          }
        }
      });
      return placements;
    },
    []
  );

  const createGameGridFromGenerated = useCallback(
    (grid: GeneratedGrid, placements: WordPlacement[]): GridCell[][] => {
      const rows = grid.length;
      const cols = grid[0]?.length || 0;
      const out: GridCell[][] = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          letter: null,
          isRevealed: false,
          isActive: false,
          belongsToWords: [],
        }))
      );
      // Fill letters and mark active cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ch = grid[r][c];
          if (ch) {
            out[r][c].letter = ch;
            out[r][c].isActive = true;
          }
        }
      }
      // Belongs-to info
      placements.forEach((p) => {
        if (p.direction === "horizontal") {
          for (let i = 0; i < p.word.length; i++) {
            out[p.startRow][p.startCol + i].belongsToWords.push(p.word);
          }
        } else {
          for (let i = 0; i < p.word.length; i++) {
            out[p.startRow + i][p.startCol].belongsToWords.push(p.word);
          }
        }
      });
      return out;
    },
    []
  );

  // Initialize game using the crossword generator so every word gets boxes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");

        const level = levelData
          ? {
              baseWord: levelData.baseWord,
              letters: levelData.letters,
              crosswordWords: levelData.crosswordWords,
              difficulty: levelData.difficulty,
              wordCount: levelData.crosswordWords.length,
            }
          : generateCrosswordLevelWithBaseword(baseWord || "planet", {
              difficulty,
            });

        const wordsLower = level.crosswordWords.map((w) => w.toLowerCase());
        const generated = generateCrossword(wordsLower);

        if (!generated) {
          // Fallback: minimal base word row
          const base = level.baseWord.toUpperCase();
          const grid: GridCell[][] = [
            Array.from({ length: base.length }, (_, i) => ({
              letter: base[i],
              isRevealed: false,
              isActive: true,
              belongsToWords: [base],
            })),
          ];
          if (!cancelled) {
            setCellSize(45);
            setGameGrid(grid);
            setWordPlacements([
              {
                word: base,
                startRow: 0,
                startCol: 0,
                direction: "horizontal",
                isFound: false,
              },
            ]);
            setCrosswordWords(level.crosswordWords);
            const gameLetters = levelData?.letters || level.letters;
            setLetters(gameLetters);
            const bonusWords = generateBonusWords(
              level.baseWord,
              level.crosswordWords,
              difficulty
            );
            setAllValidWords([...level.crosswordWords, ...bonusWords]);
          }
          return;
        }

        const placements = extractWordPlacements(
          generated,
          level.crosswordWords
        );
        const grid = createGameGridFromGenerated(generated, placements);

        const numRows = grid.length;
        const numCols = grid[0]?.length || 1;
        const sizeByWidth = GRID_AREA_WIDTH / numCols;
        const sizeByHeight = GRID_AREA_HEIGHT / numRows;
        const newCell = Math.max(
          24,
          Math.min(56, Math.floor(Math.min(sizeByWidth, sizeByHeight) - 2))
        );

        if (!cancelled) {
          setCellSize(newCell);
          setGameGrid(grid);
          setWordPlacements(placements);
          setCrosswordWords(level.crosswordWords);

          const gameLetters = levelData?.letters || level.letters;
          setLetters(gameLetters);

          const bonusWords = generateBonusWords(
            level.baseWord,
            level.crosswordWords,
            difficulty
          );
          setAllValidWords([...level.crosswordWords, ...bonusWords]);
        }
      } catch (err) {
        console.error("Game initialization error:", err);
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to initialize game"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    baseWord,
    difficulty,
    levelData,
    GRID_AREA_HEIGHT,
    GRID_AREA_WIDTH,
    extractWordPlacements,
    createGameGridFromGenerated,
  ]);

  // Handle word submission
  const handleWordSubmit = useCallback(
    async (
      word: string,
      opts?: {
        deferReveal?: boolean;
      }
    ) => {
      const upperWord = word.toUpperCase();

      if (
        foundCrosswordWords.includes(upperWord) ||
        foundBonusWords.includes(upperWord)
      ) {
        return { success: false, type: "duplicate" as const };
      }

      if (crosswordWords.map((w) => w.toUpperCase()).includes(upperWord)) {
        // Reveal cells for this crossword word
        setFoundCrosswordWords((prev) => [...prev, upperWord]);

        const placement = wordPlacements.find(
          (p) => p.word.toUpperCase() === upperWord
        );
        if (!opts?.deferReveal) {
          if (placement && gameGrid) {
            const newGrid = gameGrid.map((row) => row.map((c) => ({ ...c })));
            if (placement.direction === "horizontal") {
              for (let i = 0; i < placement.word.length; i++) {
                const col = placement.startCol + i;
                newGrid[placement.startRow]?.[col] &&
                  (newGrid[placement.startRow][col].isRevealed = true);
              }
            } else {
              for (let i = 0; i < placement.word.length; i++) {
                const row = placement.startRow + i;
                newGrid[row]?.[placement.startCol] &&
                  (newGrid[row][placement.startCol].isRevealed = true);
              }
            }
            setGameGrid(newGrid);
          }
        }

        const wordScore = 10;
        setScore((prev) => prev + wordScore);

        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {}
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

        // Check for completion
        const newFound = [...foundCrosswordWords, upperWord];
        if (newFound.length === crosswordWords.length) {
          setGameComplete(true);
          gameCompleteRef.current = true;
          try {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
          } catch {}
        }

        return { success: true, type: "crossword" as const, score: wordScore };
      } else if (
        allValidWords.map((w) => w.toUpperCase()).includes(upperWord)
      ) {
        setFoundBonusWords((prev) => [...prev, upperWord]);
        const wordScore = 5;
        setScore((prev) => prev + wordScore);
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
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
        return { success: true, type: "bonus" as const, score: wordScore };
      }

      return { success: false, type: "invalid" as const };
    },
    [
      foundCrosswordWords,
      foundBonusWords,
      crosswordWords,
      allValidWords,
      wordPlacements,
      gameGrid,
      scoreScaleAnim,
    ]
  );

  const revealWordCells = useCallback(
    (word: string) => {
      const upperWord = word.toUpperCase();
      const placement = wordPlacements.find(
        (p) => p.word.toUpperCase() === upperWord
      );
      if (!placement || !gameGrid) return;
      const newGrid = gameGrid.map((row) => row.map((c) => ({ ...c })));
      if (placement.direction === "horizontal") {
        for (let i = 0; i < placement.word.length; i++) {
          const col = placement.startCol + i;
          newGrid[placement.startRow]?.[col] &&
            (newGrid[placement.startRow][col].isRevealed = true);
        }
      } else {
        for (let i = 0; i < placement.word.length; i++) {
          const row = placement.startRow + i;
          newGrid[row]?.[placement.startCol] &&
            (newGrid[row][placement.startCol].isRevealed = true);
        }
      }
      setGameGrid(newGrid);
    },
    [wordPlacements, gameGrid]
  );

  // Handle word hint - returns true if hint was applied (free or paid), false on failure
  const handleWordHint = useCallback(
    async (hintedWord: string): Promise<boolean> => {
      // First hint is free per game instance
      if (hintsLeft > 0) {
        setHintedWords((prev) => [...prev, hintedWord]);
        setHintsLeft((prev) => prev - 1);
        return true;
      }
      // After free hint, charge 5 gems per hint
      try {
        const progress = await loadGuestProgress();
        if (!progress) throw new Error("No progress loaded");
        const cost = 5;
        const gems = progress.meta.gems ?? 0;
        if (gems < cost) {
          showToast("Not enough gems for a hint (5 needed)", "warning");
          return false;
        }
        progress.meta.gems = gems - cost;
        progress.updatedAt = new Date().toISOString();
        await saveGuestProgress(progress);
        await updateGuestSnapshotFromProgress(progress);
        setHintedWords((prev) => [...prev, hintedWord]);
        showToast("Hint used (-5 gems)", "success");
        return true;
      } catch (e) {
        console.warn("Failed to purchase hint:", e);
        showToast("Failed to use hint", "error");
        return false;
      }
    },
    [hintsLeft]
  );

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
    revealWordCells,
    setAnimatingLetters,
    setHintAnim,
  };
}
