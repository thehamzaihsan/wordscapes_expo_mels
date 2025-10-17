# Energy Deduction Fix

## Problem Identified
Energy was being deducted every time a player opened a level, regardless of whether they completed it or not. This was unfair to players who might want to preview a level or who accidentally opened the wrong level.

## Root Cause Analysis

### Current (Incorrect) Flow
1. **Player opens level** → Energy deducted immediately
2. **Player plays level** → No additional energy cost
3. **Player completes level** → No energy deduction (already taken)
4. **Problem**: Player loses energy even if they don't complete the level

### Issues with Current Approach
- **Unfair Penalty**: Players lose energy for just looking at a level
- **Accidental Opens**: No way to recover from misclicks
- **Preview Punishment**: Can't explore levels without cost
- **Incomplete Games**: Energy lost even if level not finished

## Solution Implemented

### New (Correct) Flow
1. **Player opens level** → Energy check (but no deduction)
2. **Player plays level** → No energy cost during gameplay
3. **Player completes level** → Energy deducted on completion
4. **Benefit**: Energy only spent on actual completions

### Changes Made

#### 1. Removed Energy Deduction from Level Entry
**File**: `LevelScreen.tsx`

**Before (Incorrect):**
```typescript
const handleLevelPress = async (level: LevelData, categoryName: string) => {
  // Check energy
  if (currentEnergy < energyCost) {
    return; // Prevent access
  }

  // Deduct energy immediately on level open
  const energyDeducted = await deductEnergyForLevel();
  if (!energyDeducted) {
    return;
  }

  // Navigate to level (energy already gone)
  onNavigate("game", { levelData: fullDef, categoryName });
};
```

**After (Fixed):**
```typescript
const handleLevelPress = async (level: LevelData, categoryName: string) => {
  // Check if player has enough energy (but don't deduct yet)
  if (currentEnergy < energyCost) {
    return; // Prevent access if insufficient energy
  }

  // Navigate to level (no energy deduction yet)
  onNavigate("game", { levelData: fullDef, categoryName });
};
```

#### 2. Added Energy Deduction to Level Completion
**File**: `guest-progress.ts`

**Enhanced `completeLevelAndPersist` Function:**
```typescript
export async function completeLevelAndPersist(params: {
  category: string;
  levelNumber: number;
  score: number;
  // ... other params
}): Promise<GuestProgressPayload | null> {
  let progress = await loadGuestProgress();
  if (!progress) return null;
  
  // Deduct energy when level is completed
  const energyCost = economy.energy.costPerLevel;
  const currentEnergy = progress.meta.energy || 0;
  
  if (currentEnergy >= energyCost) {
    progress.meta.energy = Math.max(0, progress.meta.energy - energyCost);
    progress.meta.lastEnergyUpdate = new Date().toISOString();
    console.log(`[Energy] Deducted ${energyCost} energy on level completion`);
  } else {
    console.warn(`[Energy] Insufficient energy to deduct on completion`);
  }
  
  // Apply level completion (XP, unlocks, etc.)
  applyLevelCompletion(/* ... */);
  
  await saveGuestProgress(progress);
  return progress;
}
```

#### 3. Added Level Completion Handler
**File**: `useGameLogic.tsx`

**New Effect to Handle Game Completion:**
```typescript
// Handle level completion and persistence
useEffect(() => {
  if (gameComplete && levelData && categoryName) {
    const handleCompletion = async () => {
      console.log('[LevelComplete] Persisting level completion');
      
      await completeLevelAndPersist({
        category: categoryName,
        levelNumber: levelData.level,
        score,
        bonusWords: foundBonusWords.length,
        crosswordWords: foundCrosswordWords.length,
        attempts: 1,
      });
      
      console.log('[LevelComplete] Level completion persisted successfully');
    };
    
    handleCompletion();
  }
}, [gameComplete, levelData, categoryName, score, foundCrosswordWords, foundBonusWords]);
```

## User Experience Improvements

### Before (Unfair System)
1. **Preview Penalty**: Opening level costs energy immediately
2. **Accidental Loss**: Misclicks cost energy
3. **Exploration Punishment**: Can't check difficulty without cost
4. **Incomplete Games**: Leaving early still costs energy

### After (Fair System)
1. **Free Preview**: Can open levels to see layout/difficulty
2. **No Accident Penalty**: Misclicks don't cost energy
3. **Safe Exploration**: Check levels without immediate cost
4. **Completion Reward**: Energy only spent on actual achievement

## Energy Flow Comparison

### Old Flow (Unfair)
```
Player Energy: 5 ⚡
├── Open Level → Energy: 4 ⚡ (deducted immediately)
├── Play Level → Energy: 4 ⚡ (no change)
├── Complete Level → Energy: 4 ⚡ (no change)
└── Result: Energy spent regardless of completion
```

### New Flow (Fair)
```
Player Energy: 5 ⚡
├── Open Level → Energy: 5 ⚡ (no deduction)
├── Play Level → Energy: 5 ⚡ (no change)
├── Complete Level → Energy: 4 ⚡ (deducted on completion)
└── Result: Energy spent only on actual completion
```

## Edge Case Handling

### Insufficient Energy on Completion
```typescript
if (currentEnergy >= energyCost) {
  progress.meta.energy = Math.max(0, progress.meta.energy - energyCost);
  console.log(`[Energy] Deducted ${energyCost} energy on completion`);
} else {
  console.warn(`[Energy] Insufficient energy to deduct on completion`);
  // Still allow completion but log warning
}
```

**Rationale**: If a player somehow completes a level without sufficient energy (edge case), we still allow the completion but log the issue for debugging.

### Level Abandonment
- **Before**: Player loses energy even if they abandon level
- **After**: Player keeps energy if they don't complete level

### Multiple Completions
- **Protection**: Level completion only triggers once per level
- **Duplicate Check**: `applyLevelCompletion` handles duplicate completions safely

## Benefits

### ✅ **Fairness**
- **Energy Conservation**: Players don't lose energy for exploration
- **Completion Reward**: Energy cost justified by actual achievement
- **Risk Reduction**: No penalty for checking level difficulty

### ✅ **User Experience**
- **Free Preview**: Can examine levels before committing energy
- **Mistake Forgiveness**: Accidental opens don't cost energy
- **Confidence Building**: Players can explore without fear of loss

### ✅ **Game Balance**
- **Earned Progression**: Energy spent only on actual progress
- **Strategic Planning**: Players can evaluate levels before committing
- **Fair Resource Management**: Energy reflects actual achievements

### ✅ **Technical Integrity**
- **Proper Persistence**: Level completion properly recorded
- **State Consistency**: Energy deduction aligns with progression
- **Debugging Support**: Clear logging of energy transactions

## Testing Scenarios

### 1. Normal Completion
1. Player has 5 energy
2. Opens level (still 5 energy)
3. Completes level (now 4 energy)
4. ✅ Energy deducted appropriately

### 2. Level Abandonment  
1. Player has 5 energy
2. Opens level (still 5 energy)
3. Leaves without completing (still 5 energy)
4. ✅ No unfair energy loss

### 3. Insufficient Energy Check
1. Player has 0 energy
2. Tries to open level
3. Access denied before navigation
4. ✅ Proper energy gate still works

### 4. Multiple Attempts
1. Player opens level multiple times
2. Only completion triggers energy deduction
3. ✅ Fair system for retry attempts

This fix makes the energy system fair and intuitive - players only pay energy when they actually achieve something (level completion) rather than just for looking at levels.