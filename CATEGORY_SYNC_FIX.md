# Fix for Missing Categories on Logged-in Devices

## Problem
Levels from new categories were not showing on logged-in devices, even when the user had sufficient XP to unlock them.

## Root Cause
The issue was in the sync logic where authenticated users' progress was being rebuilt from remote data. Two key areas had this problem:

1. **sync.ts - `applySnapshotToGuestProgress`**: When applying remote snapshot data to local guest progress, the function was not checking if new categories should be unlocked based on the user's XP level.

2. **LevelScreen.tsx - Progress Rebuilding**: When guest progress was missing or corrupted and needed to be rebuilt, it was using `buildInitialProgress` which only unlocks categories for player level 0, ignoring any XP from the remote snapshot.

## The Fix

### 1. sync.ts (line 123-145)
Added category unlock logic after setting the player level:
```typescript
const derived = derivePlayerLevel(progress.meta.xp);
progress.meta.playerLevel = derived.level;

// Ensure all categories that should be unlocked are added to progress
const unlockedCategories = getUnlockedCategories(progress.meta.playerLevel);
const levelDefinitions = levelsData as Record<string, any[]>;

// Add any newly unlocked categories to progress
unlockedCategories.forEach((categoryName) => {
  if (!progress.categories[categoryName] && levelDefinitions[categoryName]) {
    // Create levels for the new category
  }
});
```

### 2. LevelScreen.tsx (line 126-158)
Enhanced the progress rebuilding logic to account for XP from remote snapshots:
```typescript
progressToUse = buildInitialProgress(levelsData as any, preferredName);

// If we have a snapshot with XP, ensure categories are properly unlocked
if (snapshot?.stats?.xp) {
  const derived = derivePlayerLevel(snapshot.stats.xp);
  progressToUse.meta.xp = snapshot.stats.xp;
  progressToUse.meta.playerLevel = derived.level;
  
  // Add any newly unlocked categories based on XP
  const unlockedCategories = getUnlockedCategories(progressToUse.meta.playerLevel);
  // ... unlock logic
}
```

### 3. Added Import
Added `getUnlockedCategories` to the imports in sync.ts to support the new logic.

## How It Works Now

1. **For Existing Users**: When sync pulls remote data, it properly calculates the player level from XP and unlocks all categories they should have access to.

2. **For Users with Corrupted Progress**: When rebuilding progress, it checks the remote snapshot for XP and ensures all appropriate categories are unlocked based on that XP.

3. **Category Unlocking**: Uses the existing `getUnlockedCategories` function to determine which categories should be available and creates the level structure for any missing categories.

## Impact

- ✅ Logged-in users will now see all categories they've unlocked through gameplay
- ✅ Progress sync properly maintains category unlock states
- ✅ Users who switch devices or restore accounts will have their full progression available
- ✅ No data loss - existing completed levels and progress are preserved

## Testing

After this fix:
1. Logged-in users should see all categories appropriate for their XP level
2. Category switching should work properly
3. New level unlocks should persist across devices
4. Progress rebuilding should maintain proper category access