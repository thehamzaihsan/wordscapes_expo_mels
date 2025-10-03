import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

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
  letters = [],
  onWordComplete,
  onLetterSelect,
  validWords = [],
}) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [connectionPath, setConnectionPath] = useState<string>('');
  const [currentWord, setCurrentWord] = useState<string>('');
  const letterPositions = useRef<LetterPosition[]>([]);
  const wheelSize = 320;
  const radius = 120;
  const hexagonSize = 35;

  // Create hexagon path for SVG
  const createHexagonPath = (centerX: number, centerY: number, size: number): string => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  useEffect(() => {
    if (letters.length === 0) return;
    
    // Calculate letter positions in a circle
    letterPositions.current = letters.map((letter, index) => {
      const angle = (index * 2 * Math.PI) / letters.length - Math.PI / 2;
      const x = Math.cos(angle) * radius + wheelSize / 2;
      const y = Math.sin(angle) * radius + wheelSize / 2;
      return { x, y, letter, index };
    });
  }, [letters, wheelSize, radius]);

  const updateConnectionPath = useCallback((indices: number[]): void => {
    if (indices.length === 0) {
      setConnectionPath('');
      return;
    }

    const positions = indices.map((idx) => letterPositions.current[idx]).filter(Boolean);
    if (positions.length === 0) return;
    
    let path = `M ${positions[0].x} ${positions[0].y}`;
    for (let i = 1; i < positions.length; i++) {
      path += ` L ${positions[i].x} ${positions[i].y}`;
    }
    setConnectionPath(path);
  }, []);

  const addLetter = useCallback((letter: string, index: number): void => {
    console.log(`Adding letter: ${letter} at index: ${index}`);
    
    // Prevent adding the same letter twice
    if (selectedIndices.includes(index)) {
      console.log(`Letter ${letter} already selected`);
      return;
    }

    const newIndices = [...selectedIndices, index];
    const newLetters = [...selectedLetters, letter];
    
    setSelectedIndices(newIndices);
    setSelectedLetters(newLetters);
    setCurrentWord(newLetters.join(''));
    
    // Update connection path
    updateConnectionPath(newIndices);

    onLetterSelect?.(letter, index);
  }, [selectedIndices, selectedLetters, onLetterSelect, updateConnectionPath]);

  const resetSelection = useCallback((): void => {
    console.log('Resetting selection');
    setSelectedLetters([]);
    setSelectedIndices([]);
    setConnectionPath('');
    setCurrentWord('');
  }, []);

  const submitWord = useCallback((): void => {
    console.log(`Submitting word: ${currentWord}`);
    if (selectedLetters.length > 0) {
      const word = selectedLetters.join('').toLowerCase();
      onWordComplete?.(word);
    }
    resetSelection();
  }, [selectedLetters, currentWord, onWordComplete, resetSelection]);

  const removeLetter = useCallback((): void => {
    console.log('Removing last letter');
    if (selectedLetters.length > 0) {
      const newLetters = selectedLetters.slice(0, -1);
      const newIndices = selectedIndices.slice(0, -1);
      
      setSelectedLetters(newLetters);
      setSelectedIndices(newIndices);
      setCurrentWord(newLetters.join(''));
      updateConnectionPath(newIndices);
    }
  }, [selectedLetters, selectedIndices, updateConnectionPath]);

  // Check if current word is valid
  const isValidWord = currentWord.length > 2 && validWords.includes(currentWord.toLowerCase());

  // Early return if no letters
  if (letters.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.currentWord}>No letters available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
     
      {/* Hexagonal Letter Wheel */}
      <View style={[styles.wheelContainer, { width: wheelSize, height: wheelSize }]}>
        {/* SVG for hexagons and connection lines */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Connection Lines */}
          <Path 
            d={connectionPath} 
            stroke={isValidWord ? "#10B981" : "#fde047"} 
            strokeWidth={4} 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity={0.8} 
          />
          
          {/* Hexagon backgrounds */}
          {letters.map((letter, index) => {
            const angle = (index * 2 * Math.PI) / letters.length - Math.PI / 2;
            const x = Math.cos(angle) * radius + wheelSize / 2;
            const y = Math.sin(angle) * radius + wheelSize / 2;
            const isSelected = selectedIndices.includes(index);
            
            return (
              <Polygon
                key={`hexagon-${index}`}
                points={createHexagonPath(x, y, hexagonSize)}
                fill={isSelected ? "#F59E0B" : "#8B5CF6"}
                stroke={isSelected ? "#FBBF24" : "#A78BFA"}
                strokeWidth={3}
                opacity={0.9}
              />
            );
          })}
        </Svg>

        {/* Letter Buttons */}
        {letters.map((letter, index) => {
          const angle = (index * 2 * Math.PI) / letters.length - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isSelected = selectedIndices.includes(index);
          const selectionOrder = selectedIndices.indexOf(index) + 1;

          return (
            <TouchableOpacity
              key={`${letter}-${index}`}
              style={[
                styles.letterHexagon,
                {
                  left: wheelSize / 2 + x - hexagonSize,
                  top: wheelSize / 2 + y - hexagonSize,
                  width: hexagonSize * 2,
                  height: hexagonSize * 2,
                },
              ]}
              onPress={() => {
                console.log(`Letter ${letter} pressed`);
                addLetter(letter, index);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.letterText, isSelected && styles.letterTextSelected]}>
                {letter.toUpperCase()}
              </Text>
              {isSelected && (
                <View style={styles.selectionNumber}>
                  <Text style={styles.selectionNumberText}>{selectionOrder}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Center Control Buttons */}
        <View style={styles.centerControlsContainer}>
          {/* Remove/Backspace Button */}
          <TouchableOpacity 
            style={[
              styles.centerButton, 
              styles.removeButton,
              selectedLetters.length === 0 && styles.disabledCenterButton
            ]}
            onPress={() => {
              console.log('Remove button pressed');
              removeLetter();
            }}
            disabled={selectedLetters.length === 0}
          >
            <Text style={styles.centerButtonText}>⌫</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[
              styles.centerButton, 
              styles.submitCenterButton,
              currentWord.length < 2 && styles.disabledCenterButton
            ]}
            onPress={() => {
              console.log('Submit button pressed');
              submitWord();
            }}
            disabled={currentWord.length < 2}
          >
            <Text style={[styles.centerButtonText, styles.submitButtonText]}>✓</Text>
          </TouchableOpacity>

          {/* Clear Button */}
          <TouchableOpacity 
            style={[
              styles.centerButton, 
              styles.clearButton,
              selectedLetters.length === 0 && styles.disabledCenterButton
            ]}
            onPress={() => {
              console.log('Clear button pressed');
              resetSelection();
            }}
            disabled={selectedLetters.length === 0}
          >
            <Text style={styles.centerButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Debug Info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          Word: {currentWord} | Selected: [{selectedLetters.join(', ')}] | Valid: {isValidWord ? '✓' : '✗'}
        </Text>
      </View>
    </View>
  );
};

export default LetterWheel;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  currentWordContainer: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    minWidth: 250,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentWord: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 5,
  },
  validWord: {
    color: '#10B981',
  },
  instructionText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  wheelContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.02)',
    borderRadius: 160,
    marginBottom: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  letterHexagon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  letterText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  letterTextSelected: {
    color: '#000000',
    fontSize: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
  },
  selectionNumber: {
    position: 'absolute',
    top: -12,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  selectionNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerControlsContainer: {
    position: 'absolute',
    top: '48%',
    left: '45%',
    transform: [{ translateX: -50 }, { translateY: -20 }],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    zIndex: 20,
  },
  centerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  removeButton: {
    backgroundColor: '#EF4444',
  },
  submitCenterButton: {
    backgroundColor: '#10B981',
  },
  clearButton: {
    backgroundColor: '#8B5CF6',
  },
  disabledCenterButton: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  centerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  submitButtonText: {
    fontSize: 18,
  },
  debugContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(107, 114, 128, 0.08)',
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.1)',
  },
  debugText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});