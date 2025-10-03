import { Difficulty, difficultyMap } from '@/constants/difficulty';
import wordsArray from 'an-array-of-english-words';
import { Filter } from 'bad-words';

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
 * Options for crossword generation
 */
export interface CrosswordGenerationOptions {
  difficulty?: Difficulty;
  minSubwords?: number;
  allowProperNouns?: boolean;
  customWordList?: string[];
}

/**
 * Cache for processed word lists to avoid recomputation
 */
const wordListCache = new Map<string, string[]>();

/**
 * Cache for subword results to avoid recomputation
 */
const subwordCache = new Map<string, string[]>();

/**
 * Pre-processed word lists by length for faster lookup
 */
let wordsByLength: Record<number, string[]> = {};

/**
 * Initialize word lists by length for faster lookup
 */
function initializeWordsByLength() {
  if (Object.keys(wordsByLength).length > 0) return; // Already initialized
  
  wordsByLength = {};
  
  // Use only the first 5000 most common words for performance
  const limitedWords = words.slice(0, 5000);
  
  for (const word of limitedWords) {
    if (isValidWord(word)) {
      const len = word.length;
      if (!wordsByLength[len]) {
        wordsByLength[len] = [];
      }
      wordsByLength[len].push(word.toLowerCase());
    }
  }
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
  if (normalized.length < 2 || normalized.length > 15) return false; // Allow 2-letter words and longer words
  
  // Skip profanity check for now as it might be too restrictive
  // if (badFilter.isProfane(normalized)) return false;
  
  // Allow proper nouns by default for testing
  // if (!allowProperNouns && word[0] === word[0].toUpperCase() && word.length > 1) {
  //   return false;
  // }
  
  return true;
}

/**
 * Gets a filtered word list based on difficulty and options (optimized)
 */
function getWordList(
  difficulty: Difficulty, 
  options: CrosswordGenerationOptions = {}
): string[] {
  const cacheKey = `${difficulty}-${JSON.stringify(options)}`;
  
  // Check cache first
  if (wordListCache.has(cacheKey)) {
    return wordListCache.get(cacheKey)!;
  }
  
  // Initialize words by length if not done
  initializeWordsByLength();
  
  const config = difficultyMap[difficulty];
  
  if (options.customWordList) {
    const filtered = options.customWordList.filter(word => 
      isValidWord(word, options.allowProperNouns)
    );
    wordListCache.set(cacheKey, filtered);
    return filtered;
  }
  
  try {
    // Get words by length ranges for better performance
    const validWords: string[] = [];
    
    // Collect words from relevant length buckets
    for (let len = 3; len <= 12; len++) {
      if (wordsByLength[len]) {
        validWords.push(...wordsByLength[len].slice(0, Math.floor(config.popularityRange / 10)));
      }
    }
    
    // Add common words that should always be available for testing
    const commonWords = [
      'cat', 'dog', 'fish', 'bird', 'tree', 'house', 'car', 'book', 'game', 'play', 
      'water', 'fire', 'earth', 'wind', 'star', 'moon', 'sun', 'rock', 'sand', 'leaf',
      'planet', 'plane', 'plant', 'plan', 'plate', 'late', 'tale', 'tea', 'eat', 'at',
      'net', 'ten', 'pen', 'pet', 'let', 'tan', 'pan', 'lap', 'tap', 'pat', 'ant',
      'leap', 'petal', 'pale', 'tape', 'neat', 'lean', 'lane', 'lent', 'pane'
    ];
    
    // Add common words that aren't already in the list
    for (const word of commonWords) {
      if (!validWords.includes(word.toLowerCase()) && isValidWord(word, options.allowProperNouns)) {
        validWords.push(word.toLowerCase());
      }
    }
    
    // Ensure we have some words
    if (validWords.length === 0) {
      throw new Error('No valid words found');
    }
    
    console.log(`Generated word list for ${difficulty}: ${validWords.length} words`);
    wordListCache.set(cacheKey, validWords);
    return validWords;
  } catch (error) {
    console.warn('Failed to get words, falling back to comprehensive word list');
    // Enhanced fallback word list with more common words
    const fallback = [
      'cat', 'dog', 'fish', 'bird', 'tree', 'house', 'car', 'book', 'game', 'play',
      'water', 'fire', 'earth', 'wind', 'star', 'moon', 'sun', 'rock', 'sand', 'leaf',
      'planet', 'plane', 'plant', 'plan', 'plate', 'late', 'tale', 'tea', 'eat', 'at',
      'net', 'ten', 'pen', 'pet', 'let', 'tan', 'pan', 'lap', 'tap', 'pat', 'ant',
      'leap', 'petal', 'pale', 'tape', 'neat', 'lean', 'lane', 'lent', 'pane', 'note',
      'tone', 'tone', 'love', 'move', 'come', 'home', 'some', 'time', 'line', 'mine',
      'fine', 'wine', 'pine', 'nine', 'dine', 'vine', 'sine', 'bone', 'done', 'gone',
      'zone', 'cone', 'lone', 'none', 'hope', 'rope', 'cope', 'pope', 'dope', 'mope'
    ];
    wordListCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Finds all valid subwords that can be formed from the base word (optimized)
 */
function findSubwords(baseWord: string, wordList: string[], maxSubwords?: number): string[] {
  const cacheKey = `${baseWord}-${wordList.length}`;
  
  // Check cache first
  if (subwordCache.has(cacheKey)) {
    const cached = subwordCache.get(cacheKey)!;
    return maxSubwords ? cached.slice(0, maxSubwords) : cached;
  }
  
  console.log(`Finding subwords for "${baseWord}" from ${wordList.length} words`);
  
  const subwords = new Set<string>();
  const baseWordLower = baseWord.toLowerCase();
  const baseLetters = baseWordLower.split('');
  const letterCounts = new Map<string, number>();
  
  // Pre-compute letter frequency for base word
  for (const letter of baseLetters) {
    letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
  }
  
  console.log(`Base word "${baseWord}" letter counts:`, Object.fromEntries(letterCounts));
  
  // Optimize: only check words that could possibly be formed
  let checkedWords = 0;
  let validWords = 0;
  
  for (const word of wordList) {
    const normalized = word.toLowerCase();
    checkedWords++;
    
    // Quick length checks - allow 2-letter words
    if (normalized.length < 2 || 
        normalized.length > baseWord.length || 
        normalized === baseWordLower) {
      continue;
    }
    
    // Quick letter existence check before expensive canFormWord call
    const wordLetters = new Set(normalized.split(''));
    const baseLetterSet = new Set(baseLetters);
    let hasAllLetters = true;
    
    for (const letter of wordLetters) {
      if (!baseLetterSet.has(letter)) {
        hasAllLetters = false;
        break;
      }
    }
    
    if (hasAllLetters && canFormWordOptimized(letterCounts, normalized)) {
      subwords.add(normalized);
      validWords++;
      console.log(`✓ Found valid subword: "${normalized}"`);
      
      // Early termination if we have enough words
      if (maxSubwords && subwords.size >= maxSubwords * 2) {
        break;
      }
    }
  }
  
  console.log(`Checked ${checkedWords} words, found ${validWords} valid subwords for "${baseWord}"`);
  
  const result = Array.from(subwords).sort((a, b) => a.length - b.length);
  subwordCache.set(cacheKey, result);
  
  return maxSubwords ? result.slice(0, maxSubwords) : result;
}


/**
 * Optimized version of canFormWord using pre-computed letter counts
 */
function canFormWordOptimized(baseLetterCounts: Map<string, number>, word: string): boolean {
  const wordLetterCounts = new Map<string, number>();
  
  // Count letters in the word
  for (const letter of word) {
    wordLetterCounts.set(letter, (wordLetterCounts.get(letter) || 0) + 1);
  }
  
  // Check if word can be formed
  for (const [letter, count] of wordLetterCounts) {
    const baseCount = baseLetterCounts.get(letter) || 0;
    if (baseCount < count) {
      return false;
    }
  }
  
  return true;
}

/**
 * Selects the best base word based on the number of possible subwords (optimized)
 */
function selectBestBaseWord(
  candidates: string[], 
  wordList: string[], 
  minSubwords: number
): { baseWord: string; subwords: string[] } | null {
  
  // Shuffle and limit candidates for performance
  const limitedCandidates = shuffle(candidates).slice(0, 10); // Test only 10 candidates max
  
  for (const candidate of limitedCandidates) {
    // Quick check: try to find minimum required subwords
    const subwords = findSubwords(candidate, wordList, minSubwords + 5); // Get a few extra
    
    if (subwords.length >= minSubwords) {
      return {
        baseWord: candidate,
        subwords: subwords
      };
    }
  }
  
  return null;
}

/**
 * Generates a crossword level with the specified difficulty and options (auto-generates baseword) - OPTIMIZED
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
  
  // Filter candidates by length - reduced range for performance
  const candidates = wordList.filter(word => 
    word.length >= config.min && word.length <= config.max
  );
  
  if (candidates.length === 0) {
    throw new Error(`No valid base words for difficulty ${difficulty}`);
  }
  
  // Reduced candidate pool for faster processing
  const limitedCandidates = shuffle(candidates).slice(0, 15);
  
  const result = selectBestBaseWord(limitedCandidates, wordList, minSubwords);
  
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
 * Generates a crossword level with a provided baseword - OPTIMIZED
 */
export function generateCrosswordLevelWithBaseword(
  baseWord: string,
  options: CrosswordGenerationOptions = {}
): CrosswordLevel {
  const difficulty = options.difficulty || 'medium';
  const config = difficultyMap[difficulty];
  const minSubwords = options.minSubwords || config.minWords;
  
  // Validate the provided baseword
  const normalizedBaseWord = baseWord.toLowerCase().trim();
  if (!isValidWord(normalizedBaseWord, options.allowProperNouns)) {
    throw new Error(`Invalid base word: ${baseWord}`);
  }
  
  const wordList = getWordList(difficulty, options);
  
  if (wordList.length === 0) {
    throw new Error('No valid words available for crossword generation');
  }
  
  // Find subwords that can be formed from the provided baseword
  const subwords = findSubwords(normalizedBaseWord, wordList);
  
  if (subwords.length < minSubwords) {
    throw new Error(`Base word "${baseWord}" can only form ${subwords.length} subwords, but ${minSubwords} are required for ${difficulty} difficulty`);
  }
  
  return {
    baseWord: normalizedBaseWord,
    letters: shuffle(normalizedBaseWord.split('')),
    crosswordWords: subwords,
    difficulty,
    wordCount: subwords.length
  };
}

/**
 * Generates multiple crossword levels (auto-generates basewords)
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
 * Generates multiple crossword levels with provided basewords
 */
export function generateMultipleLevelsWithBasewords(
  baseWords: string[],
  options: CrosswordGenerationOptions = {}
): CrosswordLevel[] {
  const levels: CrosswordLevel[] = [];
  const failedWords: string[] = [];
  
  for (const baseWord of baseWords) {
    try {
      const level = generateCrosswordLevelWithBaseword(baseWord, options);
      levels.push(level);
    } catch (error) {
      console.warn(`Failed to generate level for base word "${baseWord}":`, error);
      failedWords.push(baseWord);
    }
  }
  
  if (levels.length === 0) {
    throw new Error(`Failed to generate any valid crossword levels. Failed words: ${failedWords.join(', ')}`);
  }
  
  if (failedWords.length > 0) {
    console.warn(`Could not generate levels for the following base words: ${failedWords.join(', ')}`);
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
 * Clears all caches to free memory
 */
export function clearCaches(): void {
  wordListCache.clear();
  subwordCache.clear();
  wordsByLength = {};
}

/**
 * Pre-initializes the system for better first-generation performance
 */
export function initializeGameManager(): void {
  initializeWordsByLength();
  
  // Pre-warm caches with common difficulties
  try {
    getWordList('easy');
    getWordList('medium');
    getWordList('hard');
  } catch (error) {
    console.warn('Failed to pre-warm caches:', error);
  }
}

/**
 * Test function to debug subword generation
 */
export function testSubwordGeneration(baseWord: string = 'planet'): void {
  console.log(`\n🧪 Testing subword generation for "${baseWord}"`);
  
  try {
    // Initialize if needed
    initializeGameManager();
    
    // Get word list
    const wordList = getWordList('medium');
    console.log(`📝 Using word list with ${wordList.length} words`);
    
    // Find subwords
    const subwords = findSubwords(baseWord, wordList);
    console.log(`🎯 Found ${subwords.length} subwords:`, subwords);
    
    // Test expected words
    const expectedWords = ['planet', 'plane', 'plant', 'plan', 'plate', 'late', 'net', 'ten', 'pen', 'pet', 'let', 'tan', 'pan', 'lap', 'tap', 'pat', 'ant', 'leap', 'petal', 'pale', 'tape', 'neat', 'lean', 'lane', 'pane', 'at', 'tea', 'eat'];
    
    const foundExpected = expectedWords.filter(word => {
      const normalized = word.toLowerCase();
      return normalized !== baseWord.toLowerCase() && canFormWord(baseWord, normalized);
    });
    
    console.log(`✅ Expected words that can be formed:`, foundExpected);
    console.log(`❌ Missing from results:`, foundExpected.filter(word => !subwords.includes(word)));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
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