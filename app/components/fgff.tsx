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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CURRENT_SUBLEVEL = 5;
const TOTAL_SUBLEVELS = 10;

// Game data for level 5
const LEVEL_DATA = {
  letters: ['R', 'E', 'A', 'C', 'T', 'S'],
  words: [
    { word: 'CAR', length: 3, row: 0, col: 0, direction: 'across' },
    { word: 'CARE', length: 4, row: 0, col: 0, direction: 'down' },
    { word: 'REACT', length: 5, row: 1, col: 2, direction: 'across' },
    { word: 'TEA', length: 3, row: 2, col: 4, direction: 'down' },
    { word: 'SET', length: 3, row: 3, col: 0, direction: 'across' },
    { word: 'ART', length: 3, row: 4, col: 1, direction: 'across' },
  ],
  gridSize: { rows: 7, cols: 7 }
};

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
}

interface WordInfo {
  word: string;
  length: number;
  row: number;
  col: number;
  direction: 'across' | 'down';
  found: boolean;
}

interface GridCell {
  letter: string;
  isActive: boolean;
  wordIds: number[];
}

interface GameState {
  grid: (GridCell | null)[][];
  words: WordInfo[];
  selectedLetters: string[];
  selectedIndices: number[];
  foundWords: Set<string>;
  currentWord: string;
  gameComplete: boolean;
}

interface GameScreenProps {
  onNavigate: (screen: string) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ onNavigate }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Initialize grid
    const grid: (GridCell | null)[][] = Array(LEVEL_DATA.gridSize.rows)
      .fill(null)
      .map(() => Array(LEVEL_DATA.gridSize.cols).fill(null));

    // Place words in grid
    const words = LEVEL_DATA.words.map((wordData, index) => ({
      ...wordData,
      found: false,
    }));

    words.forEach((wordInfo, wordIndex) => {
      const letters = wordInfo.word.split('');
      letters.forEach((letter, letterIndex) => {
        const row = wordInfo.direction === 'down' ? wordInfo.row + letterIndex : wordInfo.row;
        const col = wordInfo.direction === 'across' ? wordInfo.col + letterIndex : wordInfo.col;
        
        if (!grid[row][col]) {
          grid[row][col] = {
            letter,
            isActive: false,
            wordIds: [],
          };
        }
        grid[row][col]!.wordIds.push(wordIndex);
      });
    });

    return {
      grid,
      words,
      selectedLetters: [],
      selectedIndices: [],
      foundWords: new Set(),
      currentWord: '',
      gameComplete: false,
    };
  });

  const [particles, setParticles] = useState<Particle[]>([]);

  // Create floating particles
  useEffect(() => {
    const particleColors = ['#8B5CF6', '#EF4444', '#F59E0B', '#10B981'];
    
    const createParticle = (id: number): Particle => ({
      id,
      x: new Animated.Value(Math.random() * screenWidth),
      y: new Animated.Value(Math.random() * screenHeight),
      opacity: new Animated.Value(Math.random() * 0.3 + 0.1),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    });

    const particleArray = Array.from({ length: 15 }, (_, i) => createParticle(i));
    setParticles(particleArray);

    const animateParticle = (particle: Particle) => {
      const duration = Math.random() * 10000 + 5000;
      
      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: Math.random() * screenWidth,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: Math.random() * screenHeight,
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

  const handleLetterPress = (letter: string, index: number) => {
    if (gameState.selectedIndices.includes(index)) {
      // Deselect if already selected
      setGameState(prev => ({
        ...prev,
        selectedLetters: prev.selectedLetters.filter((_, i) => prev.selectedIndices[i] !== index),
        selectedIndices: prev.selectedIndices.filter(i => i !== index),
        currentWord: prev.selectedLetters.filter((_, i) => prev.selectedIndices[i] !== index).join(''),
      }));
    } else {
      // Select letter
      setGameState(prev => ({
        ...prev,
        selectedLetters: [...prev.selectedLetters, letter],
        selectedIndices: [...prev.selectedIndices, index],
        currentWord: [...prev.selectedLetters, letter].join(''),
      }));
    }
  };

  const submitWord = () => {
    const word = gameState.currentWord.toUpperCase();
    
    if (word.length < 3) {
      Alert.alert('Too Short', 'Words must be at least 3 letters long!');
      return;
    }

    const foundWord = gameState.words.find(w => w.word === word && !w.found);
    
    if (foundWord) {
      // Mark word as found
      setGameState(prev => {
        const newWords = prev.words.map(w => 
          w.word === word ? { ...w, found: true } : w
        );
        
        const newFoundWords = new Set(prev.foundWords).add(word);
        const gameComplete = newWords.every(w => w.found);
        
        // Update grid to show found letters
        const newGrid = prev.grid.map(row => 
          row ? row.map(cell => {
            if (cell && cell.wordIds.some(id => newWords[id].word === word)) {
              return { ...cell, isActive: true };
            }
            return cell;
          }) : row
        );

        return {
          ...prev,
          words: newWords,
          foundWords: newFoundWords,
          grid: newGrid,
          selectedLetters: [],
          selectedIndices: [],
          currentWord: '',
          gameComplete,
        };
      });

      if (gameState.words.filter(w => !w.found).length === 1) {
        setTimeout(() => {
          Alert.alert(
            'Congratulations!',
            'You found all the words!',
            [{ text: 'Next Level', onPress: () => onNavigate('levels') }]
          );
        }, 1000);
      }
    } else if (gameState.foundWords.has(word)) {
      Alert.alert('Already Found', 'You already found this word!');
    } else {
      Alert.alert('Not Found', 'This word is not in the puzzle.');
    }

    // Clear selection
    setGameState(prev => ({
      ...prev,
      selectedLetters: [],
      selectedIndices: [],
      currentWord: '',
    }));
  };

  const clearSelection = () => {
    setGameState(prev => ({
      ...prev,
      selectedLetters: [],
      selectedIndices: [],
      currentWord: '',
    }));
  };

  const renderGridCell = (cell: GridCell | null, row: number, col: number) => {
    if (!cell) {
      return <View key={`${row}-${col}`} style={styles.emptyCell} />;
    }

    return (
      <View
        key={`${row}-${col}`}
        style={[
          styles.gridCell,
          cell.isActive ? styles.gridCellActive : styles.gridCellInactive
        ]}
      >
        <Text style={styles.gridCellText}>
          {cell.isActive ? cell.letter : ''}
        </Text>
      </View>
    );
  };

  const renderCircleLetter = (letter: string, index: number) => {
    const angle = (index * 2 * Math.PI) / LEVEL_DATA.letters.length;
    const radius = 80;
    const centerX = 0;
    const centerY = 0;
    const x = centerX + radius * Math.cos(angle - Math.PI / 2);
    const y = centerY + radius * Math.sin(angle - Math.PI / 2);

    const isSelected = gameState.selectedIndices.includes(index);

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.circleLetter,
          {
            transform: [{ translateX: x }, { translateY: y }],
          },
          isSelected ? styles.circleLetterSelected : null,
        ]}
        onPress={() => handleLetterPress(letter, index)}
      >
        <Text style={[
          styles.circleLetterText,
          isSelected ? styles.circleLetterTextSelected : null
        ]}>
          {letter}
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

      {/* Words Found Counter */}
      <View style={styles.wordsCounter}>
        <Text style={styles.wordsCounterText}>
          Words Found: {gameState.foundWords.size}/{gameState.words.length}
        </Text>
      </View>

      {/* Crossword Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {gameState.grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow}>
              {row.map((cell, colIndex) => renderGridCell(cell, rowIndex, colIndex))}
            </View>
          ))}
        </View>
      </View>

      {/* Current Word Display */}
      <View style={styles.currentWordContainer}>
        <Text style={styles.currentWordText}>
          {gameState.currentWord || 'Select letters to form a word'}
        </Text>
      </View>

      {/* Letter Circle */}
      <View style={styles.letterCircleContainer}>
        <View style={styles.letterCircle}>
          {LEVEL_DATA.letters.map((letter, index) => 
            renderCircleLetter(letter, index)
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={clearSelection}
        >
          <Text style={styles.actionButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.submitButton]} 
          onPress={submitWord}
          disabled={gameState.currentWord.length === 0}
        >
          <Text style={styles.actionButtonText}>Submit</Text>
        </TouchableOpacity>
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3c',
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
  wordsCounter: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  wordsCounterText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  grid: {
    flexDirection: 'column',
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#3a3a3c',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  gridCellActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  gridCellInactive: {
    backgroundColor: '#2a2a2c',
    borderColor: '#3a3a3c',
  },
  emptyCell: {
    width: 32,
    height: 32,
    margin: 1,
  },
  gridCellText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentWordContainer: {
    alignItems: 'center',
    paddingVertical: 15,
    minHeight: 50,
    justifyContent: 'center',
  },
  currentWordText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  letterCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    flex: 1,
  },
  letterCircle: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleLetter: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B5CF6',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  circleLetterSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  circleLetterText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  circleLetterTextSelected: {
    color: '#000000',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  actionButton: {
    backgroundColor: '#3a3a3c',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GameScreen;