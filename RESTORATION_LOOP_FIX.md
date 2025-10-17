# Restoration Loop Fix

## Problem Identified
The temporary progress restoration effect was running in an infinite loop, causing it to overwrite newly found words with the old saved progress every time the user found a new word.

## Root Cause Analysis

### The Infinite Loop Issue
```typescript
// This effect was running repeatedly
useEffect(() => {
  // Restoration logic that updates foundCrosswordWords, foundBonusWords, score
  setFoundCrosswordWords(validCrosswordWords); // This triggers re-render
  setFoundBonusWords(validBonusWords);         // This triggers re-render  
  setScore(tempProgress.score);                // This triggers re-render
}, [/* foundCrosswordWords, foundBonusWords in dependencies */]);
```

### The Vicious Cycle
1. **User finds new word** → `foundCrosswordWords` state updates
2. **Restoration effect triggers** (because `foundCrosswordWords` is in dependency array)
3. **Restoration overwrites progress** → Sets `foundCrosswordWords` back to saved state
4. **User's new word is lost** → Only the old saved words remain
5. **User tries to find same word again** → Gets "duplicate" error because it's in saved state
6. **User can't progress** → Stuck with only restored words

### Dependency Array Problem
```typescript
}, [tempProgressLoading, loading, tempProgress, hasTempProgress, 
    gameGrid, wordPlacements, crosswordWords, allValidWords]);
//                                               ^^^^^^^^^^^^
// These arrays include the very state that restoration modifies!
```

When restoration runs and updates `foundCrosswordWords`, it causes the entire component to re-render. Since the restoration effect depends on game state that includes word arrays, any change to found words would trigger restoration again.

## Solution Implemented

### 1. Added Restoration Flag
```typescript
// Flag to track if restoration has already been performed
const restorationPerformed = useRef(false);
```

### 2. One-Time Restoration Check
```typescript
useEffect(() => {
  if (!tempProgressLoading && !loading && tempProgress && hasTempProgress && 
      gameGrid && wordPlacements.length > 0 && crosswordWords.length > 0 &&
      !restorationPerformed.current) { // ← Prevents multiple executions
    
    console.log('[TempProgress] Performing ONE-TIME restoration');
    restorationPerformed.current = true; // ← Set flag immediately
    
    // ... restoration logic
  }
}, [tempProgressLoading, loading, tempProgress, hasTempProgress, 
    gameGrid, wordPlacements, crosswordWords, allValidWords]);
```

### 3. Reset Flag on New Level
```typescript
useEffect(() => {
  // Reset restoration flag when new level loads
  restorationPerformed.current = false;
  
  // ... game initialization logic
}, [baseWord, difficulty, levelData, /* other level-specific deps */]);
```

### 4. Enhanced Debugging
```typescript
console.log('[TempProgress] Restoration effect triggered:', {
  tempProgressLoading,
  loading,
  hasTempProgress,
  hasGameGrid: !!gameGrid,
  wordPlacementsLength: wordPlacements.length,
  crosswordWordsLength: crosswordWords.length,
  restorationPerformed: restorationPerformed.current // ← Shows if already restored
});
```

## How The Fix Works

### Before (Broken Cycle)
```
1. Level loads → Restoration runs → Words restored
2. User finds "TREE" → foundCrosswordWords updates → Component re-renders
3. Restoration effect sees state change → Runs again → Overwrites with old state
4. "TREE" disappears from found words → User confused
5. User tries "TREE" again → "Duplicate" error (because it's in saved state)
6. User can't progress → Restoration keeps overwriting new words
```

### After (Fixed Flow)
```
1. Level loads → restorationPerformed.current = false
2. Restoration effect runs → Sets restorationPerformed.current = true
3. Words restored → foundCrosswordWords updates → Component re-renders
4. Restoration effect sees state change → Checks flag → SKIPS execution
5. User finds "TREE" → foundCrosswordWords updates normally
6. User can continue playing → No more restoration interference
```

## Technical Details

### Ref vs State for Flag
Using `useRef` instead of `useState` for the restoration flag because:
- **No Re-renders**: `useRef` changes don't trigger component re-renders
- **Persistent**: Value persists across re-renders but doesn't cause them
- **Immediate**: Can be set and checked synchronously within the same render cycle

### Flag Reset Strategy
The flag is reset in the game initialization effect:
```typescript
useEffect(() => {
  restorationPerformed.current = false; // Reset for new level
  // ... initialization
}, [baseWord, difficulty, levelData, ...]);
```

This ensures that:
- **New Levels**: Each level gets one restoration opportunity
- **Level Restart**: Restarting same level allows restoration again
- **Clean State**: No stale restoration flags across level changes

### Debugging Output
The enhanced logging shows exactly when and why the effect runs:
```
[TempProgress] Restoration effect triggered: {
  tempProgressLoading: false,
  loading: false,
  hasTempProgress: true,
  hasGameGrid: true,
  wordPlacementsLength: 5,
  crosswordWordsLength: 5,
  restorationPerformed: false  // ← Will be true after first restoration
}
```

## Expected Behavior After Fix

### ✅ **One-Time Restoration**
1. **Level Entry**: Restoration runs exactly once per level
2. **Progress Restored**: Found words and score properly restored
3. **Flag Set**: Further restoration attempts blocked

### ✅ **Normal Gameplay After Restoration**
1. **New Words**: User can find additional words normally
2. **State Persistence**: New words stay found (no overwriting)
3. **Progression**: User can complete levels normally
4. **Saving**: New progress saves to temporary storage

### ✅ **Level Transitions**
1. **New Level**: Restoration flag resets for next level
2. **Same Level**: Returning to same level triggers restoration again
3. **Clean State**: No interference between different levels

## Testing Scenarios

### 1. Basic Restoration + Continue Playing
1. Find word "CAT" in level
2. Leave and return → "CAT" restored
3. Find word "DOG" → Should work normally
4. Both "CAT" and "DOG" should remain found

### 2. Partial Progress + Completion
1. Find 2/5 words, leave and return
2. Words restored correctly
3. Find remaining 3 words → Should work
4. Level completes normally

### 3. Multiple Level Transitions
1. Level A: Find words, leave
2. Level B: Play normally
3. Return to Level A → Only Level A progress restored
4. Continue Level A → Works normally

This fix eliminates the restoration loop completely while maintaining all the benefits of temporary progress saving.