# Level Unlock Fix Documentation

## Problem Statement
On logged-in devices, the feature to unlock levels as user progresses does not work. When a user completes a level and the next level should unlock, the unlock state is lost when the user navigates back to the levels screen.

## Root Cause Analysis

### The Issue
The `applySnapshotToGuestProgress` function in `/lib/sync.ts` was rebuilding guest progress from scratch using only remote data. This caused local level completions to be lost if they haven't been synced to remote yet.

### The Flow That Caused the Bug
1. User completes a level on a logged-in device
2. `completeLevelAndPersist` updates local AsyncStorage with the completion and unlocks the next level
3. User navigates back to the levels screen
4. `pullRemote` is called to get remote data
5. `applySnapshotToGuestProgress` is called, which:
   - Creates a fresh progress structure
   - Resets all levels to only have first 3 unlocked
   - Applies only the remote level data (which doesn't have the recent completion)
6. The local progress is **overwritten** with this remote-based progress
7. The level unlock is lost!

## Solution

### Changes Made

#### 1. Enhanced `applySnapshotToGuestProgress` in `/lib/sync.ts`

**Before:**
- Always applied remote data, resetting all levels to baseline then applying remote completions
- No timestamp comparison to determine data freshness
- Local changes were always lost if not in remote

**After:**
```typescript
// Compare timestamps
const localUpdatedAt = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
const statsUpdatedAt = snapshot.stats?.updated_at ? new Date(snapshot.stats.updated_at).getTime() : 0;

// Use the most recent timestamp from remote (stats or any level)
const remoteTimestamp = Math.max(
  statsUpdatedAt,
  ...snapshot.levels.map(l => new Date(l.updated_at || 0).getTime())
);

// Preserve local if it's newer
const shouldPreserveLocal = localUpdatedAt > remoteTimestamp;

if (shouldPreserveLocal && existing?.categories) {
  // Preserve local level progress since it's newer
  console.log('[sync] Local progress is fresher, preserving local level states');
  Object.keys(existing.categories).forEach((categoryName) => {
    if (progress.categories[categoryName] && existing.categories[categoryName]) {
      progress.categories[categoryName] = existing.categories[categoryName].map(localLevel => ({
        ...localLevel
      }));
    }
  });
} else {
  // Apply remote data - it's fresher or we have no local data
  // ... (original logic to apply remote data)
}
```

**Key improvements:**
- Compares local progress timestamp with the most recent remote timestamp
- If local is newer, preserves all local level states (completions and unlocks)
- Only applies remote data when it's actually fresher than local
- Added detailed logging to track which branch is taken

#### 2. Added Immediate Sync on Level Completion in `GameScreen.tsx`

**Addition:**
```typescript
// After updateGuestSnapshotFromProgress
const { data: { session } } = await supabase.auth.getSession();
if (session?.user?.id) {
  console.info("[COMPLETE] Syncing level completion to remote for logged-in user");
  await syncUser(session.user.id).catch((syncErr) => {
    console.warn("[COMPLETE] Sync failed but continuing", syncErr);
  });
}
```

**Purpose:**
- Immediately syncs level completion to remote for logged-in users
- Ensures remote data is up-to-date when user returns to levels screen
- Sync errors are caught and logged but don't block user experience

### How the Fix Works

#### Scenario 1: User completes level and navigates back immediately
1. User completes level → local progress updated with timestamp = now
2. Sync is triggered → pushes completion to remote (may take a moment)
3. User navigates back → `pullRemote` gets data
4. `applySnapshotToGuestProgress` compares timestamps
5. Local timestamp > remote timestamp (local is fresher)
6. **Local progress is preserved** → level unlock retained ✓

#### Scenario 2: User completes level, sync completes, then navigates back
1. User completes level → local progress updated
2. Sync completes → remote now has the completion
3. User navigates back → `pullRemote` gets updated remote data
4. `applySnapshotToGuestProgress` compares timestamps
5. Remote timestamp >= local timestamp
6. **Remote progress is applied** → level unlock is in remote data ✓

#### Scenario 3: Multiple device scenario
1. User completes level on Device A → syncs to remote
2. User opens app on Device B → pulls from remote
3. Remote has the completion from Device A
4. Remote timestamp > Device B's local timestamp
5. **Remote progress is applied** → Device B gets the level unlock ✓

## Test Results

All comprehensive tests pass:
- ✅ Fresh level completion (local newer) - local progress preserved
- ✅ Remote has newer data - remote progress applied
- ✅ Sync just completed (timestamps equal) - remote as source of truth
- ✅ No local progress (new user) - remote progress applied
- ✅ Remote has more recent change - remote progress applied

## Files Modified

1. `/lib/sync.ts`
   - Enhanced `applySnapshotToGuestProgress` function
   - Added timestamp comparison logic
   - Added conditional logic to preserve local or apply remote based on freshness

2. `/app/components/screens/GameScreen.tsx`
   - Added imports for `syncUser` and `supabase`
   - Added immediate sync trigger after level completion for logged-in users

## Benefits

1. **Prevents data loss**: Local level completions and unlocks are never lost
2. **Maintains sync**: Remote data is still applied when it's fresher
3. **Better UX**: Users see immediate level unlocks that persist
4. **Multi-device support**: Works correctly across multiple devices
5. **Robust**: Handles edge cases like slow network, sync failures, etc.

## Edge Cases Handled

1. **Slow network**: Local progress preserved until sync completes
2. **Sync failure**: Local progress remains, sync retries on next opportunity
3. **Offline mode**: Local progress preserved, synced when online
4. **Concurrent edits**: Timestamp-based resolution (newest wins)
5. **First-time login**: Correctly applies remote data (no local to preserve)

## Migration Path

The fix is **backward compatible** and requires no migration:
- Existing users: Will benefit from the fix immediately
- No database changes required
- No user action needed
- Works with existing sync infrastructure

## Testing Recommendations

1. **Manual testing**:
   - Complete a level on a logged-in device
   - Navigate back to levels screen
   - Verify next level is unlocked
   - Force close app and reopen
   - Verify unlock persists

2. **Multi-device testing**:
   - Complete level on Device A
   - Open app on Device B
   - Verify level completion syncs
   - Complete another level on Device B
   - Switch back to Device A
   - Verify both completions are present

3. **Network testing**:
   - Complete level in airplane mode
   - Turn on network
   - Verify sync happens automatically
   - Check levels screen shows correct state

## Monitoring

The fix includes console logging that can be monitored:
- `[sync] Local progress is fresher, preserving local level states`
- `[sync] Applying remote level states`
- `[COMPLETE] Syncing level completion to remote for logged-in user`

These logs help track the behavior in production and debug any issues.
