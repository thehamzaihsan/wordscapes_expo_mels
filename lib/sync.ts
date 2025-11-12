import economy from "@/constants/economy.json";
import levelsData from "@/constants/levels.json";
import {
    derivePlayerLevel,
    getCategoryOrder,
    GuestCategoryProgress,
    GuestMeta,
    GuestProgressPayload,
    saveGuestProgress,
} from "@/hooks/guest-progress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDefaultEnergy } from "./energy";
import { supabase } from "./supabase";
import type {
    LevelProgressRow,
    LocalUserSnapshot,
    ProfileRow,
    SubscriptionTier,
    SyncOptions,
    SyncResult,
    UserStatsRow,
} from "./syncTypes";

const LOCAL_USER_SNAPSHOT_KEY = "wordscapes_user_snapshot_v1";

function nowISO() {
  return new Date().toISOString();
}

const VALID_SUB_TIERS: SubscriptionTier[] = ["free", "weekly", "monthly"];

function sanitizeStatus(p: ProfileRow) {
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

export async function mutateLocalProfile(
  mutator: (profile: ProfileRow) => void
): Promise<void> {
  const snapshot = await loadSnapshot();
  if (!snapshot) return;
  mutator(snapshot.profile);
  await saveSnapshot(snapshot);
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
    const meta: GuestMeta = {
      playerName: snapshot.profile.username,
      avatar: snapshot.profile.avatar || "🧩",
      xp: snapshot.stats.xp,
      gems: snapshot.stats.gems,
      energy: snapshot.stats.energy,
      playerLevel: derivePlayerLevel(snapshot.stats.xp).level,
      hints: snapshot.stats.hints || 0,
      lastEnergyUpdate: snapshot.stats.last_energy_update || nowISO(),
    };

    const categories: GuestCategoryProgress = {};
    const levelDefs = levelsData as Record<string, any[]>;
    const categoryOrder = getCategoryOrder();

    for (const catName of categoryOrder) {
      if (levelDefs[catName]) {
        categories[catName] = levelDefs[catName].map((lvlDef, idx) => ({
          level: lvlDef.level ?? idx + 1,
          baseWord: lvlDef.baseWord,
          difficulty: lvlDef.difficulty,
          isUnlocked: false,
          isCompleted: false,
          bestScore: 0,
          attempts: 0,
        }));
      }
    }

    snapshot.levels.forEach((remoteLevel) => {
      const categoryLevels = categories[remoteLevel.theme || "Mountain"];
      if (!categoryLevels) return;
      const levelIndex = categoryLevels.findIndex(
        (l) => l.level === remoteLevel.level
      );
      if (levelIndex > -1) {
        categoryLevels[levelIndex].isCompleted = remoteLevel.completed;
        categoryLevels[levelIndex].isUnlocked = true;
        if (remoteLevel.completed) {
          if (levelIndex + 1 < categoryLevels.length) {
            categoryLevels[levelIndex + 1].isUnlocked = true;
          }
        }
      }
    });

    const finalProgress: GuestProgressPayload = {
      categories,
      meta,
      updatedAt: snapshot.last_pulled_at || nowISO(),
      version: 6,
    };

    await saveGuestProgress(finalProgress);
  } catch (err) {
    console.warn("[sync] Failed to mirror snapshot into guest progress", err);
  }
}

export async function createDefaultSnapshot(
  userId: string,
  opts?: { username?: string | null; avatar?: string | null }
): Promise<LocalUserSnapshot> {
  const defaultEnergy = getDefaultEnergy();
  const profile: ProfileRow = {
    id: userId,
    username: (opts?.username?.trim?.() || "Player") as string,
    avatar: (opts?.avatar ?? null) as any,
    status: "free",
    is_guest: false,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  const stats: UserStatsRow = {
    user_id: userId,
    xp: 0,
    gems: economy.gems.startingAmount,
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

async function ensureRemoteProfileAndStats(snapshot: LocalUserSnapshot) {
  const uid = snapshot.profile.id;
  try {
    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", uid)
      .maybeSingle();
    if (pErr) logSupabaseWarning("fetch profile", pErr, { uid });
    if (!prof && !pErr) {
      const insertProfile = { ...snapshot.profile, is_guest: false };
      const { error: insertErr } = await supabase
        .from("profiles")
        .insert(insertProfile as any);
      if (insertErr)
        logSupabaseWarning("insert profile", insertErr, insertProfile);
    }
    const { data: stats, error: sErr } = await supabase
      .from("user_stats")
      .select("user_id")
      .eq("user_id", uid)
      .maybeSingle();
    if (sErr) logSupabaseWarning("fetch stats", sErr, { uid });
    if (!stats && !sErr) {
      const { error: insertStatsErr } = await supabase
        .from("user_stats")
        .insert(snapshot.stats as any);
      if (insertStatsErr)
        logSupabaseWarning(
          "insert stats",
          insertStatsErr,
          snapshot.stats as any
        );
    }
  } catch (e: any) {
    console.warn("bootstrap ensureRemoteProfileAndStats error", e?.message);
  }
}

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
  if (!profileData) return null;

  const finalStatsData = statsData || {
    user_id: userId,
    xp: 0,
    gems: economy.gems.startingAmount,
    energy: getDefaultEnergy(),
    last_streak_date: null,
    updated_at: nowISO(),
  };

  const snapshot: LocalUserSnapshot = {
    profile: profileData as ProfileRow,
    stats: finalStatsData as UserStatsRow,
    levels: (levelData || []) as LevelProgressRow[],
    local_revision: 0,
    last_pulled_at: nowISO(),
    last_pushed_at: undefined,
  };
  sanitizeStatus(snapshot.profile);
  await saveSnapshot(snapshot);
  await applySnapshotToGuestProgress(snapshot);
  return snapshot;
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

type LevelDiff =
  | { type: "new"; local: LevelProgressRow }
  | { type: "update"; local: LevelProgressRow; remote: LevelProgressRow };

export async function pushLocal(
  userId: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const snapshot = await loadSnapshot();
  if (!snapshot || snapshot.profile.id !== userId) {
    return {
      pushed: 0,
      updatedStats: false,
      profileUpdated: false,
      conflicts: [],
      pullInserted: 0,
      pullUpdated: 0,
    };
  }

  sanitizeStatus(snapshot.profile);
  await ensureRemoteProfileAndStats(snapshot);

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

  let pushed = 0;
  for (const d of diffs) {
    if (d.type === "new") {
      try {
        // Use upsert to avoid duplicate-key errors when multiple clients attempt
        // to insert the same level progress concurrently.
        const { error } = await supabase
          .from("level_progress")
          .upsert(d.local as any, { onConflict: "user_id,level" });
        if (!error) pushed++;
        else console.warn("upsert level_progress error", error);
      } catch (e) {
        console.warn("upsert level_progress exception", e);
      }
    } else if (d.type === "update") {
      const { error } = await supabase
        .from("level_progress")
        .update(d.local)
        .match({ user_id: userId, level: d.local.level });
      if (!error) pushed++;
      else console.warn("update level_progress error", error);
    }
  }

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
        avatar: snapshot.profile.avatar,
        status: snapshot.profile.status,
        updated_at: nowISO(),
      };
      
      // Only update username if it's different (case-insensitive check)
      const localUsername = snapshot.profile.username?.toLowerCase();
      const remoteUsername = remoteProfile.username?.toLowerCase();
      
      if (localUsername !== remoteUsername) {
        // Check if username is already taken by another user
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", snapshot.profile.username || "")
          .neq("id", userId)
          .maybeSingle();
        
        if (!existingUser) {
          // Username not taken, safe to update
          partial.username = snapshot.profile.username;
        } else {
          // Username taken, sync local to match remote
          console.warn("[sync] Username already taken, keeping current username");
          snapshot.profile.username = remoteProfile.username;
          await saveSnapshot(snapshot);
        }
      }
      // If same username (case-insensitive), don't include it in update to avoid constraint violation
      
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
    conflicts: [],
    pullInserted: 0,
    pullUpdated: 0,
  };
}

export async function syncUser(
  userId: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  let snapshot = await loadSnapshot();
  if (!snapshot) {
    snapshot = await pullRemote(userId);
    if (!snapshot) {
      // Initialize with auth metadata username/avatar if available
      try {
        const { data } = await supabase.auth.getUser();
        const meta = ((data?.user?.user_metadata as any) || {}) as Record<string, any>;
        const desiredUsername =
          (typeof meta?.username === "string" && meta.username.trim()) ||
          (data?.user?.email ? data.user.email.split("@")[0] : "Player");
        const desiredAvatar =
          (typeof meta?.avatar === "string" && meta.avatar.trim()) || null;
        snapshot = await createDefaultSnapshot(userId, {
          username: desiredUsername,
          avatar: desiredAvatar,
        });
      } catch {
        snapshot = await createDefaultSnapshot(userId);
      }
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
  const pushRes = await pushLocal(userId, options);

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

/*
 * requestSync: coordination wrapper around syncUser to prevent concurrent
 * duplicate syncs and to debounce frequent requests. Use this from UI/hooks
 * when you want a safer sync that won't hammer the server.
 */
const syncLocks = new Map<string, Promise<SyncResult> | null>();
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
const lastSyncAt = new Map<string, number>();

export function requestSync(
  userId: string,
  opts: { immediate?: boolean; reason?: string } = {}
) {
  // If there's an in-flight sync for this user, return it so callers can await
  const existing = syncLocks.get(userId);
  if (existing) return existing;

  const now = Date.now();
  const recent = lastSyncAt.get(userId) || 0;

  const perform = async () => {
    try {
      const p = syncUser(userId, {});
      syncLocks.set(userId, p);
      const res = await p;
      lastSyncAt.set(userId, Date.now());
      return res;
    } finally {
      // clear lock
      syncLocks.delete(userId);
      const t = pendingTimers.get(userId);
      if (t) {
        clearTimeout(t);
        pendingTimers.delete(userId);
      }
    }
  };

  if (!opts.immediate && now - recent < 5000) {
    // debounce: schedule a sync shortly (coalesce multiple requests)
    return new Promise<SyncResult>((resolve, reject) => {
      const existingTimer = pendingTimers.get(userId);
      if (existingTimer) clearTimeout(existingTimer);
      const t = setTimeout(() => {
        perform().then(resolve).catch(reject);
      }, 3000);
      pendingTimers.set(userId, t);
    });
  }

  // Immediate or not-recent: run now
  const runP = perform();
  // store lock so concurrent callers get same promise
  syncLocks.set(userId, runP);
  return runP;
}
