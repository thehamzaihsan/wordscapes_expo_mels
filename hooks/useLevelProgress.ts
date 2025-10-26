import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

interface TempLevelProgress {
  categoryName: string;
  level: number;
  foundCrosswordWords: string[];
  foundBonusWords: string[];
  score: number;
  lastPlayed: string; // ISO string
}

const TEMP_PROGRESS_KEY = '@temp_level_progress';

/**
 * Hook for managing temporary level progress that persists locally
 * but is NOT synced to the cloud. This allows players to resume
 * levels where they left off.
 */
export function useLevelProgress(categoryName?: string, level?: number) {
  const [tempProgress, setTempProgress] = useState<TempLevelProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate unique key for this level
  const levelKey = categoryName && level ? `${categoryName}_${level}` : null;

  // Load temporary progress for this level
  const loadTempProgress = useCallback(async () => {
    if (!levelKey) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(`${TEMP_PROGRESS_KEY}_${levelKey}`);
      if (stored) {
        const parsed: TempLevelProgress = JSON.parse(stored);
        
        // Check if progress is recent (within 24 hours)
        const lastPlayed = new Date(parsed.lastPlayed);
        const now = new Date();
        const hoursSinceLastPlayed = (now.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastPlayed < 24) {
          setTempProgress(parsed);
          console.log(`[TempProgress] Loaded progress for ${levelKey}:`, {
            crosswordWords: parsed.foundCrosswordWords.length,
            bonusWords: parsed.foundBonusWords.length,
            score: parsed.score,
            age: `${hoursSinceLastPlayed.toFixed(1)}h ago`
          });
        } else {
          // Progress is too old, clear it
          await clearTempProgress();
          console.log(`[TempProgress] Cleared old progress for ${levelKey} (${hoursSinceLastPlayed.toFixed(1)}h old)`);
        }
      }
    } catch (error) {
      console.warn('Failed to load temporary progress:', error);
    }
    
    setIsLoading(false);
  }, [levelKey]);

  // Save temporary progress for this level
  const saveTempProgress = useCallback(async (
    foundCrosswordWords: string[],
    foundBonusWords: string[],
    currentScore: number
  ) => {
    if (!levelKey || !categoryName || !level) return;

    try {
      const progress: TempLevelProgress = {
        categoryName,
        level,
        foundCrosswordWords: [...foundCrosswordWords],
        foundBonusWords: [...foundBonusWords],
        score: currentScore,
        lastPlayed: new Date().toISOString()
      };

      await AsyncStorage.setItem(`${TEMP_PROGRESS_KEY}_${levelKey}`, JSON.stringify(progress));
      setTempProgress(progress);
      
      console.log(`[TempProgress] Saved progress for ${levelKey}:`, {
        crosswordWords: foundCrosswordWords.length,
        bonusWords: foundBonusWords.length,
        score: currentScore
      });
    } catch (error) {
      console.error('Failed to save temporary progress:', error);
    }
  }, [levelKey, categoryName, level]);

  // Clear temporary progress for this level
  const clearTempProgress = useCallback(async () => {
    if (!levelKey) return;

    try {
      await AsyncStorage.removeItem(`${TEMP_PROGRESS_KEY}_${levelKey}`);
      setTempProgress(null);
      console.log(`[TempProgress] Cleared progress for ${levelKey}`);
    } catch (error) {
      console.error('Failed to clear temporary progress:', error);
    }
  }, [levelKey]);

  // Auto-load progress when level changes
  useEffect(() => {
    loadTempProgress();
  }, [loadTempProgress]);

  return {
    tempProgress,
    isLoading,
    saveTempProgress,
    clearTempProgress,
    hasTempProgress: !!tempProgress && (
      tempProgress.foundCrosswordWords.length > 0 || 
      tempProgress.foundBonusWords.length > 0
    )
  };
}

/**
 * Utility function to clean up old temporary progress data
 * This can be called on app startup to prevent storage bloat
 */
export async function cleanupOldTempProgress(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const tempProgressKeys = allKeys.filter(key => key.startsWith(TEMP_PROGRESS_KEY));
    
    const keysToDelete: string[] = [];
    
    for (const key of tempProgressKeys) {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const parsed: TempLevelProgress = JSON.parse(stored);
          const lastPlayed = new Date(parsed.lastPlayed);
          const now = new Date();
          const hoursSinceLastPlayed = (now.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60);
          
          // Delete progress older than 24 hours
          if (hoursSinceLastPlayed >= 24) {
            keysToDelete.push(key);
          }
        }
      } catch (error) {
        // If we can't parse the data, delete it
        keysToDelete.push(key);
      }
    }
    
    if (keysToDelete.length > 0) {
      await AsyncStorage.multiRemove(keysToDelete);
      console.log(`[TempProgress] Cleaned up ${keysToDelete.length} old progress entries`);
    }
  } catch (error) {
    console.warn('Failed to cleanup old temporary progress:', error);
  }
}

/**
 * Get all current temporary progress entries (for debugging)
 */
export async function getAllTempProgress(): Promise<TempLevelProgress[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const tempProgressKeys = allKeys.filter(key => key.startsWith(TEMP_PROGRESS_KEY));
    
    const progressEntries: TempLevelProgress[] = [];
    
    for (const key of tempProgressKeys) {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const parsed: TempLevelProgress = JSON.parse(stored);
          progressEntries.push(parsed);
        }
      } catch (error) {
        console.warn(`Failed to parse temporary progress for key ${key}:`, error);
      }
    }
    
    return progressEntries;
  } catch (error) {
    console.warn('Failed to get all temporary progress:', error);
    return [];
  }
}