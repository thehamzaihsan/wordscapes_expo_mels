import { Check, Eraser, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  
  // --- REFINED DYNAMIC SIZING ---
  const hexagonSize = 35;
  // Increased padding to create more space, especially for more letters
  const hexagonPadding = 25; 
  // A reasonable minimum radius for a small number of letters
  const minRadius = 75;      

  // Calculate radius based on the circumference needed for the letters
  const radius = useMemo(() => {
    const numLetters = letters.length;
    if (numLetters === 0) {
      return minRadius;
    }
    
    // Calculate the total space needed for one letter (its diameter + padding)
    const spacePerLetter = (hexagonSize * 2) + hexagonPadding;
    
    // Determine the total circumference required to fit all letters without them touching
    const requiredCircumference = numLetters * spacePerLetter;
    
    // Convert the circumference to the radius needed (C = 2 * PI * r)
    const radiusFromCircumference = requiredCircumference / (2 * Math.PI);
    
    // Use the calculated radius, but ensure it doesn't shrink below the minimum
    return Math.max(minRadius, radiusFromCircumference);
  }, [letters.length]);

  // Calculate the total wheel size based on the dynamic radius
  const wheelSize = useMemo(() => {
    // Diameter is (radius + hexagon size) * 2, plus some overall padding for the container
    return (radius + hexagonSize) * 2 + 20;
  }, [radius]);
  
  const wheelCenter = wheelSize / 2;

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
    if (letters.length === 0) {
      return;
    }
        
    // Calculate letter positions in a circle
    letterPositions.current = letters.map((letter, index) => {
      const angle = (index * 2 * Math.PI) / letters.length - Math.PI / 2;
      const x = Math.cos(angle) * radius + wheelCenter;
      const y = Math.sin(angle) * radius + wheelCenter;
      return { x, y, letter, index };
    });
  }, [letters, wheelSize, radius, wheelCenter]);

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
    if (selectedIndices.includes(index)) {
      return;
    }
    const newIndices = [...selectedIndices, index];
    const newLetters = [...selectedLetters, letter];
    
    setSelectedIndices(newIndices);
    setSelectedLetters(newLetters);
    setCurrentWord(newLetters.join(''));
    updateConnectionPath(newIndices);
    onLetterSelect?.(letter, index);
  }, [selectedIndices, selectedLetters, onLetterSelect, updateConnectionPath]);

  const resetSelection = useCallback((): void => {
    setSelectedLetters([]);
    setSelectedIndices([]);
    setConnectionPath('');
    setCurrentWord('');
  }, []);

  const submitWord = useCallback((): void => {
    if (selectedLetters.length > 0) {
      const word = selectedLetters.join('').toLowerCase();
      onWordComplete?.(word);
    }
    resetSelection();
  }, [selectedLetters, onWordComplete, resetSelection]);

  const removeLetter = useCallback((): void => {
    if (selectedLetters.length > 0) {
      const newLetters = selectedLetters.slice(0, -1);
      const newIndices = selectedIndices.slice(0, -1);
      
      setSelectedLetters(newLetters);
      setSelectedIndices(newIndices);
      setCurrentWord(newLetters.join(''));
      updateConnectionPath(newIndices);
    }
  }, [selectedLetters, selectedIndices, updateConnectionPath]);

  const isValidWord = currentWord.length > 2 && validWords.includes(currentWord.toLowerCase());

  if (letters.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.currentWord}>No letters available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hexagonal Letter Wheel with dynamic sizing */}
      <View style={[styles.wheelContainer, { width: wheelSize, height: wheelSize, borderRadius: wheelCenter }]}>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Path 
            d={connectionPath} 
            stroke={isValidWord ? "#10B981" : "#fde047"} 
            strokeWidth={4} 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity={0.8} 
          />
          
          {letters.map((letter, index) => {
            const angle = (index * 2 * Math.PI) / letters.length - Math.PI / 2;
            const x = Math.cos(angle) * radius + wheelCenter;
            const y = Math.sin(angle) * radius + wheelCenter;
            const isSelected = selectedIndices.includes(index);
            
            return (
              <Polygon
                key={`hexagon-${index}`}
                points={createHexagonPath(x, y, hexagonSize)}
                fill={isSelected ? "#F59E0B" : "#8B5CF6"}
                stroke={isSelected ? "#F59E0B" : "#8B5CF6"}
                strokeWidth={2}
                opacity={1}
              />
            );
          })}
        </Svg>

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
                  left: wheelCenter + x - hexagonSize,
                  top: wheelCenter + y - hexagonSize,
                  width: hexagonSize * 2,
                  height: hexagonSize * 2,
                },
              ]}
              onPress={() => addLetter(letter, index)}
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
      </View>

      {/* Control Buttons outside the wheel */}
      <View style={styles.centerControlsContainer}>
        <TouchableOpacity 
          style={[styles.centerButton, styles.removeButton, selectedLetters.length === 0 && styles.disabledCenterButton]}
          onPress={removeLetter}
          disabled={selectedLetters.length === 0}
        >
          <Eraser size={24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.centerButton, styles.submitCenterButton, currentWord.length < 2 && styles.disabledCenterButton]}
          onPress={submitWord}
          disabled={currentWord.length < 2}
        >
          <Check size={24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.centerButton, styles.clearButton, selectedLetters.length === 0 && styles.disabledCenterButton]}
          onPress={resetSelection}
          disabled={selectedLetters.length === 0}
        >
          <X size={24} color="#ffffff" />
        </TouchableOpacity>
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
  currentWord: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 5,
  },
  wheelContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
    // borderRadius is applied dynamically inline
    overflow: 'hidden',
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
    elevation: 6,
  },
  selectionNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
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
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  submitButtonText: {
    fontSize: 24,
  },
});