import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LocalUserSnapshot,
  ProfileRow,
  UserStatsRow,
  LevelProgressRow,
} from "./syncTypes";
import { clampEnergy } from "./energy";
import type { GuestProgressPayload } from "@/hooks/guest-progress";

const GUEST_ID_KEY = "wordscapes_guest_uuid_v1";
const SNAPSHOT_KEY = "wordscapes_user_snapshot_v1";

// Lightweight uuid v4 (RFC4122) generator to avoid extra dependency
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getOrCreateGuestId(): Promise<string> {
  const existing = await AsyncStorage.getItem(GUEST_ID_KEY);
  if (existing) return existing;
  const id = uuidv4();
  await AsyncStorage.setItem(GUEST_ID_KEY, id);
  return id;
}

async function loadSnapshot(): Promise<LocalUserSnapshot | null> {
  const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalUserSnapshot;
  } catch {
    return null;
  }
}

async function saveSnapshot(s: LocalUserSnapshot) {
  await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(s));
}

/**
 * Convert guest progress payload to LocalUserSnapshot shape so that upgrading
 * a guest to a real account is just a matter of assigning a real user id and pushing.
 */
export async function updateGuestSnapshotFromProgress(
  progress: GuestProgressPayload
) {
  const existingSnapshot = await loadSnapshot();
  const now = new Date().toISOString();

  // If there's no snapshot, we can't proceed (should be created on login)
  if (!existingSnapshot) {
    console.warn("[guestSnapshot] updateGuestSnapshotFromProgress called without an existing snapshot.");
    return;
  }

  const snapshot = existingSnapshot; // Work with the existing snapshot

  // --- Update Profile ---
  let profileChanged = false;
  const desiredName = progress.meta.playerName || snapshot.profile.username;
  if (desiredName && desiredName !== snapshot.profile.username) {
    snapshot.profile.username = desiredName;
    profileChanged = true;
  }
  if (progress.meta.avatar && progress.meta.avatar !== snapshot.profile.avatar) {
    snapshot.profile.avatar = progress.meta.avatar;
    profileChanged = true;
  }
  if (profileChanged) {
    snapshot.profile.updated_at = now;
  }

  // --- Update Stats ---
  snapshot.stats.xp = progress.meta.xp;
  snapshot.stats.gems = progress.meta.gems;
  snapshot.stats.energy = clampEnergy(progress.meta.energy ?? 0);
  snapshot.stats.updated_at = now; // Always mark stats as updated

  // --- Update Levels ---
  const newLevels: LevelProgressRow[] = [];
  Object.entries(progress.categories).forEach(([category, levelArr]) => {
    levelArr.forEach((lvl) => {
      if (!lvl.isUnlocked && !lvl.isCompleted) return;
      newLevels.push({
        user_id: snapshot.profile.id, // Use the real user ID
        level: lvl.level,
        theme: category,
        completed: !!lvl.isCompleted,
        first_completed_at: lvl.isCompleted ? lvl.lastCompletedAt || progress.updatedAt : null,
        last_completed_at: lvl.isCompleted ? lvl.lastCompletedAt || progress.updatedAt : null,
        last_client_update_at: progress.updatedAt,
        updated_at: progress.updatedAt,
      });
    });
  });

  // Merge new level data with existing level data in the snapshot
  const levelMap = new Map<number, LevelProgressRow>();
  snapshot.levels.forEach((r) => levelMap.set(r.level, r));
  newLevels.forEach((r) => {
    const prev = levelMap.get(r.level);
    // Always take the new level data from progress, as it's the source of truth from the game session
    if (!prev || new Date(r.updated_at) >= new Date(prev.updated_at || 0)) {
        levelMap.set(r.level, r);
    }
  });
  snapshot.levels = Array.from(levelMap.values());

  // --- Finalize and Save ---
  snapshot.local_revision = (snapshot.local_revision || 0) + 1;
  await saveSnapshot(snapshot);
}

/**
 * When converting a guest to a real account (after Supabase sign-up), call this
 * to swap the guest id to the new authenticated user id before first push.
 */
export async function remapGuestSnapshotToUser(newUserId: string) {
  const snapshot = await loadSnapshot();
  if (!snapshot) return;
  if (snapshot.profile.id === newUserId) return;

  const wasGuest = snapshot.profile.is_guest;

  console.info("[guestSnapshot] remapping guest snapshot", {
    oldId: snapshot.profile.id,
    newUserId,
    levelCount: snapshot.levels.length,
    wasGuest,
  });
  snapshot.profile.id = newUserId;
  snapshot.profile.is_guest = false;
  snapshot.profile.status = "free";
  snapshot.profile.updated_at = new Date().toISOString();
  snapshot.stats.user_id = newUserId;
  snapshot.levels.forEach((l) => {
    l.user_id = newUserId;
  });
  snapshot.local_revision++;
  await saveSnapshot(snapshot);
  console.info("[guestSnapshot] remap complete", {
    newUserId,
    username: snapshot.profile.username,
  });
}