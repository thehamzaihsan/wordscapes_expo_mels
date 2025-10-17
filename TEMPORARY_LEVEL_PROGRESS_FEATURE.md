# Temporary Level Progress Feature

## Overview
Implemented a system to save and restore temporary level progress locally, allowing players to resume levels exactly where they left off without losing found words when they leave and return to a level.

## Problem Solved
Previously, when players entered a level, found some words, and then left (either by going back or closing the app), all their progress in that level would be lost. They would have to start the level completely over again, which was frustrating for players.

## Solution: Local Temporary Progress Storage

### 1. New Hook: `useLevelProgress`

#### Features
- **Local Storage Only**: Uses AsyncStorage, NOT synced to cloud
- **Level-Specific**: Tracks progress per category and level
- **Time-Based Expiry**: Automatically cleans up progress older than 24 hours
- **Automatic Loading**: Restores progress when returning to a level

#### Data Structure
```typescript
interface TempLevelProgress {
  categoryName: string;      // Category of the level
  level: number;             // Level number
  foundCrosswordWords: string[];  // Crossword words found
  foundBonusWords: string[];      // Bonus words found
  score: number;             // Current score
  lastPlayed: string;        // ISO timestamp of last play
}
```

### 2. Integration with Game Logic

#### Automatic Progress Saving
- **Triggers**: Saves progress whenever words are found or score changes
- **Debouncing**: 1-second delay to avoid excessive saves
- **Conditions**: Only saves if game is not completed and has progress

#### Progress Restoration
- **On Game Load**: Automatically restores found words and score
- **User Feedback**: Shows toast message indicating restored progress
- **Seamless**: Players continue exactly where they left off

### 3. Smart Cleanup System

#### Automatic Cleanup
- **App Startup**: Cleans up progress older than 24 hours
- **Storage Efficiency**: Prevents AsyncStorage bloat
- **Error Recovery**: Removes corrupted progress data

#### Manual Management
- **Game Completion**: Automatically clears temporary progress
- **Utility Functions**: Debug functions to view/manage all temp progress

## Technical Implementation

### Hook Usage
```typescript
const {
  tempProgress,      // Current temporary progress or null
  isLoading,         // Whether progress is being loaded
  saveTempProgress,  // Function to save current progress
  clearTempProgress, // Function to clear progress
  hasTempProgress    // Boolean indicating if usable progress exists
} = useLevelProgress(categoryName, level);
```

### Game Integration
```typescript
// Restore progress after game initialization
useEffect(() => {
  if (!tempProgressLoading && !loading && tempProgress && hasTempProgress) {
    setFoundCrosswordWords(tempProgress.foundCrosswordWords);
    setFoundBonusWords(tempProgress.foundBonusWords);
    setScore(tempProgress.score);
    showToast(`Restored progress: ${totalWords} words found`, 'info');
  }
}, [tempProgressLoading, loading, tempProgress, hasTempProgress]);

// Save progress on changes
useEffect(() => {
  if (!loading && !gameComplete && hasProgress) {
    const timeoutId = setTimeout(() => {
      saveTempProgress(foundCrosswordWords, foundBonusWords, score);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }
}, [foundCrosswordWords, foundBonusWords, score]);
```

## User Experience Flow

### 1. Starting a Level
- Player enters a level for the first time
- No temporary progress exists
- Game starts normally with empty progress

### 2. Playing and Leaving
- Player finds some words (crossword and/or bonus)
- Progress is automatically saved locally every second (debounced)
- Player leaves the level (back button, app close, etc.)
- Progress remains stored locally

### 3. Returning to Level
- Player re-enters the same level
- Hook checks for temporary progress
- If found and recent (< 24 hours), progress is restored
- Toast message shows "Restored progress: X words found"
- Game continues with found words and score intact

### 4. Completing Level
- Player completes the level
- Temporary progress is automatically cleared
- Permanent progress is saved to guest progress system
- No temporary data remains for this level

## Storage Management

### Data Location
- **Storage**: AsyncStorage (local device only)
- **Key Pattern**: `@temp_level_progress_{categoryName}_{level}`
- **Not Synced**: Deliberately excluded from cloud sync

### Cleanup Strategy
- **Time-Based**: Progress older than 24 hours is deleted
- **App Startup**: Cleanup runs when app starts
- **Completion**: Progress cleared when level completed
- **Error Handling**: Corrupted data automatically removed

## Benefits

### ✅ **Player Experience**
- **No Lost Progress**: Found words persist across sessions
- **Seamless Resume**: Continue exactly where left off
- **Reduced Frustration**: No need to re-find words
- **Flexible Playing**: Can leave and return without penalty

### ✅ **Technical Benefits**
- **Local Only**: No cloud storage or sync complexity
- **Efficient**: Minimal storage impact with automatic cleanup
- **Reliable**: Works offline and doesn't depend on network
- **Performant**: Debounced saves prevent excessive I/O

### ✅ **Game Design**
- **Encourages Exploration**: Players can safely explore levels
- **Reduces Pressure**: No fear of losing progress
- **Natural Flow**: Supports interrupted gameplay sessions
- **Progressive Discovery**: Maintains sense of progression

## Implementation Files

### New Files
- `/hooks/useLevelProgress.ts` - Main temporary progress hook
- `/TEMPORARY_LEVEL_PROGRESS_FEATURE.md` - This documentation

### Modified Files
- `/app/components/game/useGameLogic.tsx` - Integrated progress saving/loading
- `/app/_layout.tsx` - Added cleanup on app startup

## Future Enhancements

### Potential Improvements
1. **Visual Indicators**: Show progress restoration in UI
2. **Progress Preview**: Show saved progress before entering level
3. **Manual Clear**: Allow players to manually reset level progress
4. **Analytics**: Track how often players benefit from this feature

### Configuration Options
```typescript
// Possible future settings
interface TempProgressConfig {
  enabled: boolean;           // Allow disabling the feature
  expiryHours: number;       // Customize expiry time
  maxEntries: number;        // Limit number of saved levels
  showToastOnRestore: boolean; // Control restoration feedback
}
```

## Testing Scenarios

### Basic Flow
1. Enter level, find some words
2. Leave level (back button)
3. Re-enter level
4. ✅ Progress should be restored

### Edge Cases
1. **App Kill**: Close app completely, reopen, enter level
2. **Time Expiry**: Wait 25+ hours, progress should be cleared
3. **Level Completion**: Complete level, temporary progress should be cleared
4. **Storage Full**: Graceful handling of storage errors
5. **Corrupted Data**: Automatic cleanup of invalid progress data

This feature significantly improves the player experience by eliminating the frustration of lost progress when levels are interrupted, making the game more accessible and enjoyable for casual play sessions.