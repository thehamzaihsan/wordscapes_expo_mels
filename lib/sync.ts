import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import type {
  LocalUserSnapshot,
  ProfileRow,
  UserStatsRow,
  LevelProgressRow,
  SyncResult,
  SyncOptions,
  LevelConflict,
  SubscriptionTier,
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

// Build a snapshot from guest progress (migration path)
export interface GuestToUserParams {
  guestName: string;
  avatar?: string;
  guestCoins: number;
  guestGems: number;
  guestXp: number;
  guestLevels: {
    level: number;
    stars: number;
    completed: boolean;
    lastCompletedAt?: string;
    theme?: string;
  }[]; // flattened from guest categories
}

export async function createInitialSnapshotFromGuest(
  userId: string,
  params: GuestToUserParams
): Promise<LocalUserSnapshot> {
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
    coin: params.guestCoins,
    gems: params.guestGems,
    last_streak_date: null,
    updated_at: nowISO(),
  };
  const levels: LevelProgressRow[] = params.guestLevels.map((l) => ({
    user_id: userId,
    level: l.level,
    theme: l.theme || null,
    stars: l.stars,
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
    coin: 0,
    gems: 0,
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
