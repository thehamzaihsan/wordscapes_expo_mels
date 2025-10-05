import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LocalUserSnapshot,
  ProfileRow,
  UserStatsRow,
  LevelProgressRow,
} from "./syncTypes";
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
  const guestId = await getOrCreateGuestId();
  const existing = await loadSnapshot();

  // Profile row (guest). Keep prior created_at if exists for continuity.
  const profile: ProfileRow = {
    id: guestId,
    username: progress.meta.playerName || "Guest",
    avatar: progress.meta.avatar,
    status: "guest",
    is_guest: true,
    created_at: existing?.profile.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const stats: UserStatsRow = {
    user_id: guestId,
    xp: progress.meta.xp,
    coin: progress.meta.coins,
    gems: progress.meta.gems,
    last_streak_date: null,
    updated_at: new Date().toISOString(),
  };

  // Flatten categories -> levels. Use category name as theme.
  const levels: LevelProgressRow[] = [];
  Object.entries(progress.categories).forEach(([category, levelArr]) => {
    levelArr.forEach((lvl) => {
      if (!lvl.isUnlocked && !lvl.isCompleted) return; // ignore unreachable
      levels.push({
        user_id: guestId,
        level: lvl.level,
        theme: category, // category name as theme value
        stars: lvl.stars,
        completed: !!lvl.isCompleted,
        first_completed_at: lvl.isCompleted
          ? lvl.lastCompletedAt || progress.updatedAt
          : null,
        last_completed_at: lvl.isCompleted
          ? lvl.lastCompletedAt || progress.updatedAt
          : null,
        last_client_update_at: progress.updatedAt,
        updated_at: progress.updatedAt,
      });
    });
  });

  // Merge levels keeping latest updated_at by level if snapshot exists.
  let mergedLevels = levels;
  if (existing) {
    const map = new Map<number, LevelProgressRow>();
    existing.levels.forEach((r) => map.set(r.level, r));
    levels.forEach((r) => {
      const prev = map.get(r.level);
      if (!prev || new Date(r.updated_at) > new Date(prev.updated_at)) {
        map.set(r.level, r);
      }
    });
    mergedLevels = Array.from(map.values());
  }

  const snapshot: LocalUserSnapshot = {
    profile,
    stats,
    levels: mergedLevels,
    local_revision: (existing?.local_revision || 0) + 1,
    last_pulled_at: existing?.last_pulled_at,
    last_pushed_at: existing?.last_pushed_at,
  };

  await saveSnapshot(snapshot);
}

/**
 * When converting a guest to a real account (after Supabase sign-up), call this
 * to swap the guest id to the new authenticated user id before first push.
 */
export async function remapGuestSnapshotToUser(newUserId: string) {
  const snapshot = await loadSnapshot();
  if (!snapshot) return;
  if (!snapshot.profile.is_guest) return; // nothing to do

  snapshot.profile.id = newUserId;
  snapshot.profile.is_guest = false;
  snapshot.profile.status = "active";
  snapshot.profile.updated_at = new Date().toISOString();
  snapshot.stats.user_id = newUserId;
  snapshot.levels.forEach((l) => {
    l.user_id = newUserId;
  });
  snapshot.local_revision++;
  await saveSnapshot(snapshot);
}
