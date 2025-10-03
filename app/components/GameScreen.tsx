import { generateCrossword } from "@/hooks/crossword-gen";
import {
  filterWordsList,
  generateCrosswordLevelWithBaseword,
  getRandomWords,
  initializeGameManager,
  testSubwordGeneration
} from "@/hooks/game-manager";
import { Difficulty, getDifficultyConfig } from "@/constants/difficulty";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from "react-native";
import LetterWheel from "./inputWheel";

interface GridCell {
  letter: string | null;
  isRevealed: boolean;
  isActive: boolean; // Can contain a letter
  belongsToWords: string[]; // Which words this cell belongs to
}

interface WordPlacement {
  word: string;
  startRow: number;
  startCol: number;
  direction: 'horizontal' | 'vertical';
  isFound: boolean;
}

interface GameScreenProps {
  onNavigate?: (screen: string) => void;
  difficulty?: Difficulty;
}

export default function GameScreen({ onNavigate, difficulty = 'medium' }: GameScreenProps) {
  const [gameGrid, setGameGrid] = useState<GridCell[][] | null>(null);
  const [baseWord, setBaseWord] = useState("");
  const [letters, setLetters] = useState<string[]>([]);
  const [crosswordWords, setCrosswordWords] = useState<string[]>([]);
  const [wordPlacements, setWordPlacements] = useState<WordPlacement[]>([]);
  const [foundCrosswordWords, setFoundCrosswordWords] = useState<string[]>([]);
  const [foundBonusWords, setFoundBonusWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  
  const diff = getDifficultyConfig(difficulty);

  // Convert basic grid to game grid with word placement info
  const createGameGrid = useCallback((basicGrid: string[][], placements: WordPlacement[]): GridCell[][] => {
    const rows = basicGrid.length;
    const cols = basicGrid[0]?.length || 0;
    
    console.log('Creating game grid from basic grid:', basicGrid);
    console.log('Using placements:', placements);
    
    const gameGrid: GridCell[][] = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => ({
        letter: null,
        isRevealed: false,
        isActive: false,
        belongsToWords: []
      }))
    );

    // Mark active cells and assign letters based on word placements
    placements.forEach(placement => {
      const { word, startRow, startCol, direction } = placement;
      
      for (let i = 0; i < word.length; i++) {
        const row = direction === 'horizontal' ? startRow : startRow + i;
        const col = direction === 'horizontal' ? startCol + i : startCol;
        
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          gameGrid[row][col].letter = word[i].toUpperCase();
          gameGrid[row][col].isActive = true;
          gameGrid[row][col].belongsToWords.push(word);
        }
      }
    });

    console.log('Created game grid:', gameGrid);
    return gameGrid;
  }, []);

  // Extract word placements from crossword grid
  const extractWordPlacements = useCallback((grid: string[][], words: string[]): WordPlacement[] => {
    const placements: WordPlacement[] = [];
    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    console.log('Extracting placements from grid:', grid);
    console.log('Looking for words:', words);

    words.forEach(word => {
      const upperWord = word.toUpperCase();
      
      // Check horizontal placements
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col <= cols - word.length; col++) {
          let matches = true;
          let hasNonEmptyCell = false;
          
          // Check if word matches and has at least one non-empty cell
          for (let i = 0; i < word.length; i++) {
            const cellValue = grid[row][col + i];
            if (cellValue && cellValue !== '') {
              hasNonEmptyCell = true;
            }
            if (cellValue !== upperWord[i] && cellValue !== '') {
              matches = false;
              break;
            }
          }
          
          if (matches && hasNonEmptyCell) {
            // Verify this is actually the word by checking all letters match
            let fullMatch = true;
            for (let i = 0; i < word.length; i++) {
              if (grid[row][col + i] !== upperWord[i]) {
                fullMatch = false;
                break;
              }
            }
            
            if (fullMatch) {
              placements.push({
                word: word.toLowerCase(),
                startRow: row,
                startCol: col,
                direction: 'horizontal',
                isFound: false
              });
              console.log(`Found horizontal placement for "${word}" at (${row}, ${col})`);
            }
          }
        }
      }

      // Check vertical placements
      for (let row = 0; row <= rows - word.length; row++) {
        for (let col = 0; col < cols; col++) {
          let matches = true;
          let hasNonEmptyCell = false;
          
          // Check if word matches and has at least one non-empty cell
          for (let i = 0; i < word.length; i++) {
            const cellValue = grid[row + i][col];
            if (cellValue && cellValue !== '') {
              hasNonEmptyCell = true;
            }
            if (cellValue !== upperWord[i] && cellValue !== '') {
              matches = false;
              break;
            }
          }
          
          if (matches && hasNonEmptyCell) {
            // Verify this is actually the word by checking all letters match
            let fullMatch = true;
            for (let i = 0; i < word.length; i++) {
              if (grid[row + i][col] !== upperWord[i]) {
                fullMatch = false;
                break;
              }
            }
            
            if (fullMatch) {
              placements.push({
                word: word.toLowerCase(),
                startRow: row,
                startCol: col,
                direction: 'vertical',
                isFound: false
              });
              console.log(`Found vertical placement for "${word}" at (${row}, ${col})`);
            }
          }
        }
      }
    });

    console.log('Final placements:', placements);
    return placements;
  }, []);

  // Reveal word in grid when found
  const revealWordInGrid = useCallback((foundWord: string) => {
    setWordPlacements(prev => {
      const newPlacements = prev.map(placement => 
        placement.word === foundWord.toLowerCase() 
          ? { ...placement, isFound: true }
          : placement
      );
      return newPlacements;
    });

    setGameGrid(prev => {
      if (!prev) return prev;
      
      const newGrid = prev.map(row => row.map(cell => ({ ...cell })));

      // Find the word placement and reveal its cells
      const placement = wordPlacements.find(p => p.word === foundWord.toLowerCase());
      if (placement) {
        const { word, startRow, startCol, direction } = placement;
        
        for (let i = 0; i < word.length; i++) {
          const row = direction === 'horizontal' ? startRow : startRow + i;
          const col = direction === 'horizontal' ? startCol + i : startCol;
          
          if (row >= 0 && row < newGrid.length && col >= 0 && col < newGrid[0].length) {
            newGrid[row][col].isRevealed = true;
          }
        }
      }
      
      return newGrid;
    });
  }, [wordPlacements]);

  const handleLetterSelect = useCallback((letter: string, index: number) => {
    console.log(`Letter selected: ${letter} at index ${index}`);
  }, []);

  const handleWordComplete = useCallback((word: string) => {
    console.log(`Word completed: ${word}`);
    const normalizedWord = word.toLowerCase().trim();
    
    if (normalizedWord.length < 3) {
      setFeedback("Word must be at least 3 letters long");
      setTimeout(() => setFeedback(""), 2000);
      return;
    }

    // Check if word already found
    if (foundCrosswordWords.includes(normalizedWord) || foundBonusWords.includes(normalizedWord)) {
      setFeedback("Word already found!");
      setTimeout(() => setFeedback(""), 2000);
      return;
    }

    // Check if it's a crossword word
    if (crosswordWords.includes(normalizedWord)) {
      // Main crossword word found!
      setFoundCrosswordWords(prev => [...prev, normalizedWord]);
      const points = normalizedWord.length * 100; // Higher points for crossword words
      setScore(prev => prev + points);
      setFeedback(`🎉 CROSSWORD WORD! "${normalizedWord.toUpperCase()}" (+${points} points)`);
      
      // Reveal word in grid
      revealWordInGrid(normalizedWord);
      
      // Check if game is complete
      if (foundCrosswordWords.length + 1 === crosswordWords.length) {
        setGameComplete(true);
        setFeedback(`🏆 PUZZLE COMPLETE! All crossword words found!`);
      }
      
      setTimeout(() => setFeedback(""), 4000);
    } else {
      // Check if it's a valid bonus word (can be formed from available letters)
      const canForm = canFormWordFromLetters(normalizedWord, letters);
      if (canForm && normalizedWord.length >= 3) {
        // Bonus word found!
        setFoundBonusWords(prev => [...prev, normalizedWord]);
        const points = normalizedWord.length * 10; // Lower points for bonus words
        setScore(prev => prev + points);
        setFeedback(`✨ Bonus word! "${normalizedWord.toUpperCase()}" (+${points} points)`);
        setTimeout(() => setFeedback(""), 3000);
      } else {
        setFeedback(`"${normalizedWord.toUpperCase()}" is not a valid word`);
        setTimeout(() => setFeedback(""), 2000);
      }
    }
  }, [crosswordWords, foundCrosswordWords, foundBonusWords, letters, revealWordInGrid]);

  // Check if word can be formed from available letters
  const canFormWordFromLetters = useCallback((word: string, availableLetters: string[]): boolean => {
    const wordLetters = word.toLowerCase().split('');
    const letterCounts = availableLetters.reduce((acc, letter) => {
      const lowerLetter = letter.toLowerCase();
      acc[lowerLetter] = (acc[lowerLetter] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const letter of wordLetters) {
      if ((letterCounts[letter] || 0) === 0) {
        return false;
      }
      letterCounts[letter]--;
    }
    return true;
  }, []);

  const init = useCallback(() => {
    // Initialize game manager for optimal performance
    initializeGameManager();
    
    // Test subword generation for debugging
    testSubwordGeneration("planet");
    
    setLoading(true);
    setError("");
    setAttempts(0);
    setFoundCrosswordWords([]);
    setFoundBonusWords([]);
    setScore(0);
    setFeedback("");
    setGameComplete(false);

    let success = false;
    let crosswordGrid: string[][] | null = null;
    let currentAttempts = 0;

    while (!success && currentAttempts < 5) {
      try {
        // Generate level data (letters and word list)
        const { baseWord, letters, crosswordWords } = generateCrosswordLevelWithBaseword(
          "planet",
          { difficulty: difficulty }
        );

        
        
        // Filter words to get appropriate difficulty
        const fl_words = filterWordsList(crosswordWords, {
          minLength: diff.min,
          maxLength: diff.max,
        });
        const words = getRandomWords(fl_words, diff.minWords);

        console.log('Generating crossword with words:', words);

        // Use your 2D grid generator directly
        const grid = generateCrossword(words);

        if (grid && words.length > 0) {
          // Convert Grid (Cell[][]) to string[][]
          crosswordGrid = grid.map(row => 
            row.map(cell => cell || '') // Convert null to empty string
          );
          
          // Extract word placements from the generated grid
          const placements = extractWordPlacements(crosswordGrid, words);
          
          console.log('Generated grid:', crosswordGrid);
          console.log('Word placements:', placements);
          
          if (placements.length > 0) {
            // Create game grid with hidden cells
            const gameGrid = createGameGrid(crosswordGrid, placements);
            
            setBaseWord(baseWord);
            setLetters(letters);
            setCrosswordWords(words); // Only the words that are in the crossword
            setWordPlacements(placements);
            setGameGrid(gameGrid);
            success = true;
          }
        }
      } catch (error) {
        console.warn('Error generating crossword:', error);
      }
      
      currentAttempts++;
      setAttempts(currentAttempts);
    }

    if (!success) {
      setGameGrid(null);
      setError("Failed to generate crossword after multiple attempts.");
    }

    setLoading(false);
  }, [diff, extractWordPlacements, createGameGrid]);

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6600" />
        <Text style={{ marginTop: 10, color: "#444" }}>
          Generating crossword... {attempts}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {gameGrid ? (
        <>
          {/* Score and Progress Header */}
          <View style={styles.header}>
            <Text style={styles.scoreText}>Score: {score}</Text>
            <Text style={styles.progressText}>
              Progress: {foundCrosswordWords.length}/{crosswordWords.length}
            </Text>
          </View>

          {/* Feedback Message */}
          {feedback ? (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          ) : null}

          {/* Game Complete Message */}
          {gameComplete && (
            <View style={styles.gameCompleteContainer}>
              <Text style={styles.gameCompleteText}>🏆 PUZZLE COMPLETE! 🏆</Text>
              <Text style={styles.gameCompleteSubtext}>
                You found all {crosswordWords.length} crossword words!
              </Text>
            </View>
          )}

          {/* Crossword Grid - Only show active cells */}
          <View style={styles.gridContainer}>
            
            <View style={styles.grid}>
              {gameGrid.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {row.map((cell, colIndex) => {
                    if (!cell.isActive) {
                      // Don't render inactive cells
                      return <View key={colIndex} style={styles.emptyCell} />;
                    }
                    
                    return (
                      <View 
                        key={colIndex} 
                        style={[
                          styles.cell,
                          cell.isRevealed ? styles.revealedCell : styles.hiddenCell
                        ]}
                      >
                        <Text style={[
                          styles.cellText,
                          cell.isRevealed ? styles.revealedCellText : styles.hiddenCellText
                        ]}>
                          {cell.isRevealed ? cell.letter : ""}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

         

          {/* Letter Wheel */}
          <View style={styles.wheelSection}>
            {letters.length > 0 ? (
              <LetterWheel 
                letters={letters} 
                onLetterSelect={handleLetterSelect} 
                onWordComplete={handleWordComplete} 
                validWords={[...crosswordWords]} // Only validate against crossword words for highlighting
              />
            ) : (
              <Text style={styles.errorText}>No letters available</Text>
            )}
          </View>
        </>
      ) : (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B5CF6",
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  feedbackContainer: {
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  feedbackText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  gameCompleteContainer: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  gameCompleteText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  gameCompleteSubtext: {
    color: "#000",
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  gridContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  debugGridInfo: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  grid: {
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
  },
  emptyCell: {
    width: 28,
    height: 28,
    margin: 1,
  },
  cell: {
    width: 28,
    height: 28,
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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cellText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  hiddenCellText: {
    color: "transparent",
  },
  revealedCellText: {
    color: "#fff",
  },
  wordsContainer: {
    width: "100%",
    marginBottom: 20,
  },
  foundWordsSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 10,
  },
  wordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  wordBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 5,
  },
  crosswordWordBadge: {
    backgroundColor: "#8B5CF6",
  },
  bonusWordBadge: {
    backgroundColor: "#10B981",
  },
  wordText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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
});

