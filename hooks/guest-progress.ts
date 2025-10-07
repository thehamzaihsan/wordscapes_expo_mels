import AsyncStorage from "@react-native-async-storage/async-storage";
import levelsData from "@/constants/levels.json";
import economy from "@/constants/economy.json";
import { updateGuestSnapshotFromProgress } from "@/lib/guestSnapshot";

/**
 * Offline guest progress model (mirrors future remote schema subset)
 */
export interface GuestLevelProgress {
  level: number;
  baseWord: string;
  difficulty: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  bestScore: number; // Highest score achieved
  attempts: number; // Total attempts (completions + failures if tracked)
  lastCompletedAt?: string; // ISO timestamp
}

export interface GuestCategoryProgress {
  [categoryName: string]: GuestLevelProgress[];
}

export interface GuestMeta {
  /** Premium currency (previously had separate coins) */
  gems: number;
  /** Accumulated XP used to derive playerLevel */
  xp: number;
  /** Current player stamina/energy */
  energy: number;
  /** Chosen guest display name */
  playerName: string;
  /** Player progression level (RPG style, separate from puzzle level numbering) */
  playerLevel: number;
  /** Selected avatar identifier (emoji or key) */
  avatar?: string;
}

export interface GuestProgressPayload {
  categories: GuestCategoryProgress;
  meta: GuestMeta;
  updatedAt: string; // ISO timestamp for simple last-write wins later
  version: number; // bump if shape changes
}

const STORAGE_KEY = "wordscapes_guest_progress";
const CURRENT_VERSION = 5; // Incremented for star removal migration

/** Default meta for a new guest profile */
const defaultMeta: GuestMeta = {
  gems: economy.gems.startingAmount, // Dynamic starting gems from economy config
  xp: 0,
  energy: 100,
  playerName: "Guest",
  playerLevel: 0,
  avatar: "🧩",
};

/**
 * XP curve utilities
 * Level 0 -> 1 requires 500 xp, and each subsequent level requires +100 xp more than the previous.
 * (i.e. incremental requirements: 500, 600, 700, ...)
 */
export function xpNeededForLevel(level: number): number {
  // xp required to go FROM this level TO the next
  return 500 + level * 100; // linear ramp
}

export function derivePlayerLevel(xp: number): {
  level: number;
  levelXp: number; // xp accumulated within current level
  nextLevelXp: number; // xp required to reach next level from current level start
  totalXpForCurrentLevelStart: number;
} {
  let remaining = xp;
  let level = 0;
  let xpForThisLevel = xpNeededForLevel(level);
  let totalXpForCurrentLevelStart = 0;

  // Prevent pathological loops
  let guard = 0;
  while (remaining >= xpForThisLevel && guard < 1000) {
    remaining -= xpForThisLevel;
    totalXpForCurrentLevelStart += xpForThisLevel;
    level++;
    xpForThisLevel = xpNeededForLevel(level);
    guard++;
  }

  return {
    level,
    levelXp: remaining,
    nextLevelXp: xpForThisLevel,
    totalXpForCurrentLevelStart,
  };
}

// --- Aggregated stats (for profile screen) ---
export interface GuestAggregateStats {
  totalLevels: number;
  completedLevels: number;
  completionPercent: number;
  totalAttempts: number;
  categories: number;
  highestLevelReached: number; // max level index completed or unlocked
}

export function aggregateGuestStats(
  progress: GuestProgressPayload
): GuestAggregateStats {
  let totalLevels = 0;
  let completedLevels = 0;
  let totalAttempts = 0;
  let highestLevelReached = 0;
  Object.values(progress.categories).forEach((levels) => {
    levels.forEach((l) => {
      totalLevels++;
      if (l.isCompleted) {
        completedLevels++;
        highestLevelReached = Math.max(highestLevelReached, l.level);
      } else if (l.isUnlocked) {
        // unlocked but not completed still counts for reachable tracking
        highestLevelReached = Math.max(highestLevelReached, l.level - 1);
      }
      totalAttempts += l.attempts;
    });
  });
  const completionPercent = totalLevels
    ? Math.round((completedLevels / totalLevels) * 100)
    : 0;
  return {
    totalLevels,
    completedLevels,
    completionPercent,
    totalAttempts,
    categories: Object.keys(progress.categories).length,
    highestLevelReached,
  };
}

export async function loadGuestProgress(): Promise<GuestProgressPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: GuestProgressPayload = JSON.parse(raw);
    // Lightweight migration for older versions
    if (!parsed.version || parsed.version < CURRENT_VERSION) {
      // Ensure meta exists
      parsed.meta = {
        ...defaultMeta,
        ...parsed.meta,
        playerName: parsed.meta?.playerName || "Guest",
        playerLevel:
          (parsed as any).playerLevel ?? parsed.meta?.playerLevel ?? 0,
        avatar: parsed.meta?.avatar || defaultMeta.avatar,
      };
      
      // Migration for version 4: Combine coins + gems into single gems currency
      if (parsed.version < 4 && (parsed.meta as any).coins !== undefined) {
        const oldCoins = (parsed.meta as any).coins || 0;
        const oldGems = parsed.meta.gems || 0;
        parsed.meta.gems = oldCoins + oldGems; // Combine both currencies
        delete (parsed.meta as any).coins; // Remove old coins property
        console.log(`[Migration] Combined ${oldCoins} coins + ${oldGems} gems = ${parsed.meta.gems} gems`);
      }
      
      // Migration for version 5: Remove stars from level progress
      if (parsed.version < 5 && parsed.categories) {
        Object.values(parsed.categories).forEach((levels: any[]) => {
          levels.forEach((level: any) => {
            if (level.stars !== undefined) {
              delete level.stars; // Remove stars property
            }
          });
        });
        console.log(`[Migration] Removed stars from level progress data`);
      }
      
      parsed.version = CURRENT_VERSION;
      parsed.updatedAt = new Date().toISOString();
      // Persist migrated structure (fire & forget)
      saveGuestProgress(parsed).catch(() => {});
    }
    return parsed;
  } catch (e) {
    console.warn("Failed to load guest progress", e);
    return null;
  }
}

export async function saveGuestProgress(
  progress: GuestProgressPayload
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    // Fire & forget: mirror into unified snapshot for future upgrade/sync.
    updateGuestSnapshotFromProgress(progress).catch(() => {});
  } catch (e) {
    console.warn("Failed to save guest progress", e);
  }
}

/**
 * Initialize progress structure from level definitions (first 3 unlocked rule).
 */
export function buildInitialProgress(
  levelDefs: {
    [category: string]: any[];
  },
  playerName?: string
): GuestProgressPayload {
  const categories: GuestCategoryProgress = {};
  Object.keys(levelDefs).forEach((category) => {
    categories[category] = levelDefs[category].map((lvl: any, idx: number) => ({
      level: lvl.level ?? idx + 1,
      baseWord: lvl.baseWord,
      difficulty: lvl.difficulty,
      isUnlocked: idx < 3, // unlock first 3
      isCompleted: false,
      bestScore: 0,
      attempts: 0,
    }));
  });
  return {
    categories,
    meta: { ...defaultMeta, playerName: playerName || defaultMeta.playerName },
    updatedAt: new Date().toISOString(),
    version: CURRENT_VERSION,
  };
}

/**
 * Update progress after a level completion. Unlocks the next level in the same category.
 */
export function applyLevelCompletion(
  progress: GuestProgressPayload,
  category: string,
  levelNumber: number,
  score: number,
  bonusWordsFound: number,
  attemptsThisRun: number
): GuestProgressPayload {
  const categoryLevels = progress.categories[category];
  if (!categoryLevels) return progress; // unknown category
  const idx = categoryLevels.findIndex((l) => l.level === levelNumber);
  if (idx === -1) return progress;

  const lvl = categoryLevels[idx];
  
  // Check if this is the first time completing this level
  const isFirstCompletion = !lvl.isCompleted;

  const updated: GuestLevelProgress = {
    ...lvl,
    isCompleted: true,
    bestScore: Math.max(lvl.bestScore, score),
    attempts: lvl.attempts + attemptsThisRun,
    lastCompletedAt: new Date().toISOString(),
  };
  categoryLevels[idx] = updated;

  // Unlock next level if exists
  if (idx + 1 < categoryLevels.length) {
    categoryLevels[idx + 1] = { ...categoryLevels[idx + 1], isUnlocked: true };
  }

  // Only reward on first completion
  if (isFirstCompletion) {
    // Reward meta (tuned): gems & xp scale with performance
    progress.meta.gems += economy.gems.earnPerLevel; // Fixed gem reward from economy config
    progress.meta.gems += bonusWordsFound * economy.bonusWord.rewardGems; // Additional gems for bonus words
    // XP: 1 per 20 score points (so early levels feel faster)
    progress.meta.xp += Math.max(1, Math.floor(score / 20));
    // Bonus flat xp for bonus words diversity
    progress.meta.xp += Math.min(50, bonusWordsFound * 5);
  }
  
  // Always deduct energy (regardless of first completion or not)
  progress.meta.energy = Math.max(0, progress.meta.energy - 5); // small energy cost

  // Recalculate playerLevel from total xp
  const derived = derivePlayerLevel(progress.meta.xp);
  progress.meta.playerLevel = derived.level;

  progress.updatedAt = new Date().toISOString();
  return progress;
}

/** Convenience wrapper to load, modify, and persist */
export async function completeLevelAndPersist(params: {
  category: string;
  levelNumber: number;
  score: number;
  bonusWords: number;
  attempts: number;
  levelDefs?: { [category: string]: any[] }; // fallback if empty
}): Promise<GuestProgressPayload | null> {
  let progress = await loadGuestProgress();
  if (!progress && params.levelDefs) {
    progress = buildInitialProgress(params.levelDefs);
  }
  if (!progress) return null;
  applyLevelCompletion(
    progress,
    params.category,
    params.levelNumber,
    params.score,
    params.bonusWords,
    params.attempts
  );
  await saveGuestProgress(progress);
  // ensure snapshot captured even if saveGuestProgress short-circuits later
  updateGuestSnapshotFromProgress(progress).catch(() => {});
  return progress;
}

/**
 * Create a brand-new guest profile after the user chooses "Continue as Guest".
 * This resets any existing stored progress.
 */
export async function createNewGuestProfile(options: {
  playerName: string;
  levelDefs: { [category: string]: any[] };
}): Promise<GuestProgressPayload> {
  const progress = buildInitialProgress(options.levelDefs, options.playerName);
  await saveGuestProgress(progress);
  updateGuestSnapshotFromProgress(progress).catch(() => {});
  return progress;
}

/** Update only the guest display name */
export async function updateGuestName(
  newName: string
): Promise<GuestProgressPayload | null> {
  const progress = await loadGuestProgress();
  let working = progress;
  if (!working) {
    working = buildInitialProgress(levelsData as any, newName);
  } else {
    working.meta.playerName = newName;
  }
  working.updatedAt = new Date().toISOString();
  await saveGuestProgress(working);
  updateGuestSnapshotFromProgress(working).catch(() => {});
  return working;
}

/** Update avatar */
export async function updateGuestAvatar(
  avatar: string
): Promise<GuestProgressPayload | null> {
  const progress = await loadGuestProgress();
  let working = progress;
  if (!working) {
    working = buildInitialProgress(levelsData as any);
  }
  working.meta.avatar = avatar;
  working.updatedAt = new Date().toISOString();
  await saveGuestProgress(working);
  updateGuestSnapshotFromProgress(working).catch(() => {});
  return working;
}

/** Reset currency to starting amounts while preserving levels */
export async function resetGuestEconomy(): Promise<GuestProgressPayload | null> {
  const progress = await loadGuestProgress();
  if (!progress) return null;
  progress.meta.gems = defaultMeta.gems;
  progress.updatedAt = new Date().toISOString();
  await saveGuestProgress(progress);
  updateGuestSnapshotFromProgress(progress).catch(() => {});
  return progress;
}

/** Completely remove stored guest progress from device */
export async function clearGuestProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Failed to clear guest progress", e);
  }
}
