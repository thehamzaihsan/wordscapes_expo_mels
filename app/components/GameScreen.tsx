import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  SafeAreaView,
  ScrollView,
  State,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

// Import your game manager functions
import { checkGuess, CrosswordLevel, generateCrosswordLevel, GuessResult } from '../../hooks/game-manager';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Crossword puzzle structure
interface CrosswordWord {
  word: string;
  startRow: number;
  startCol: number;
  direction: 'across' | 'down';
  clue: string;
  found: boolean;
  cells: {row: number, col: number}[];
}

interface CrosswordCell {
  letter: string;
  isEmpty: boolean;
  wordIds: number[];
  isHighlighted: boolean;
  correctLetter: string;
}

interface LetterPosition {
  x: number;
  y: number;
  letter: string;
  index: number;
}

interface GameState {
  crosswordGrid: CrosswordCell[][];
  circleLetters: string[];
  letterPositions: LetterPosition[];
  selectedPath: string;
  selectedIndices: number[];
  currentWord: string;
  foundWords: CrosswordWord[];
  allWords: CrosswordWord[];
  gameComplete: boolean;
  timeLeft: number;
  gameOver: boolean;
  score: number;
  level: CrosswordLevel | null;
  currentWordDisplay: string;
  isSelecting: boolean;
  currentGesturePosition: { x: number; y: number };
}

const GRID_SIZE = 15;
const CELL_SIZE = Math.min((screenWidth - 40) / GRID_SIZE, 25);

// Enhanced crossword layout generator
const generateCrosswordLayout = (level: CrosswordLevel): CrosswordWord[] => {
  const words = level.crosswordWords.slice(0, 10);
  const crosswordWords: CrosswordWord[] = [];

  // More sophisticated layout patterns
  const layouts = [
    { word: words[0] || 'COLA', startRow: 3, startCol: 2, direction: 'across' as const, clue: 'Soft drink' },
    { word: words[1] || 'COAL', startRow: 3, startCol: 8, direction: 'across' as const, clue: 'Black fuel' },
    { word: words[2] || 'FOCAL', startRow: 6, startCol: 1, direction: 'across' as const, clue: 'Central point' },
    { word: words[3] || 'CLAN', startRow: 9, startCol: 6, direction: 'across' as const, clue: 'Family group' },
    { word: words[4] || 'FALL', startRow: 1, startCol: 3, direction: 'down' as const, clue: 'Autumn season' },
    { word: words[5] || 'LOAF', startRow: 3, startCol: 4, direction: 'down' as const, clue: 'Bread portion' },
    { word: words[6] || 'COLA', startRow: 6, startCol: 8, direction: 'down' as const, clue: 'Another cola' },
    { word: words[7] || 'ACE', startRow: 2, startCol: 10, direction: 'down' as const, clue: 'Playing card' },
  ];

  layouts.forEach((layout, index) => {
    if (layout.word && layout.word.length > 0) {
      const cells: {row: number, col: number}[] = [];
      for (let i = 0; i < layout.word.length; i++) {
        if (layout.direction === 'across') {
          cells.push({ row: layout.startRow, col: layout.startCol + i });
        } else {
          cells.push({ row: layout.startRow + i, col: layout.startCol });
        }
      }
      
      crosswordWords.push({
        word: layout.word.toUpperCase(),
        startRow: layout.startRow,
        startCol: layout.startCol,
        direction: layout.direction,
        clue: layout.clue,
        found: false,
        cells: cells,
      });
    }
  });

  return crosswordWords;
};

interface CrosswordGameProps {
  difficulty?: 'easy' | 'medium' | 'hard';
  sublevel?: number;
  totalSublevels?: number;
  onNavigate: (screen: string, data?: any) => void;
}

const CrosswordGame: React.FC<CrosswordGameProps> = ({ 
  difficulty = 'medium',
  sublevel = 1,
  totalSublevels = 10,
  onNavigate 
}) => {
  const [gameState, setGameState] = useState<GameState>({
    crosswordGrid: Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => ({
        letter: '',
        isEmpty: true,
        wordIds: [],
        isHighlighted: false,
        correctLetter: '',
      }))
    ),
    circleLetters: [],
    letterPositions: [],
    selectedPath: '',
    selectedIndices: [],
    currentWord: '',
    foundWords: [],
    allWords: [],
    gameComplete: false,
    timeLeft: 300,
    gameOver: false,
    score: 0,
    level: null,
    currentWordDisplay: '',
    isSelecting: false,
    currentGesturePosition: { x: 0, y: 0 },
  });

  // Animation references
  const letterAnimations = useRef<Animated.Value[]>([]);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const wordBubbleAnimation = useRef(new Animated.Value(0)).current;
  const successAnimation = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize animations
  useEffect(() => {
    letterAnimations.current = gameState.circleLetters.map(() => new Animated.Value(1));
    
    // Pulse animation for selected letters
    const pulseSequence = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseSequence.start();
    
    return () => pulseSequence.stop();
  }, [gameState.circleLetters]);

  // Word bubble animation
  useEffect(() => {
    if (gameState.currentWordDisplay && gameState.currentWordDisplay !== 'TAP LETTERS') {
      Animated.spring(wordBubbleAnimation, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(wordBubbleAnimation, {
        toValue: 0,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [gameState.currentWordDisplay]);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  // Timer effect
  useEffect(() => {
    if (gameState.gameComplete || gameState.gameOver) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          setTimeout(() => {
            Alert.alert(
              'Time\'s Up!',
              `Game Over! You found ${prev.foundWords.length} words.`,
              [{ text: 'Try Again', onPress: () => onNavigate('levels') }]
            );
          }, 100);
          return { ...prev, timeLeft: 0, gameOver: true };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.gameComplete, gameState.gameOver]);

  const initializeGame = async () => {
    try {
      const level = generateCrosswordLevel(undefined, difficulty);
      const crosswordWords = generateCrosswordLayout(level);
      
      // Initialize grid
      const newGrid: CrosswordCell[][] = Array(GRID_SIZE).fill(null).map(() => 
        Array(GRID_SIZE).fill(null).map(() => ({
          letter: '',
          isEmpty: true,
          wordIds: [],
          isHighlighted: false,
          correctLetter: '',
        }))
      );

      // Place words in grid
      crosswordWords.forEach((wordObj, wordIndex) => {
        wordObj.cells.forEach((cell, letterIndex) => {
          if (cell.row < GRID_SIZE && cell.col < GRID_SIZE) {
            newGrid[cell.row][cell.col] = {
              letter: '',
              isEmpty: false,
              wordIds: [...newGrid[cell.row][cell.col].wordIds, wordIndex],
              isHighlighted: false,
              correctLetter: wordObj.word[letterIndex],
            };
          }
        });
      });

      // Calculate letter positions for circle
      const radius = 85;
      const letterPositions: LetterPosition[] = level.letters.map((letter, index) => {
        const angle = (index * 2 * Math.PI) / level.letters.length;
        const x = radius * Math.cos(angle - Math.PI / 2);
        const y = radius * Math.sin(angle - Math.PI / 2);
        return { x, y, letter, index };
      });

      setGameState(prev => ({
        ...prev,
        level,
        crosswordGrid: newGrid,
        circleLetters: level.letters,
        letterPositions,
        allWords: crosswordWords,
        foundWords: [],
      }));
    } catch (error) {
      console.error('Error generating level:', error);
      Alert.alert('Error', 'Failed to generate level. Please try again.');
    }
  };

  const handleCircleLetterPress = (letter: string, index: number) => {
    if (gameState.gameOver || gameState.gameComplete) return;

    // Animate letter selection
    Animated.sequence([
      Animated.timing(letterAnimations.current[index], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(letterAnimations.current[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setGameState(prev => {
      const isAlreadySelected = prev.selectedIndices.includes(index);
      
      if (isAlreadySelected) {
        const removeIndex = prev.selectedIndices.indexOf(index);
        const newSelectedIndices = prev.selectedIndices.slice(0, removeIndex);
        const newPath = newSelectedIndices.map(i => prev.circleLetters[i]).join('');
        
        return {
          ...prev,
          selectedIndices: newSelectedIndices,
          selectedPath: newPath,
          currentWord: newPath,
          currentWordDisplay: newPath || 'TAP LETTERS',
        };
      } else {
        const newSelectedIndices = [...prev.selectedIndices, index];
        const newPath = newSelectedIndices.map(i => prev.circleLetters[i]).join('');
        
        return {
          ...prev,
          selectedIndices: newSelectedIndices,
          selectedPath: newPath,
          currentWord: newPath,
          currentWordDisplay: newPath,
        };
      }
    });
  };

  // Pan gesture handler for drag selection
  const handlePanGesture = (event: PanGestureHandlerGestureEvent) => {
    const { x, y, state } = event.nativeEvent;
    
    setGameState(prev => ({
      ...prev,
      currentGesturePosition: { x, y },
      isSelecting: state === State.ACTIVE,
    }));

    if (state === State.ACTIVE) {
      // Check if gesture is over any letter
      gameState.letterPositions.forEach((letterPos, index) => {
        const distance = Math.sqrt(
          Math.pow(x - (letterPos.x + 100), 2) + Math.pow(y - (letterPos.y + 100), 2)
        );
        
        if (distance < 25 && !gameState.selectedIndices.includes(index)) {
          handleCircleLetterPress(letterPos.letter, index);
        }
      });
    }
  };

  const submitWord = () => {
    if (gameState.gameOver || gameState.gameComplete || !gameState.level) return;

    const word = gameState.currentWord.toUpperCase();
    
    if (word.length < 3) {
      Alert.alert('Too Short', 'Words must be at least 3 letters long!');
      return;
    }

    const matchingWord = gameState.allWords.find(w => w.word === word && !w.found);
    
    if (matchingWord) {
      // Success animation
      Animated.sequence([
        Animated.timing(successAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const points = word.length * 10;
      
      // Update grid to show the word
      const newGrid = [...gameState.crosswordGrid];
      matchingWord.cells.forEach((cell, letterIndex) => {
        if (cell.row < GRID_SIZE && cell.col < GRID_SIZE) {
          newGrid[cell.row][cell.col] = {
            ...newGrid[cell.row][cell.col],
            letter: matchingWord.word[letterIndex],
            isHighlighted: true,
          };
        }
      });

      const updatedWords = gameState.allWords.map(w => 
        w.word === word ? { ...w, found: true } : w
      );
      
      const newFoundWords = [...gameState.foundWords, { ...matchingWord, found: true }];

      setGameState(prev => ({
        ...prev,
        crosswordGrid: newGrid,
        foundWords: newFoundWords,
        allWords: updatedWords,
        score: prev.score + points,
        selectedIndices: [],
        selectedPath: '',
        currentWord: '',
        currentWordDisplay: 'TAP LETTERS',
      }));

      Alert.alert('Excellent!', `You found "${word}"! +${points} points`);

      if (newFoundWords.length === gameState.allWords.length) {
        setTimeout(() => {
          setGameState(prev => ({ ...prev, gameComplete: true }));
          Alert.alert('Congratulations!', 'You completed the crossword!');
        }, 1000);
      }
    } else {
      const result: GuessResult = checkGuess(word, gameState.level);
      
      if (result.exists) {
        Alert.alert('Valid Word', `"${word}" is valid, but not part of this crossword.`);
      } else {
        Alert.alert('Invalid Word', `"${word}" is not a valid English word.`);
      }
    }
  };

  const clearSelection = () => {
    // Reset all letter animations
    letterAnimations.current.forEach(anim => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    setGameState(prev => ({
      ...prev,
      selectedIndices: [],
      selectedPath: '',
      currentWord: '',
      currentWordDisplay: 'TAP LETTERS',
      isSelecting: false,
    }));
  };

  const shuffleCircleLetters = () => {
    if (!gameState.circleLetters) return;
    
    const shuffled = [...gameState.circleLetters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Update positions
    const radius = 85;
    const newPositions: LetterPosition[] = shuffled.map((letter, index) => {
      const angle = (index * 2 * Math.PI) / shuffled.length;
      const x = radius * Math.cos(angle - Math.PI / 2);
      const y = radius * Math.sin(angle - Math.PI / 2);
      return { x, y, letter, index };
    });
    
    setGameState(prev => ({
      ...prev,
      circleLetters: shuffled,
      letterPositions: newPositions,
      selectedIndices: [],
      selectedPath: '',
      currentWord: '',
      currentWordDisplay: 'TAP LETTERS',
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCrosswordGrid = () => {
    return (
      <View style={styles.crosswordContainer}>
        <ScrollView 
          contentContainerStyle={styles.crosswordScrollContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.crosswordGrid}>
            {gameState.crosswordGrid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.crosswordRow}>
                {row.map((cell, colIndex) => (
                  <Animated.View
                    key={`${rowIndex}-${colIndex}`}
                    style={[
                      styles.crosswordCell,
                      { width: CELL_SIZE, height: CELL_SIZE },
                      cell.isEmpty ? styles.emptyCrosswordCell : styles.activeCrosswordCell,
                      cell.isHighlighted && styles.foundCrosswordCell,
                      cell.isHighlighted && {
                        transform: [{ scale: successAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.1]
                        }) }]
                      }
                    ]}
                  >
                    {!cell.isEmpty && (
                      <Text style={[
                        styles.crosswordCellText,
                        cell.isHighlighted && styles.foundCellText
                      ]}>
                        {cell.letter}
                      </Text>
                    )}
                  </Animated.View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderConnectionLines = () => {
    if (gameState.selectedIndices.length < 2) return null;

    return (
      <Svg style={StyleSheet.absoluteFill} width="200" height="200">
        {gameState.selectedIndices.slice(0, -1).map((startIndex, i) => {
          const endIndex = gameState.selectedIndices[i + 1];
          const startPos = gameState.letterPositions[startIndex];
          const endPos = gameState.letterPositions[endIndex];
          
          return (
            <Line
              key={i}
              x1={startPos.x + 100}
              y1={startPos.y + 100}
              x2={endPos.x + 100}
              y2={endPos.y + 100}
              stroke="#F39C12"
              strokeWidth="4"
              strokeLinecap="round"
            />
          );
        })}
        
        {gameState.selectedIndices.map((index) => {
          const pos = gameState.letterPositions[index];
          return (
            <Circle
              key={index}
              cx={pos.x + 100}
              cy={pos.y + 100}
              r="22"
              fill="none"
              stroke="#F39C12"
              strokeWidth="3"
            />
          );
        })}
      </Svg>
    );
  };

  const renderCircleLetters = () => {
    if (!gameState.circleLetters || gameState.circleLetters.length === 0) return null;

    return (
      <View style={styles.circleContainer}>
        {/* Current word display with animation */}
        <Animated.View style={[
          styles.currentWordBubble,
          {
            transform: [
              { scale: wordBubbleAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              }) },
              { translateY: wordBubbleAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0]
              }) }
            ],
            opacity: wordBubbleAnimation
          }
        ]}>
          <Text style={styles.currentWordBubbleText}>
            {gameState.currentWordDisplay || 'TAP LETTERS'}
          </Text>
        </Animated.View>

        {/* Letter circle with pan gesture */}
        <PanGestureHandler onGestureEvent={handlePanGesture}>
          <View style={styles.letterCircle}>
            {/* Connection lines */}
            {renderConnectionLines()}
            
            {/* Letters */}
            {gameState.letterPositions.map((letterPos, index) => {
              const isSelected = gameState.selectedIndices.includes(index);
              
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.circleLetter,
                    {
                      transform: [
                        { translateX: letterPos.x },
                        { translateY: letterPos.y },
                        { scale: letterAnimations.current[index] || new Animated.Value(1) },
                        ...(isSelected ? [{ scale: pulseAnimation }] : [])
                      ],
                    },
                    isSelected && styles.selectedCircleLetter,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.letterTouchArea}
                    onPress={() => handleCircleLetterPress(letterPos.letter, index)}
                    disabled={gameState.gameOver || gameState.gameComplete}
                  >
                    <Text style={[
                      styles.circleLetterText,
                      isSelected && styles.selectedCircleLetterText
                    ]}>
                      {letterPos.letter.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </PanGestureHandler>
      </View>
    );
  };

  if (!gameState.level) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Generating Crossword...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('levels')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.levelText}>Level {sublevel}</Text>
          <Text style={styles.scoreText}>Score: {gameState.score}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <Text style={[styles.timerText, { 
            color: gameState.timeLeft < 60 ? '#EF4444' : '#10B981' 
          }]}>
            {formatTime(gameState.timeLeft)}
          </Text>
        </View>
      </View>

      {/* Crossword Grid */}
      {renderCrosswordGrid()}

      {/* Bottom Section with Circle */}
      <View style={styles.bottomSection}>
        {renderCircleLetters()}
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={shuffleCircleLetters}
            disabled={gameState.gameOver || gameState.gameComplete}
          >
            <Text style={styles.actionButtonText}>Shuffle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton,
              gameState.selectedIndices.length === 0 && styles.disabledButton
            ]} 
            onPress={clearSelection}
            disabled={gameState.selectedIndices.length === 0}
          >
            <Text style={styles.actionButtonText}>Clear</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.submitButton,
              (gameState.currentWord.length < 3) && styles.disabledButton
            ]} 
            onPress={submitWord}
            disabled={gameState.currentWord.length < 3}
          >
            <Text style={styles.actionButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Words Found: {gameState.foundWords.length} / {gameState.allWords.length}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121213',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3c',
  },
  backButton: {
    flex: 1,
  },
  backButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  levelText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreText: {
    color: '#F59E0B',
    fontSize: 14,
    marginTop: 2,
    fontWeight: '600',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  crosswordContainer: {
    flex: 1,
    paddingTop: 20,
  },
  crosswordScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  crosswordGrid: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  crosswordRow: {
    flexDirection: 'row',
  },
  crosswordCell: {
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCrosswordCell: {
    backgroundColor: '#f0f0f0',
  },
  activeCrosswordCell: {
    backgroundColor: '#ffffff',
  },
  foundCrosswordCell: {
    backgroundColor: '#8B5CF6',
  },
  crosswordCellText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  foundCellText: {
    color: '#ffffff',
  },
  bottomSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3a3a3c',
  },
  circleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentWordBubble: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  currentWordBubbleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  letterCircle: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#3a3a3c',
  },
  circleLetter: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#A78BFA',
  },
  selectedCircleLetter: {
    backgroundColor: '#F59E0B',
    borderColor: '#FBBF24',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
  },
  letterTouchArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLetterText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedCircleLetterText: {
    color: '#000000',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#3a3a3c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  secondaryButton: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
  },
  disabledButton: {
    backgroundColor: '#555',
    borderColor: '#444',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CrosswordGame;