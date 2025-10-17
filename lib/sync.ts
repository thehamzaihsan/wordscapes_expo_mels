import economy from "@/constants/economy.json";
import levelsData from "@/constants/levels.json";
import {
  buildInitialProgress,
  derivePlayerLevel,
  getUnlockedCategories,
  loadGuestProgress,
  saveGuestProgress,
} from "@/hooks/guest-progress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clampEnergy, getDefaultEnergy } from "./energy";
import { supabase } from "./supabase";
import type {
  LevelConflict,
  LevelProgressRow,
  LocalUserSnapshot,
  ProfileRow,
  SubscriptionTier,
  SyncOptions,
  SyncResult,
  UserStatsRow,
} from "./syncTypes";

const LOCAL_USER_SNAPSHOT_KEY = "wordscapes_user_snapshot_v1";

// --- Helpers -----------------------------------------------------------------

function nowISO() {
  return new Date().toISOString();
}

// Valid subscription tiers we persist for authenticated users
const VALID_SUB_TIERS: SubscriptionTier[] = ["free", "weekly", "monthly"];

function sanitizeStatus(p: ProfileRow) {
  // For authenticated (is_guest false) profiles ensure status is one of valid tiers.
  if (!p.is_guest) {
    if (!p.status || !VALID_SUB_TIERS.includes(p.status as SubscriptionTier)) {
      p.status = "free";
    }
  }
}

async function loadSnapshot(): Promise<LocalUserSnapshot | null> {
  const raw = await AsyncStorage.getItem(LOCAL_USER_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalUserSnapshot;
  } catch {
    return null;
  }
}

async function saveSnapshot(s: LocalUserSnapshot) {
  await AsyncStorage.setItem(LOCAL_USER_SNAPSHOT_KEY, JSON.stringify(s));
}

export async function getLocalSnapshot(): Promise<LocalUserSnapshot | null> {
  return loadSnapshot();
}

function logSupabaseWarning(
  context: string,
  error: unknown,
  payload?: Record<string, unknown>
) {
  if (!error) return;
  const msg =
    typeof error === "object" && error !== null && "message" in error
      ? (error as any).message
      : String(error);
  console.warn(`[sync] ${context} failed: ${msg}`, {
    error,
    payload,
  });
}

async function applySnapshotToGuestProgress(snapshot: LocalUserSnapshot) {
  try {
    const existing = await loadGuestProgress();
    const preferredName =
      snapshot.profile.username || existing?.meta.playerName;
    
    // Start with existing progress or build initial if none exists
    let progress: GuestProgressPayload;
    if (existing && existing.categories && Object.keys(existing.categories).length > 0) {
      // Use existing progress as base to preserve category progress
      progress = { ...existing };
    } else {
      // Only build initial progress if we have no existing data
      progress = buildInitialProgress(levelsData as any, preferredName);
    }

    // Carry over meta from snapshot stats/profile
    const remoteXp =
      typeof snapshot.stats?.xp === "number" ? snapshot.stats.xp : 0;
    const remoteGems =
      typeof snapshot.stats?.gems === "number"
        ? snapshot.stats.gems
        : progress.meta.gems;
    // Determine freshness: compare snapshot stats timestamp vs local guest progress
    const localUpdatedAt = existing?.updatedAt
      ? new Date(existing.updatedAt).getTime()
      : 0;
    const statsUpdatedAt = snapshot.stats?.updated_at
      ? new Date(snapshot.stats.updated_at).getTime()
      : 0;
    const preferRemoteStats = statsUpdatedAt > localUpdatedAt;

    progress.meta.playerName = preferredName || progress.meta.playerName;
    progress.meta.avatar = snapshot.profile.avatar || progress.meta.avatar;
    // Merge stats with freshness awareness:
    // - If remote stats are newer, take remote values
    // - If local is newer (or equal), keep local values (allows legitimate decreases like spending gems)
    const localXp = existing?.meta.xp ?? 0;
    const localGems = existing?.meta.gems ?? progress.meta.gems;
    progress.meta.xp = preferRemoteStats ? remoteXp : localXp;
    progress.meta.gems = preferRemoteStats ? remoteGems : localGems;
    const remoteEnergyValue =
      typeof snapshot.stats?.energy === "number"
        ? snapshot.stats.energy
        : undefined;
    const localEnergyValue =
      typeof existing?.meta.energy === "number"
        ? existing.meta.energy
        : progress.meta.energy ?? getDefaultEnergy();
    progress.meta.energy = clampEnergy(
      preferRemoteStats && typeof remoteEnergyValue === "number"
        ? remoteEnergyValue
        : localEnergyValue
    );

    const derived = derivePlayerLevel(progress.meta.xp);
    progress.meta.playerLevel = derived.level;

    // Ensure all categories that should be unlocked are added to progress
    const unlockedCategories = getUnlockedCategories(progress.meta.playerLevel);
    const levelDefinitions = levelsData as Record<string, any[]>;

    // Add any newly unlocked categories to progress
    unlockedCategories.forEach((categoryName) => {
      if (!progress.categories[categoryName] && levelDefinitions[categoryName]) {
        progress.categories[categoryName] = levelDefinitions[categoryName].map(
          (lvl: any, idx: number) => ({
            level: lvl.level ?? idx + 1,
            baseWord: lvl.baseWord,
            difficulty: lvl.difficulty,
            isUnlocked: idx === 0, // unlock only first level of new category
            isCompleted: false,
            bestScore: 0,
            attempts: 0,
          })
        );
        console.log(
          `[Category Unlock] Player level ${progress.meta.playerLevel} unlocked category: ${categoryName}`
        );
      }
    });

    const updatedAt =
      snapshot.last_pulled_at ||
      snapshot.stats?.updated_at ||
      snapshot.profile?.updated_at ||
      new Date().toISOString();
    progress.updatedAt = updatedAt;

    // If local progress is fresher than remote, preserve local level states
    // Compare local guest progress updatedAt with the most recent remote timestamp
    const remoteTimestamp = Math.max(
      statsUpdatedAt,
      ...snapshot.levels.map(l => new Date(l.updated_at || 0).getTime())
    );
    const shouldPreserveLocal = localUpdatedAt > remoteTimestamp;

    if (shouldPreserveLocal && existing?.categories) {
      // Preserve local level progress since it's newer
      console.log('[sync] Local progress is fresher, preserving local level states', {
        localUpdatedAt: new Date(localUpdatedAt).toISOString(),
        remoteTimestamp: new Date(remoteTimestamp).toISOString(),
      });
      
      // First, preserve all existing category progress
      Object.keys(existing.categories).forEach((categoryName) => {
        if (existing.categories[categoryName]) {
          progress.categories[categoryName] = existing.categories[categoryName].map(localLevel => ({
            ...localLevel
          }));
        }
      });
      
      // Then ensure newly unlocked categories are still available
      // (these were added in lines 141-158 but might not exist in existing.categories)
      unlockedCategories.forEach((categoryName) => {
        if (!existing.categories[categoryName] && levelDefinitions[categoryName]) {
          // This category was just unlocked, make sure it stays in progress
          progress.categories[categoryName] = levelDefinitions[categoryName].map(
            (lvl: any, idx: number) => ({
              level: lvl.level ?? idx + 1,
              baseWord: lvl.baseWord,
              difficulty: lvl.difficulty,
              isUnlocked: idx === 0, // unlock only first level of new category
              isCompleted: false,
              bestScore: 0,
              attempts: 0,
            })
          );
          console.log(
            `[Category Unlock] Preserving newly unlocked category during sync: ${categoryName}`
          );
        }
      });
    } else {
      // Apply remote data - it's fresher or we have no local data
      console.log('[sync] Applying remote level states', {
        localUpdatedAt: new Date(localUpdatedAt).toISOString(),
        remoteTimestamp: new Date(remoteTimestamp).toISOString(),
      });
      
      // Baseline unlock: only first 3 levels per category; further unlocks applied from remote level rows below
      Object.values(progress.categories).forEach((levels) => {
        levels.forEach((lvl, idx) => {
          lvl.isUnlocked = idx < 3;
        });
      });

      // Apply remote level completions/unlocks
      const levelsByTheme = new Map<string, LevelProgressRow[]>();
      snapshot.levels.forEach((row) => {
        const theme = row.theme || "Mountain";
        const list = levelsByTheme.get(theme);
        if (list) list.push(row);
        else levelsByTheme.set(theme, [row]);
      });

      levelsByTheme.forEach((rows, theme) => {
        const categoryLevels = progress.categories[theme];
        if (!categoryLevels) return;
        // Sort incoming rows for predictable unlock logic
        const sorted = [...rows].sort((a, b) => a.level - b.level);
        let maxCompletedLevel = 0;
        sorted.forEach((remoteLevel) => {
          const idx = categoryLevels.findIndex(
            (lvl) => lvl.level === remoteLevel.level
          );
          if (idx === -1) return;
          const entry = categoryLevels[idx];
          entry.isUnlocked = true;
          if (remoteLevel.completed) {
            entry.isCompleted = true;
            entry.lastCompletedAt =
              remoteLevel.last_completed_at ||
              remoteLevel.first_completed_at ||
              remoteLevel.updated_at ||
              updatedAt;
            maxCompletedLevel = Math.max(maxCompletedLevel, remoteLevel.level);
          } else {
            maxCompletedLevel = Math.max(
              maxCompletedLevel,
              remoteLevel.level - 1
            );
          }
        });
        if (maxCompletedLevel > 0) {
          categoryLevels.forEach((lvl) => {
            if (lvl.level <= maxCompletedLevel + 1) {
              lvl.isUnlocked = true;
            }
          });
        }
      });
    }

    await saveGuestProgress(progress);
  } catch (err) {
    console.warn("[sync] Failed to mirror snapshot into guest progress", err);
  }
}

// Build a snapshot from guest progress (migration path)
export interface GuestToUserParams {
  guestName: string;
  avatar?: string;
  guestGems: number;
  guestXp: number;
  guestEnergy?: number;
  guestLevels: {
    level: number;
    completed: boolean;
    lastCompletedAt?: string;
    theme?: string;
  }[]; // flattened from guest categories
}

export async function createInitialSnapshotFromGuest(
  userId: string,
  params: GuestToUserParams
): Promise<LocalUserSnapshot> {
  const initialEnergy = clampEnergy(
    typeof params.guestEnergy === "number"
      ? params.guestEnergy
      : getDefaultEnergy()
  );
  const profile: ProfileRow = {
    id: userId,
    username: params.guestName,
    avatar: params.avatar,
    status: "free", // treat all new accounts as free tier by default
    is_guest: false,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  const stats: UserStatsRow = {
    user_id: userId,
    xp: params.guestXp,
    gems: params.guestGems,
    energy: initialEnergy,
    last_streak_date: null,
    updated_at: nowISO(),
  };
  const levels: LevelProgressRow[] = params.guestLevels.map((l) => ({
    user_id: userId,
    level: l.level,
    theme: l.theme || null,
    completed: l.completed,
    first_completed_at: l.completed ? l.lastCompletedAt || nowISO() : null,
    last_completed_at: l.completed ? l.lastCompletedAt || nowISO() : null,
    last_client_update_at: l.lastCompletedAt || nowISO(),
    updated_at: nowISO(),
  }));
  const snapshot: LocalUserSnapshot = {
    profile,
    stats,
    levels,
    local_revision: 1,
    last_pulled_at: undefined,
    last_pushed_at: undefined,
  };
  await saveSnapshot(snapshot);
  return snapshot;
}

// Create a brand‑new default snapshot for a freshly authenticated user with no remote rows yet.
export async function createDefaultSnapshot(
  userId: string
): Promise<LocalUserSnapshot> {
  const defaultEnergy = getDefaultEnergy();
  const profile: ProfileRow = {
    id: userId,
    username: "Player",
    avatar: null,
    status: "free",
    is_guest: false,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  const stats: UserStatsRow = {
    user_id: userId,
    xp: 0,
    gems: economy.gems.startingAmount, // Dynamic starting gems from economy config
    energy: defaultEnergy,
    last_streak_date: null,
    updated_at: nowISO(),
  };
  const snapshot: LocalUserSnapshot = {
    profile,
    stats,
    levels: [],
    local_revision: 1,
    last_pulled_at: undefined,
    last_pushed_at: undefined,
  };
  await saveSnapshot(snapshot);
  await applySnapshotToGuestProgress(snapshot);
  return snapshot;
}

// Ensure remote profile + stats rows exist (idempotent bootstrap)
async function ensureRemoteProfileAndStats(snapshot: LocalUserSnapshot) {
  const uid = snapshot.profile.id;
  console.info("[sync] ensureRemoteProfileAndStats", {
    uid,
    username: snapshot.profile.username,
  });
  try {
    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", uid)
      .maybeSingle();
    if (pErr) {
      logSupabaseWarning("fetch profile", pErr, { uid });
    }
    if (!prof && !pErr) {
      const insertProfile = { ...snapshot.profile, is_guest: false };
      const { error: insertErr } = await supabase
        .from("profiles")
        .insert(insertProfile as any);
      logSupabaseWarning("insert profile", insertErr, insertProfile);
      if (!insertErr) {
        console.info("[sync] inserted missing profile row", {
          uid,
        });
      }
    }
    const { data: stats, error: sErr } = await supabase
      .from("user_stats")
      .select("user_id")
      .eq("user_id", uid)
      .maybeSingle();
    if (sErr) {
      logSupabaseWarning("fetch stats", sErr, { uid });
    }
    if (!stats && !sErr) {
      const { error: insertStatsErr } = await supabase
        .from("user_stats")
        .insert(snapshot.stats as any);
      logSupabaseWarning("insert stats", insertStatsErr, snapshot.stats as any);
      if (!insertStatsErr) {
        console.info("[sync] inserted missing stats row", {
          uid,
        });
      }
    }
  } catch (e: any) {
    console.warn("bootstrap ensureRemoteProfileAndStats error", e?.message);
  }
}

// Pull remote data (full refresh) ------------------------------------------------
export async function pullRemote(
  userId: string
): Promise<LocalUserSnapshot | null> {
  const [
    { data: profileData, error: pErr },
    { data: statsData, error: sErr },
    { data: levelData, error: lErr },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("level_progress").select("*").eq("user_id", userId),
  ]);
  if (pErr) {
    console.warn("pullRemote profiles error", pErr);
    return null;
  }
  if (sErr) {
    console.warn("pullRemote stats error", sErr);
    return null;
  }
  if (lErr) {
    console.warn("pullRemote level error", lErr);
    return null;
  }
  if (!profileData || !statsData) return null;
  const snapshot: LocalUserSnapshot = {
    profile: profileData as ProfileRow,
    stats: statsData as UserStatsRow,
    levels: (levelData || []) as LevelProgressRow[],
    local_revision: 0,
    last_pulled_at: nowISO(),
    last_pushed_at: undefined,
  };
  // Normalize status for authenticated profiles
  sanitizeStatus(snapshot.profile);
  await saveSnapshot(snapshot);
  await applySnapshotToGuestProgress(snapshot);
  return snapshot;
}

// Determine diffs between local snapshot and remote (we only push changed/new level rows)
interface LevelDiff {
  type: "new" | "update";
  local: LevelProgressRow;
  remote?: LevelProgressRow;
}

function diffLevels(
  local: LevelProgressRow[],
  remote: LevelProgressRow[]
): LevelDiff[] {
  const remoteMap = new Map(remote.map((r) => [r.level, r]));
  const diffs: LevelDiff[] = [];
  for (const l of local) {
    const r = remoteMap.get(l.level);
    if (!r) {
      diffs.push({ type: "new", local: l });
    } else if (
      new Date(l.updated_at).getTime() > new Date(r.updated_at).getTime()
    ) {
      diffs.push({ type: "update", local: l, remote: r });
    }
  }
  return diffs;
}

// Push local changes upstream ----------------------------------------------------
export async function pushLocal(
  userId: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  console.info("[sync] pushLocal start", { userId });
  const snapshot = await loadSnapshot();
  if (!snapshot || snapshot.profile.id !== userId) {
    console.info("[sync] pushLocal skipped", {
      hasSnapshot: !!snapshot,
      snapshotUserId: snapshot?.profile.id,
      expectedUserId: userId,
    });
    return {
      pushed: 0,
      updatedStats: false,
      profileUpdated: false,
      conflicts: [],
      pullInserted: 0,
      pullUpdated: 0,
    };
  }

  // Normalize status + ensure base rows exist remotely before we diff
  sanitizeStatus(snapshot.profile);
  await ensureRemoteProfileAndStats(snapshot);

  // Pull remote to compare (light) - could optimize later with updated_after filter
  const { data: remoteLevels, error: rlErr } = await supabase
    .from("level_progress")
    .select("*")
    .eq("user_id", userId);
  if (rlErr) {
    logSupabaseWarning("fetch level_progress", rlErr, { userId });
    return {
      pushed: 0,
      updatedStats: false,
      profileUpdated: false,
      conflicts: [],
      pullInserted: 0,
      pullUpdated: 0,
    };
  }
  const diffs = diffLevels(
    snapshot.levels,
    (remoteLevels || []) as LevelProgressRow[]
  );

  const conflicts: LevelConflict[] = []; // For future advanced strategies
  let pushed = 0;
  for (const d of diffs) {
    if (d.type === "new") {
      const { error } = await supabase.from("level_progress").insert(d.local);
      if (!error) pushed++;
      else console.warn("insert level_progress error", error);
    } else if (d.type === "update") {
      const { error } = await supabase
        .from("level_progress")
        .update(d.local)
        .match({ user_id: userId, level: d.local.level });
      if (!error) pushed++;
      else console.warn("update level_progress error", error);
    }
  }

  // Update stats if local newer
  let updatedStats = false;
  const { data: remoteStats, error: rsErr } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (rsErr) {
    logSupabaseWarning("fetch user_stats", rsErr, { userId });
  } else if (remoteStats) {
    if (
      new Date(snapshot.stats.updated_at).getTime() >
      new Date(remoteStats.updated_at).getTime()
    ) {
      const { error } = await supabase
        .from("user_stats")
        .update(snapshot.stats)
        .eq("user_id", userId);
      if (!error) updatedStats = true;
      else logSupabaseWarning("update stats", error, snapshot.stats as any);
    }
  } else {
    const { error } = await supabase
      .from("user_stats")
      .insert(snapshot.stats as any);
    if (!error) updatedStats = true;
    else logSupabaseWarning("insert stats", error, snapshot.stats as any);
  }

  // Update profile basic fields if changed (username/avatar/status)
  let profileUpdated = false;
  const { data: remoteProfile, error: rpErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (rpErr) {
    logSupabaseWarning("fetch profile row", rpErr, { userId });
  } else if (remoteProfile) {
    const fields: (keyof ProfileRow)[] = ["username", "avatar", "status"];
    const changed = fields.some(
      (f) => (snapshot.profile as any)[f] !== (remoteProfile as any)[f]
    );
    if (changed) {
      const partial: Partial<ProfileRow> = {
        username: snapshot.profile.username,
        avatar: snapshot.profile.avatar,
        status: snapshot.profile.status,
        updated_at: nowISO(),
      };
      const { error } = await supabase
        .from("profiles")
        .update(partial)
        .eq("id", userId);
      if (!error) profileUpdated = true;
      else logSupabaseWarning("update profile", error, partial as any);
    }
  } else {
    const newProfile: ProfileRow = {
      ...snapshot.profile,
      updated_at: nowISO(),
      is_guest: false,
    };
    const { error } = await supabase.from("profiles").insert(newProfile as any);
    if (!error) profileUpdated = true;
    else logSupabaseWarning("insert profile", error, newProfile as any);
  }

  snapshot.last_pushed_at = nowISO();
  snapshot.local_revision++;
  await saveSnapshot(snapshot);

  return {
    pushed,
    updatedStats,
    profileUpdated,
    conflicts,
    pullInserted: 0,
    pullUpdated: 0,
  };
}

// High-level sync: pull if we have nothing, otherwise push, then optionally pull to merge remote changes newer than ours.
export async function syncUser(
  userId: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  console.info("[sync] syncUser start", { userId });
  let snapshot = await loadSnapshot();
  console.info("[sync] syncUser loaded snapshot", {
    hasSnapshot: !!snapshot,
    snapshotUserId: snapshot?.profile.id,
    isGuest: snapshot?.profile.is_guest,
  });
  if (!snapshot) {
    snapshot = await pullRemote(userId);
    console.info("[sync] pullRemote result", {
      fromRemote: !!snapshot,
    });
    if (!snapshot) {
      // No remote data; seed a default snapshot locally and bootstrap rows remotely
      snapshot = await createDefaultSnapshot(userId);
      console.info("[sync] created default snapshot", {
        userId,
        username: snapshot.profile.username,
      });
      await ensureRemoteProfileAndStats(snapshot);
      await saveSnapshot(snapshot);
      return {
        pushed: 0,
        updatedStats: false,
        profileUpdated: false,
        conflicts: [],
        pullInserted: 0,
        pullUpdated: 0,
      };
    }
    return {
      pushed: 0,
      updatedStats: false,
      profileUpdated: false,
      conflicts: [],
      pullInserted: snapshot.levels.length,
      pullUpdated: 0,
    };
  }
  // Push changes
  const pushRes = await pushLocal(userId, options);
  console.info("[sync] pushLocal result", pushRes);

  // Optional: re-pull remote to incorporate anything new (basic approach)
  const { data: remoteLevels, error: lErr } = await supabase
    .from("level_progress")
    .select("*")
    .eq("user_id", userId);
  let pullInserted = 0;
  let pullUpdated = 0;
  if (!lErr && remoteLevels) {
    const localMap = new Map(snapshot.levels.map((l) => [l.level, l]));
    for (const r of remoteLevels as LevelProgressRow[]) {
      const local = localMap.get(r.level);
      if (!local) {
        snapshot.levels.push(r);
        pullInserted++;
      } else if (
        new Date(r.updated_at).getTime() > new Date(local.updated_at).getTime()
      ) {
        Object.assign(local, r);
        pullUpdated++;
      }
    }
  }
  snapshot.last_pulled_at = nowISO();
  await saveSnapshot(snapshot);
  await applySnapshotToGuestProgress(snapshot);
  return {
    ...pushRes,
    pullInserted: pushRes.pullInserted + pullInserted,
    pullUpdated: pushRes.pullUpdated + pullUpdated,
  };
}

// Utility to mutate a level locally & bump updated_at + last_client_update_at.
export async function upsertLocalLevel(
  update: Omit<LevelProgressRow, "updated_at" | "last_client_update_at">
) {
  const snapshot = await loadSnapshot();
  if (!snapshot) return;
  const existing = snapshot.levels.find((l) => l.level === update.level);
  const timestamp = nowISO();
  if (existing) {
    Object.assign(existing, update, {
      updated_at: timestamp,
      last_client_update_at: timestamp,
    });
  } else {
    snapshot.levels.push({
      ...update,
      updated_at: timestamp,
      last_client_update_at: timestamp,
    });
  }
  snapshot.local_revision++;
  await saveSnapshot(snapshot);
}

export async function mutateLocalStats(mutator: (s: UserStatsRow) => void) {
  const snapshot = await loadSnapshot();
  if (!snapshot) return;
  mutator(snapshot.stats);
  snapshot.stats.updated_at = nowISO();
  snapshot.local_revision++;
  await saveSnapshot(snapshot);
}

export async function mutateLocalProfile(mutator: (p: ProfileRow) => void) {
  const snapshot = await loadSnapshot();
  if (!snapshot) return;
  mutator(snapshot.profile);
  snapshot.profile.updated_at = nowISO();
  snapshot.local_revision++;
  await saveSnapshot(snapshot);
}

// Helper to set subscription tier (stored in 'status')
export async function setSubscription(tier: SubscriptionTier) {
  await mutateLocalProfile((p) => {
    p.status = tier;
  });
}

export async function clearLocalSnapshot() {
  await AsyncStorage.removeItem(LOCAL_USER_SNAPSHOT_KEY);
}
