/**
 * Difficulty levels for crossword generation
 */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

/**
 * Configuration for each difficulty level
 */
export interface DifficultyConfig {
  min: number;
  max: number;
  minWords: number;
  popularityRange: number;
  label: string;
  description: string;
  color: string;
  icon?: string;
}

/**
 * Mapping of difficulty levels to their configurations
 */
export const difficultyMap: Record<Difficulty, DifficultyConfig> = {
  easy: { 
    min: 4, 
    max: 6, 
    minWords: 4, 
    popularityRange: 2000,
    label: 'Easy',
    description: 'Perfect for beginners',
    color: '#4CAF50',
    icon: '🌱'
  },
  medium: { 
    min: 5, 
    max: 7, 
    minWords: 6, 
    popularityRange: 3000,
    label: 'Medium',
    description: 'A balanced challenge',
    color: '#FF9800',
    icon: '⚡'
  },
  hard: { 
    min: 6, 
    max: 8, 
    minWords: 8, 
    popularityRange: 4000,
    label: 'Hard',
    description: 'For experienced players',
    color: '#F44336',
    icon: '🔥'
  },
  expert: { 
    min: 7, 
    max: 10, 
    minWords: 10, 
    popularityRange: 5000,
    label: 'Expert',
    description: 'Ultimate challenge',
    color: '#9C27B0',
    icon: '💎'
  }
};

/**
 * Get all available difficulties as an array
 */
export function getAllDifficulties(): Difficulty[] {
  return Object.keys(difficultyMap) as Difficulty[];
}

/**
 * Get difficulty configuration by name
 */
export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return difficultyMap[difficulty];
}

/**
 * Check if a difficulty exists
 */
export function isValidDifficulty(difficulty: string): difficulty is Difficulty {
  return difficulty in difficultyMap;
}

/**
 * Get next difficulty level
 */
export function getNextDifficulty(current: Difficulty): Difficulty | null {
  const difficulties = getAllDifficulties();
  const currentIndex = difficulties.indexOf(current);
  return currentIndex < difficulties.length - 1 ? difficulties[currentIndex + 1] : null;
}

/**
 * Get previous difficulty level
 */
export function getPreviousDifficulty(current: Difficulty): Difficulty | null {
  const difficulties = getAllDifficulties();
  const currentIndex = difficulties.indexOf(current);
  return currentIndex > 0 ? difficulties[currentIndex - 1] : null;
}

/**
 * Get difficulty by index
 */
export function getDifficultyByIndex(index: number): Difficulty | null {
  const difficulties = getAllDifficulties();
  return index >= 0 && index < difficulties.length ? difficulties[index] : null;
}