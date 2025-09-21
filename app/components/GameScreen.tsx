import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Game constants
const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const TARGET_WORD = 'REACT'; // You can make this dynamic later
const CURRENT_SUBLEVEL = 5;
const TOTAL_SUBLEVELS = 10;

// Particle interface
interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
}

// Tile states
enum TileState {
  DEFAULT = 'default',
  CORRECT = 'correct',
  WRONG_POSITION = 'wrongPosition',
  INCORRECT = 'incorrect',
}

interface Tile {
  letter: string;
  state: TileState;
}

interface GameState {
  board: Tile[][];
  currentRow: number;
  currentCol: number;
  gameOver: boolean;
  won: boolean;
}

interface GameScreenProps {
  onNavigate: (screen: string) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ onNavigate }) => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(MAX_GUESSES).fill(null).map(() =>
      Array(WORD_LENGTH).fill(null).map(() => ({
        letter: '',
        state: TileState.DEFAULT,
      }))
    ),
    currentRow: 0,
    currentCol: 0,
    gameOver: false,
    won: false,
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const [keyboardColors, setKeyboardColors] = useState<Record<string, TileState>>({});

  // Create floating particles
  useEffect(() => {
    const particleColors = ['#8B5CF6', '#EF4444', '#F59E0B', '#10B981']; // Purple, Red, Yellow, Green
    
    const createParticle = (id: number): Particle => ({
      id,
      x: new Animated.Value(Math.random() * screenWidth),
      y: new Animated.Value(Math.random() * Dimensions.get('window').height),
      opacity: new Animated.Value(Math.random() * 0.3 + 0.1),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    });

    const particleArray = Array.from({ length: 15 }, (_, i) => createParticle(i));
    setParticles(particleArray);

    // Animate particles
    const animateParticle = (particle: Particle) => {
      const duration = Math.random() * 10000 + 5000;
      
      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: Math.random() * screenWidth,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: Math.random() * Dimensions.get('window').height,
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
  }, []);

  const keyboard = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
  ];

  const getTileStyle = (tile: Tile) => {
    switch (tile.state) {
      case TileState.CORRECT:
        return styles.tileCorrect;
      case TileState.WRONG_POSITION:
        return styles.tileWrongPosition;
      case TileState.INCORRECT:
        return styles.tileIncorrect;
      default:
        return styles.tileDefault;
    }
  };

  const getKeyStyle = (key: string) => {
    const state = keyboardColors[key];
    switch (state) {
      case TileState.CORRECT:
        return styles.keyCorrect;
      case TileState.WRONG_POSITION:
        return styles.keyWrongPosition;
      case TileState.INCORRECT:
        return styles.keyIncorrect;
      default:
        return styles.keyDefault;
    }
  };

  const handleKeyPress = (key: string) => {
    if (gameState.gameOver) return;

    if (key === 'ENTER') {
      if (gameState.currentCol === WORD_LENGTH) {
        submitGuess();
      }
    } else if (key === 'BACK') {
      if (gameState.currentCol > 0) {
        setGameState(prev => ({
          ...prev,
          board: prev.board.map((row, rowIndex) => {
            if (rowIndex === prev.currentRow) {
              return row.map((tile, colIndex) => {
                if (colIndex === prev.currentCol - 1) {
                  return { letter: '', state: TileState.DEFAULT };
                }
                return tile;
              });
            }
            return row;
          }),
          currentCol: prev.currentCol - 1,
        }));
      }
    } else if (gameState.currentCol < WORD_LENGTH) {
      setGameState(prev => ({
        ...prev,
        board: prev.board.map((row, rowIndex) => {
          if (rowIndex === prev.currentRow) {
            return row.map((tile, colIndex) => {
              if (colIndex === prev.currentCol) {
                return { letter: key, state: TileState.DEFAULT };
              }
              return tile;
            });
          }
          return row;
        }),
        currentCol: prev.currentCol + 1,
      }));
    }
  };

  const submitGuess = () => {
    const currentGuess = gameState.board[gameState.currentRow]
      .map(tile => tile.letter)
      .join('');

    if (currentGuess.length !== WORD_LENGTH) return;

    // Check each letter and update tile states
    const newBoard = [...gameState.board];
    const newKeyboardColors = { ...keyboardColors };
    const targetLetters = TARGET_WORD.split('');
    const guessLetters = currentGuess.split('');

    // First pass: mark correct letters
    guessLetters.forEach((letter, index) => {
      if (letter === targetLetters[index]) {
        newBoard[gameState.currentRow][index].state = TileState.CORRECT;
        newKeyboardColors[letter] = TileState.CORRECT;
        targetLetters[index] = ''; // Mark as used
      }
    });

    // Second pass: mark wrong position and incorrect letters
    guessLetters.forEach((letter, index) => {
      if (newBoard[gameState.currentRow][index].state === TileState.CORRECT) {
        return; // Already marked as correct
      }

      const targetIndex = targetLetters.indexOf(letter);
      if (targetIndex !== -1) {
        newBoard[gameState.currentRow][index].state = TileState.WRONG_POSITION;
        if (newKeyboardColors[letter] !== TileState.CORRECT) {
          newKeyboardColors[letter] = TileState.WRONG_POSITION;
        }
        targetLetters[targetIndex] = ''; // Mark as used
      } else {
        newBoard[gameState.currentRow][index].state = TileState.INCORRECT;
        if (!newKeyboardColors[letter]) {
          newKeyboardColors[letter] = TileState.INCORRECT;
        }
      }
    });

    const won = currentGuess === TARGET_WORD;
    const gameOver = won || gameState.currentRow === MAX_GUESSES - 1;

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentRow: won ? prev.currentRow : prev.currentRow + 1,
      currentCol: 0,
      gameOver,
      won,
    }));

    setKeyboardColors(newKeyboardColors);

    if (gameOver) {
      setTimeout(() => {
        Alert.alert(
          won ? 'Congratulations!' : 'Game Over',
          won ? 'You guessed the word!' : `The word was: ${TARGET_WORD}`,
          [{ text: 'Play Again', onPress: resetGame }]
        );
      }, 1000);
    }
  };

  const resetGame = () => {
    setGameState({
      board: Array(MAX_GUESSES).fill(null).map(() =>
        Array(WORD_LENGTH).fill(null).map(() => ({
          letter: '',
          state: TileState.DEFAULT,
        }))
      ),
      currentRow: 0,
      currentCol: 0,
      gameOver: false,
      won: false,
    });
    setKeyboardColors({});
  };

  const renderTile = (tile: Tile, rowIndex: number, colIndex: number) => (
    <View
      key={`${rowIndex}-${colIndex}`}
      style={[styles.tile, getTileStyle(tile)]}
    >
      <Text style={styles.tileText}>{tile.letter}</Text>
    </View>
  );

  const renderKey = (key: string) => {
    const isLongKey = key === 'ENTER' || key === 'BACK';
    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.key,
          isLongKey ? styles.longKey : null,
          getKeyStyle(key),
        ]}
        onPress={() => handleKeyPress(key)}
      >
        <Text style={[styles.keyText, isLongKey ? styles.longKeyText : null]}>
          {key === 'BACK' ? '⌫' : key}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Floating Particles Background */}
      <View style={StyleSheet.absoluteFillObject}>
        {particles.map(particle => (
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

      {/* Progress Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => onNavigate('levels')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sublevelText}>
          {CURRENT_SUBLEVEL}/{TOTAL_SUBLEVELS}
        </Text>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${(CURRENT_SUBLEVEL / TOTAL_SUBLEVELS) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <View style={styles.gameBoard}>
        {gameState.board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((tile, colIndex) => renderTile(tile, rowIndex, colIndex))}
          </View>
        ))}
      </View>

      <View style={styles.keyboard}>
        {keyboard.map((row, index) => (
          <View key={index} style={styles.keyboardRow}>
            {row.map(renderKey)}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121213',
    paddingHorizontal: 16,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3c',
  },
  sublevelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#3a3a3c',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  gameBoard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tile: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  tileDefault: {
    backgroundColor: '#8B5CF6', // Purple
    borderColor: '#8B5CF6',
  },
  tileCorrect: {
    backgroundColor: '#10B981', // Green
    borderColor: '#10B981',
  },
  tileWrongPosition: {
    backgroundColor: '#F59E0B', // Yellow
    borderColor: '#F59E0B',
  },
  tileIncorrect: {
    backgroundColor: '#EF4444', // Red
    borderColor: '#EF4444',
  },
  tileText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  keyboard: {
    paddingBottom: 20,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  key: {
    backgroundColor: '#818384',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    borderRadius: 4,
    minWidth: 32,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  longKey: {
    paddingHorizontal: 14,
    minWidth: 60,
  },
  keyDefault: {
    backgroundColor: '#818384',
  },
  keyCorrect: {
    backgroundColor: '#10B981',
  },
  keyWrongPosition: {
    backgroundColor: '#F59E0B',
  },
  keyIncorrect: {
    backgroundColor: '#3a3a3c',
  },
  keyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  longKeyText: {
    fontSize: 14,
  },
  headerTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 0,
  },
  backButton: {
    paddingVertical: 0,
    paddingHorizontal: 10,
  },
  backButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GameScreen;