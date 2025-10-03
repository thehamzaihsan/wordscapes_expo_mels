import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface LetterWheelProps {
  letters?: string[];
  onWordComplete?: (word: string) => void;
  onLetterSelect?: (letter: string, index: number) => void;
  validWords?: string[];
}

interface LetterPosition {
  x: number;
  y: number;
  letter: string;
  index: number;
}

const LetterWheel: React.FC<LetterWheelProps> = ({
  letters = ['C', 'A', 'T', 'R', 'E', 'S'],
  onWordComplete,
  onLetterSelect,
  validWords = [],
}) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [connectionPath, setConnectionPath] = useState<string>('');
  const letterPositions = useRef<LetterPosition[]>([]);
  const wheelSize = 280;
  const radius = 100;

  useEffect(() => {
    // Calculate letter positions
    letterPositions.current = letters.map((letter, index) => {
      const angle = (index * 2 * Math.PI) / letters.length - Math.PI / 2;
      const x = Math.cos(angle) * radius + wheelSize / 2;
      const y = Math.sin(angle) * radius + wheelSize / 2;
      return { x, y, letter, index };
    });
  }, [letters]);

  const getLetterAtPosition = (x: number, y: number): LetterPosition | null => {
    for (const pos of letterPositions.current) {
      const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
      if (distance < 30) {
        return pos;
      }
    }
    return null;
  };

  const addLetter = (letter: string, index: number): void => {
    if (selectedIndices.includes(index)) return;

    setSelectedLetters((prev) => [...prev, letter]);
    setSelectedIndices((prev) => [...prev, index]);

    if (onLetterSelect) {
      onLetterSelect(letter, index);
    }
  };

  const completeWord = (): void => {
    if (selectedLetters.length > 0) {
      const word = selectedLetters.join('');
      if (onWordComplete) {
        onWordComplete(word);
      }
    }

    // Reset selection
    setSelectedLetters([]);
    setSelectedIndices([]);
    setConnectionPath('');
  };

  const updatePath = (indices: number[], currentX?: number, currentY?: number): void => {
    if (indices.length === 0) {
      setConnectionPath('');
      return;
    }

    const positions = indices.map((idx) => letterPositions.current[idx]);
    let path = `M ${positions[0].x} ${positions[0].y}`;

    for (let i = 1; i < positions.length; i++) {
      path += ` L ${positions[i].x} ${positions[i].y}`;
    }

    if (currentX !== undefined && currentY !== undefined) {
      path += ` L ${currentX} ${currentY}`;
    }

    setConnectionPath(path);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        // Clear previous selection
        setSelectedLetters([]);
        setSelectedIndices([]);
        setConnectionPath('');

        const touch = evt.nativeEvent;
        const letterData = getLetterAtPosition(touch.locationX, touch.locationY);

        if (letterData) {
          addLetter(letterData.letter, letterData.index);
          updatePath([letterData.index]);
        }
      },

      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const touch = evt.nativeEvent;
        const x = touch.locationX;
        const y = touch.locationY;

        const letterData = getLetterAtPosition(x, y);

        if (letterData && !selectedIndices.includes(letterData.index)) {
          const newIndices = [...selectedIndices, letterData.index];
          addLetter(letterData.letter, letterData.index);
          updatePath(newIndices, x, y);
        } else {
          updatePath(selectedIndices, x, y);
        }
      },

      onPanResponderRelease: () => {
        completeWord();
      },

      onPanResponderTerminate: () => {
        completeWord();
      },
    })
  ).current;

  return (
    <View style={[styles.wheelContainer, { width: wheelSize, height: wheelSize }]} {...panResponder.panHandlers}>
      {/* Connection Lines */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path d={connectionPath} stroke="#fde047" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
      </Svg>

      {/* Letters */}
      {letters.map((letter, index) => {
        const angle = (index * 2 * Math.PI) / letters.length - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const isUsed = selectedIndices.includes(index);

        return (
          <View
            key={index}
            style={[
              styles.letterCircle,
              {
                left: wheelSize / 2 + x - 30,
                top: wheelSize / 2 + y - 30,
              },
              isUsed && styles.letterCircleUsed,
            ]}
          >
            <Text style={[styles.letterText, isUsed && styles.letterTextUsed]}>{letter}</Text>
          </View>
        );
      })}

      {/* Center Button */}
      <View style={styles.centerButton}>
        <Text style={styles.centerButtonText}>⟲</Text>
      </View>
    </View>
  );
};

// Demo Component
export default function LetterWheelDemo() {
  const [formedWords, setFormedWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [lastAttempt, setLastAttempt] = useState<string>('');

  const validWords = [
    'CAT',
    'CARE',
    'RACE',
    'CRATE',
    'TRACE',
    'REACT',
    'CATER',
    'CRATES',
    'RECAST',
    'CARES',
    'RATS',
    'STAR',
    'TEARS',
    'STARE',
    'ARC',
    'ACE',
    'CAR',
    'ARE',
    'EAR',
    'EAT',
    'ATE',
    'TEA',
    'TAR',
    'RAT',
    'SAT',
    'SET',
    'REST',
    'CAST',
    'CASE',
  ];

  const handleLetterSelect = (letter: string, index: number): void => {
    setCurrentWord((prev) => prev + letter);
  };

  const handleWordComplete = (word: string): void => {
    setLastAttempt(word);

    if (validWords.includes(word) && !formedWords.includes(word)) {
      setFormedWords([...formedWords, word]);
    }

    setCurrentWord('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Letter Wheel</Text>

      {/* Found Words */}
      <View style={styles.wordsContainer}>
        <Text style={styles.sectionTitle}>Found Words ({formedWords.length})</Text>
        <View style={styles.wordsList}>
          {formedWords.map((word, idx) => (
            <View key={idx} style={styles.wordBadge}>
              <Text style={styles.wordText}>{word}</Text>
            </View>
          ))}
          {formedWords.length === 0 && <Text style={styles.emptyText}>No words found yet</Text>}
        </View>
      </View>

      {/* Current Word Display */}
      <View style={styles.currentWordContainer}>
        <Text style={styles.currentWord}>{currentWord || 'Drag across letters...'}</Text>
      </View>

      <LetterWheel letters={['C', 'A', 'T', 'R', 'E', 'S']} onLetterSelect={handleLetterSelect} onWordComplete={handleWordComplete} validWords={validWords} />

      {lastAttempt !== '' && (
        <Text style={styles.feedback}>
          {validWords.includes(lastAttempt) && !formedWords.includes(lastAttempt)
            ? `Found: ${lastAttempt}`
            : formedWords.includes(lastAttempt)
            ? `Already found: ${lastAttempt}`
            : `Not a valid word: ${lastAttempt}`}
        </Text>
      )}

      <Text style={styles.hint}>Drag across letters to form words. Release to submit!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  wordsContainer: {
    width: width - 40,
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    minHeight: 100,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 10,
    fontWeight: '600',
  },
  wordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordBadge: {
    backgroundColor: '#e94560',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 4,
  },
  wordText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  currentWordContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  currentWord: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fde047',
    letterSpacing: 4,
  },
  wheelContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  letterCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  letterCircleUsed: {
    backgroundColor: '#ef4444',
    transform: [{ scale: 1.15 }],
    borderWidth: 3,
    borderColor: '#fde047',
  },
  letterText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  letterTextUsed: {
    color: '#fff',
  },
  centerButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fde047',
    left: '50%',
    top: '50%',
    marginLeft: -25,
    marginTop: -25,
  },
  centerButtonText: {
    fontSize: 24,
    color: '#fde047',
  },
  feedback: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 15,
    textAlign: 'center',
  },
  hint: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});