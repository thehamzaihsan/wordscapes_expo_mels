// Shared types mirroring remote Postgres tables (profiles, user_stats, level_progress)
// and a consolidated LocalSnapshot for offline-first sync.

export interface ProfileRow {
  id: string; // uuid
  username: string;
  avatar?: string | null;
  status?: string | null;
  is_guest: boolean;
  created_at: string; // ISO
  updated_at: string; // ISO
}

export interface UserStatsRow {
  user_id: string; // uuid FK -> profiles.id
  xp: number;
  coin: number; // you chose singular 'coin'
  gems: number;
  last_streak_date?: string | null; // ISO date (YYYY-MM-DD)
  updated_at: string; // ISO
}

export interface LevelProgressRow {
  user_id: string; // FK -> profiles.id (part of PK)
  level: number; // part of PK
  theme?: string | null;
  stars: number; // 0..3
  completed: boolean;
  first_completed_at?: string | null; // timestamptz
  last_completed_at?: string | null; // timestamptz
  last_client_update_at?: string | null; // timestamptz (for conflict resolution)
  updated_at: string; // timestamptz
}

// Local canonical offline shape combining all tables for one user.
export interface LocalUserSnapshot {
  profile: ProfileRow;
  stats: UserStatsRow;
  levels: LevelProgressRow[]; // list (composite PK user_id+level)
  // A revision marker we maintain locally to know if pending changes exist.
  local_revision: number;
  last_pulled_at?: string; // when we last pulled from server
  last_pushed_at?: string; // when we last successfully pushed to server
  // For future: queue of operations; for now we diff arrays.
}

export interface SyncResult {
  pushed: number; // number of level rows pushed
  updatedStats: boolean; // stats updated remotely
  profileUpdated: boolean;
  conflicts: LevelConflict[]; // conflicts encountered
  pullInserted: number; // level rows pulled (new locally)
  pullUpdated: number; // level rows updated locally from server
}

export interface LevelConflict {
  level: number;
  local: LevelProgressRow;
  remote: LevelProgressRow;
  resolution: "kept_local" | "took_remote" | "merged";
}

// Conflict resolution strategy configuration.
export interface SyncOptions {
  conflictStrategy?: "prefer_local" | "prefer_remote" | "latest_timestamp";
  batchSize?: number; // for large sets
}
