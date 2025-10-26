# Level Unlock Fix - Visual Flow Diagram

## Before (Broken) 🔴

```
User completes Level 4
        ↓
[Local Storage]
✓ Level 4: completed = true
✓ Level 5: unlocked = true  ← NEW unlock
        ↓
User navigates back to levels
        ↓
pullRemote() called
        ↓
[Remote Database]
❌ Level 4: not in remote (not synced yet)
        ↓
applySnapshotToGuestProgress()
⚠️ Rebuilds from scratch using ONLY remote data
        ↓
[Local Storage] ← OVERWRITTEN
✓ Level 1-3: as from remote
❌ Level 4: NOT completed (lost!)
❌ Level 5: NOT unlocked (lost!)
        ↓
User sees levels screen
❌ Level 5 is locked again! (BUG)
```

## After (Fixed) ✅

```
User completes Level 4
        ↓
[Local Storage] timestamp = 16:00:00
✓ Level 4: completed = true
✓ Level 5: unlocked = true  ← NEW unlock
        ↓
syncUser() triggered (NEW!)
        ↓
Push to remote... (may take a moment)
        ↓
User navigates back to levels
        ↓
pullRemote() called
        ↓
[Remote Database] timestamp = 15:00:00
❌ Level 4: not in remote yet (sync in progress)
        ↓
applySnapshotToGuestProgress()
        ↓
Compare timestamps:
  Local:  16:00:00
  Remote: 15:00:00
  Local is NEWER! ✓
        ↓
🎯 PRESERVE LOCAL DATA (NEW LOGIC!)
        ↓
[Local Storage] ← PRESERVED
✓ Level 1-3: from local
✓ Level 4: completed = true ✅
✓ Level 5: unlocked = true ✅
        ↓
User sees levels screen
✅ Level 5 is unlocked! (FIXED)
```

## Scenario: After Sync Completes ✅

```
... (sync completes in background)
        ↓
[Remote Database] timestamp = 16:00:00
✓ Level 4: completed = true (NOW IN REMOTE)
        ↓
User navigates again
        ↓
pullRemote() called
        ↓
applySnapshotToGuestProgress()
        ↓
Compare timestamps:
  Local:  16:00:00
  Remote: 16:00:00
  Remote is EQUAL (use as source of truth)
        ↓
🎯 APPLY REMOTE DATA
        ↓
[Local Storage]
✓ Level 1-4: from remote ✅
✓ Level 5: unlocked ✅ (in remote now)
        ↓
✅ Everything in sync!
```

## Multi-Device Scenario ✅

```
Device A: Complete Level 4
        ↓
[Local A] timestamp = 16:00:00
✓ Level 4: completed = true
✓ Level 5: unlocked = true
        ↓
syncUser() → Push to remote ✓
        ↓
[Remote] timestamp = 16:00:00
✓ Level 4: completed = true
        ↓
Device B: Opens app
        ↓
[Local B] timestamp = 14:00:00 (old)
❌ Level 4: not completed
        ↓
pullRemote() called
        ↓
applySnapshotToGuestProgress()
        ↓
Compare timestamps:
  Local B:  14:00:00
  Remote:   16:00:00
  Remote is NEWER! ✓
        ↓
🎯 APPLY REMOTE DATA
        ↓
[Local B] ← UPDATED
✓ Level 4: completed = true ✅
✓ Level 5: unlocked = true ✅
        ↓
✅ Device B gets the update!
```

## Key Components

### 1. Timestamp Comparison Logic
```javascript
const localUpdatedAt = existing?.updatedAt 
  ? new Date(existing.updatedAt).getTime() 
  : 0;

const remoteTimestamp = Math.max(
  statsUpdatedAt,
  ...snapshot.levels.map(l => new Date(l.updated_at || 0).getTime())
);

const shouldPreserveLocal = localUpdatedAt > remoteTimestamp;
```

### 2. Immediate Sync Trigger
```javascript
// After level completion
await updateGuestSnapshotFromProgress(updated);

// NEW: Immediate sync for logged-in users
const { data: { session } } = await supabase.auth.getSession();
if (session?.user?.id) {
  await syncUser(session.user.id);
}
```

### 3. Conditional Data Application
```javascript
if (shouldPreserveLocal && existing?.categories) {
  // Preserve local - it's fresher
  progress.categories = { ...existing.categories };
} else {
  // Apply remote - it's fresher or we have no local
  // ... apply remote level data
}
```

## Summary

**The Fix:** Compare timestamps between local and remote data, and only apply remote data when it's actually newer than local. This prevents local progress from being overwritten by stale remote data.

**The Enhancement:** Trigger immediate sync after level completion for logged-in users, ensuring remote data is kept up-to-date and reducing the window where local and remote can be out of sync.

**The Result:** Level unlocks work correctly and persist, even when navigating back and forth, going offline, or using multiple devices! ✅
