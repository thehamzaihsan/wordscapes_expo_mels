import { Filter } from 'bad-words';
import wordsArray from 'an-array-of-english-words';

// Cast to ensure we have a string array
const words: string[] = Array.isArray(wordsArray) ? wordsArray : [];

// Initialize profanity filter
const badFilter = new Filter();

/**
 * Interface representing a crossword level/puzzle
 */
export interface CrosswordLevel {
  baseWord: string;
  letters: string[];
  crosswordWords: string[];
  difficulty: Difficulty;
  wordCount: number;
}

/**
 * Difficulty levels for crossword generation
 */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

/**
 * Configuration for each difficulty level
 */
interface DifficultyConfig {
  min: number;
  max: number;
  minWords: number;
  popularityRange: number;
}

/**
 * Mapping of difficulty levels to their configurations
 */
const difficultyMap: Record<Difficulty, DifficultyConfig> = {
  easy: { min: 4, max: 6, minWords: 8, popularityRange: 5000 },
  medium: { min: 5, max: 7, minWords: 12, popularityRange: 10000 },
  hard: { min: 6, max: 8, minWords: 16, popularityRange: 15000 },
  expert: { min: 7, max: 10, minWords: 20, popularityRange: 25000 }
};

/**
 * Options for crossword generation
 */
export interface CrosswordGenerationOptions {
  difficulty?: Difficulty;
  minSubwords?: number;
  allowProperNouns?: boolean;
  customWordList?: string[];
}

/**
 * Shuffles an array using Fisher-Yates algorithm (more random than sort-based shuffle)
 */
function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generates a random number from a normal distribution using Box-Muller transform
 */
function normalRandom(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}

/**
 * Checks if a word can be formed using letters from the base word
 */
function canFormWord(baseWord: string, word: string): boolean {
  const baseLetters = baseWord.toLowerCase().split('');
  const wordLetters = word.toLowerCase().split('');
  
  // Create a frequency map of base word letters
  const letterCount = new Map<string, number>();
  for (const letter of baseLetters) {
    letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
  }
  
  // Check if word can be formed
  for (const letter of wordLetters) {
    const count = letterCount.get(letter) || 0;
    if (count === 0) return false;
    letterCount.set(letter, count - 1);
  }
  
  return true;
}

/**
 * Validates if a word meets basic criteria
 */
function isValidWord(word: string, allowProperNouns = false): boolean {
  const normalized = word.toLowerCase().trim();
  
  // Basic validation
  if (!/^[a-z]+$/.test(normalized)) return false;
  if (normalized.length < 3 || normalized.length > 12) return false;
  
  // Check for profanity
  if (badFilter.isProfane(normalized)) return false;
  
  // Check for proper nouns if not allowed
  if (!allowProperNouns && word[0] === word[0].toUpperCase() && word.length > 1) {
    return false;
  }
  
  return true;
}

/**
 * Gets a filtered word list based on difficulty and options
 */
function getWordList(
  difficulty: Difficulty, 
  options: CrosswordGenerationOptions = {}
): string[] {
  const config = difficultyMap[difficulty];
  
  if (options.customWordList) {
    return options.customWordList.filter(word => 
      isValidWord(word, options.allowProperNouns)
    );
  }
  
  try {
    // Get words from the array and filter by popularity range (use array slice for range)
    if (words.length === 0) {
      throw new Error('No words available');
    }
    
    const maxWords = Math.min(config.popularityRange, words.length);
    const popularWords = words.slice(0, maxWords);
    const validWords = popularWords.filter(word => isValidWord(word, options.allowProperNouns));
    
    // Ensure we have some words
    if (validWords.length === 0) {
      throw new Error('No valid words found');
    }
    
    return validWords;
  } catch (error) {
    console.warn('Failed to get words, falling back to basic word list');
    // Fallback to a basic word list if the library fails
    return ['cat', 'dog', 'fish', 'bird', 'tree', 'house', 'car', 'book', 'game', 'play', 'water', 'fire', 'earth', 'wind', 'star', 'moon', 'sun', 'rock', 'sand', 'leaf'];
  }
}

/**
 * Finds all valid subwords that can be formed from the base word
 */
function findSubwords(baseWord: string, wordList: string[]): string[] {
  const subwords = new Set<string>(); // Use Set to avoid duplicates
  
  for (const word of wordList) {
    const normalized = word.toLowerCase();
    if (
      normalized.length >= 3 &&
      normalized.length <= baseWord.length &&
      normalized !== baseWord.toLowerCase() &&
      canFormWord(baseWord, normalized)
    ) {
      subwords.add(normalized);
    }
  }
  
  return Array.from(subwords).sort((a, b) => a.length - b.length);
}

/**
 * Selects the best base word based on the number of possible subwords
 */
function selectBestBaseWord(
  candidates: string[], 
  wordList: string[], 
  minSubwords: number
): { baseWord: string; subwords: string[] } | null {
  const wordScores: { word: string; subwords: string[]; score: number }[] = [];
  
  for (const candidate of candidates) {
    const subwords = findSubwords(candidate, wordList);
    if (subwords.length >= minSubwords) {
      // Score based on number of subwords and word length variety
      const lengthVariety = new Set(subwords.map(w => w.length)).size;
      const score = subwords.length * 0.7 + lengthVariety * 0.3;
      
      wordScores.push({
        word: candidate,
        subwords,
        score
      });
    }
  }
  
  if (wordScores.length === 0) return null;
  
  // Sort by score and pick the best one
  wordScores.sort((a, b) => b.score - a.score);
  const best = wordScores[0];
  
  return {
    baseWord: best.word,
    subwords: best.subwords
  };
}

/**
 * Generates a crossword level with the specified difficulty and options
 */
export function generateCrosswordLevel(
  options: CrosswordGenerationOptions = {}
): CrosswordLevel {
  const difficulty = options.difficulty || 'medium';
  const config = difficultyMap[difficulty];
  const minSubwords = options.minSubwords || config.minWords;
  
  const wordList = getWordList(difficulty, options);
  
  if (wordList.length === 0) {
    throw new Error('No valid words available for crossword generation');
  }
  
  // Filter candidates by length
  const candidates = wordList.filter(word => 
    word.length >= config.min && word.length <= config.max
  );
  
  if (candidates.length === 0) {
    throw new Error(`No valid base words for difficulty ${difficulty}`);
  }
  
  // Shuffle candidates to add randomness
  const shuffledCandidates = shuffle(candidates).slice(0, Math.min(50, candidates.length));
  
  const result = selectBestBaseWord(shuffledCandidates, wordList, minSubwords);
  
  if (!result) {
    throw new Error(`Could not find a base word with at least ${minSubwords} subwords`);
  }
  
  return {
    baseWord: result.baseWord.toLowerCase(),
    letters: shuffle(result.baseWord.toLowerCase().split('')),
    crosswordWords: result.subwords,
    difficulty,
    wordCount: result.subwords.length
  };
}

/**
 * Generates multiple crossword levels
 */
export function generateMultipleLevels(
  count: number,
  options: CrosswordGenerationOptions = {}
): CrosswordLevel[] {
  const levels: CrosswordLevel[] = [];
  const maxAttempts = count * 3; // Prevent infinite loops
  let attempts = 0;
  
  while (levels.length < count && attempts < maxAttempts) {
    try {
      const level = generateCrosswordLevel(options);
      
      // Ensure we don't have duplicate base words
      if (!levels.some(l => l.baseWord === level.baseWord)) {
        levels.push(level);
      }
    } catch (error) {
      console.warn(`Failed to generate level ${levels.length + 1}:`, error);
    }
    attempts++;
  }
  
  if (levels.length === 0) {
    throw new Error('Failed to generate any valid crossword levels');
  }
  
  return levels;
}

/**
 * Utility function to get random words from a list with normal distribution of word lengths
 */
export function getRandomWords(wordsList: string[], count: number): string[] {
  if (wordsList.length === 0 || count <= 0) {
    return [];
  }

  // If we need more words than available, return all available words
  if (count >= wordsList.length) {
    return [...wordsList];
  }

  // Calculate length statistics for the word list
  const lengths = wordsList.map(word => word.length);
  const minLength = Math.min(...lengths);
  const maxLength = Math.max(...lengths);
  const meanLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const stdDevLength = Math.sqrt(
    lengths.reduce((sum, len) => sum + Math.pow(len - meanLength, 2), 0) / lengths.length
  );

  // Group words by length for efficient selection
  const wordsByLength: Record<number, string[]> = {};
  for (const word of wordsList) {
    const len = word.length;
    if (!wordsByLength[len]) {
      wordsByLength[len] = [];
    }
    wordsByLength[len].push(word);
  }

  const selectedWords: string[] = [];
  const usedWords = new Set<string>();

  // Generate words following normal distribution of lengths
  for (let i = 0; i < count && selectedWords.length < Math.min(count, wordsList.length); i++) {
    let attempts = 0;
    const maxAttempts = 20; // Prevent infinite loops
    
    while (attempts < maxAttempts) {
      // Generate a length using normal distribution
      const targetLength = Math.round(normalRandom(meanLength, stdDevLength));
      const clampedLength = Math.max(minLength, Math.min(maxLength, targetLength));
      
      // Get words of this length
      const wordsOfLength = wordsByLength[clampedLength] || [];
      
      if (wordsOfLength.length > 0) {
        // Randomly select a word of the target length
        const availableWords = wordsOfLength.filter(word => !usedWords.has(word));
        
        if (availableWords.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableWords.length);
          const selectedWord = availableWords[randomIndex];
          selectedWords.push(selectedWord);
          usedWords.add(selectedWord);
          break;
        }
      }
      
      attempts++;
    }
    
    // Fallback: if we couldn't find a word with normal distribution, pick any unused word
    if (attempts >= maxAttempts && selectedWords.length < count) {
      const remainingWords = wordsList.filter(word => !usedWords.has(word));
      if (remainingWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingWords.length);
        const selectedWord = remainingWords[randomIndex];
        selectedWords.push(selectedWord);
        usedWords.add(selectedWord);
      }
    }
  }

  return selectedWords;
}

/**
 * Utility function to get words within a specific length range
 */
export function getWordsInRange(
  wordsList: string[], 
  minLength: number, 
  maxLength: number
): string[] {
  return wordsList.filter(word => 
    word.length >= minLength && word.length <= maxLength
  );
}

/**
 * Interface for filtering criteria
 */
export interface WordFilterCriteria {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  allowProperNouns?: boolean;
  excludeProfanity?: boolean;
  customValidator?: (word: string) => boolean;
}

/**
 * Comprehensive function to filter words list based on multiple criteria
 */
export function filterWordsList(
  wordsList: string[], 
  criteria: WordFilterCriteria = {}
): string[] {
  const {
    minLength = 1,
    maxLength = Infinity,
    minValue,
    maxValue,
    allowProperNouns = false,
    excludeProfanity = true,
    customValidator
  } = criteria;

  return wordsList.filter(word => {
    const trimmedWord = word.trim();
    
    // Length filtering
    if (trimmedWord.length < minLength || trimmedWord.length > maxLength) {
      return false;
    }

    // Value filtering (if min/max values are provided, treat them as length constraints)
    if (minValue !== undefined && trimmedWord.length < minValue) {
      return false;
    }
    if (maxValue !== undefined && trimmedWord.length > maxValue) {
      return false;
    }

    // Proper noun filtering
    if (!allowProperNouns && trimmedWord[0] === trimmedWord[0].toUpperCase() && trimmedWord.length > 1) {
      return false;
    }

    // Profanity filtering
    if (excludeProfanity && badFilter.isProfane(trimmedWord.toLowerCase())) {
      return false;
    }

    // Basic word validation (only alphabetic characters)
    if (!/^[a-zA-Z]+$/.test(trimmedWord)) {
      return false;
    }

    // Custom validation
    if (customValidator && !customValidator(trimmedWord)) {
      return false;
    }

    return true;
  });
}

/**
 * Analyzes a crossword level to provide statistics
 */
export function analyzeCrosswordLevel(level: CrosswordLevel): {
  averageWordLength: number;
  lengthDistribution: Record<number, number>;
  uniqueLetters: number;
  commonLetters: string[];
} {
  const lengths = level.crosswordWords.map(w => w.length);
  const averageWordLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  
  const lengthDistribution: Record<number, number> = {};
  for (const length of lengths) {
    lengthDistribution[length] = (lengthDistribution[length] || 0) + 1;
  }
  
  const allLetters = level.baseWord.split('');
  const uniqueLetters = new Set(allLetters).size;
  
  const letterFreq = new Map<string, number>();
  for (const letter of allLetters) {
    letterFreq.set(letter, (letterFreq.get(letter) || 0) + 1);
  }
  
  const commonLetters = Array.from(letterFreq.entries())
    .filter(([_, freq]) => freq > 1)
    .map(([letter, _]) => letter);
  
  return {
    averageWordLength: Math.round(averageWordLength * 100) / 100,
    lengthDistribution,
    uniqueLetters,
    commonLetters
  };
}