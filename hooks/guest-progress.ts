import economy from "@/constants/economy.json";
import levelsData from "@/constants/levels.json";
import { clampEnergy, getDefaultEnergy } from "@/lib/energy";
import { updateGuestSnapshotFromProgress } from "@/lib/guestSnapshot";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
    parsed.meta.energy = clampEnergy(
      typeof parsed.meta.energy === "number"
        ? parsed.meta.energy
        : DEFAULT_ENERGY_CAP
    );

    return parsed;
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
const DEFAULT_ENERGY_CAP = getDefaultEnergy();

/** Default meta for a new guest profile */
const defaultMeta: GuestMeta = {
  gems: economy.gems.startingAmount, // Dynamic starting gems from economy config
  xp: 0,
  energy: DEFAULT_ENERGY_CAP,
  playerName: "Guest",
  playerLevel: 0,
  avatar: "🧩",
};

/**
 * Calculate XP required to unlock a specific category level
 * Category 0 (Mountain): Always unlocked (0 XP)
 * Category 1 (Ocean): Unlock at player level 2 (1100 XP total)
 * Category 2 (Forest): Unlock at player level 4 (2800 XP total)
 */
export function xpNeededToUnlockCategory(categoryLevel: number): number {
  if (categoryLevel === 0) return 0; // First category (Mountain) is always unlocked

  // Explicit mapping to ensure proper progression
  const unlockLevels = [0, 2, 4, 6, 8]; // Player levels required for each category
  const requiredPlayerLevel = unlockLevels[categoryLevel] || categoryLevel * 2;

  // Calculate total XP needed to reach the required player level
  let totalXP = 0;
  for (let i = 0; i < requiredPlayerLevel; i++) {
    totalXP += xpNeededForLevel(i);
  }

  return totalXP;
}

/**
 * Get category order from levels.json
 */
export function getCategoryOrder(): string[] {
  return Object.keys(levelsData);
}

/**
 * Determine which categories should be unlocked based on player level
 */
export function getUnlockedCategories(playerLevel: number): string[] {
  const categoryOrder = getCategoryOrder();
  const unlockedCategories: string[] = [];

  for (let i = 0; i < categoryOrder.length; i++) {
    const requiredXP = xpNeededToUnlockCategory(i);
    const requiredLevel = derivePlayerLevelFromXP(requiredXP).level;

    if (playerLevel >= requiredLevel) {
      unlockedCategories.push(categoryOrder[i]);
    } else {
      break; // Categories unlock in order
    }
  }

  return unlockedCategories.length > 0
    ? unlockedCategories
    : [categoryOrder[0]]; // Always unlock first category
}

/**
 * Helper function to get player level from XP requirement
 */
function derivePlayerLevelFromXP(targetXP: number): { level: number } {
  if (targetXP === 0) return { level: 0 };

  let accumulatedXP = 0;
  let level = 0;

  // Calculate what level this amount of XP corresponds to
  while (accumulatedXP < targetXP) {
    const xpForNextLevel = xpNeededForLevel(level);
    if (accumulatedXP + xpForNextLevel <= targetXP) {
      accumulatedXP += xpForNextLevel;
      level++;
    } else {
      break;
    }

    // Prevent infinite loop
    if (level > 1000) break;
  }

  return { level };
}
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
        energy: clampEnergy(
          typeof parsed.meta?.energy === "number"
            ? parsed.meta.energy
            : DEFAULT_ENERGY_CAP
        ),
      };

      // Migration for version 4: Combine coins + gems into single gems currency
      if (parsed.version < 4 && (parsed.meta as any).coins !== undefined) {
        const oldCoins = (parsed.meta as any).coins || 0;
        const oldGems = parsed.meta.gems || 0;
        parsed.meta.gems = oldCoins + oldGems; // Combine both currencies
        delete (parsed.meta as any).coins; // Remove old coins property
        console.log(
          `[Migration] Combined ${oldCoins} coins + ${oldGems} gems = ${parsed.meta.gems} gems`
        );
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
  crosswordWordsFound: number, // Add crossword words count parameter
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
    // Dynamic XP calculation using economy config
    progress.meta.xp += crosswordWordsFound * economy.xp.gainPerWord; // XP per crossword word found
    progress.meta.xp += bonusWordsFound * economy.xp.gainPerBonusWord; // XP per bonus word found
  }

  // Always deduct energy (regardless of first completion or not)
  // Dynamic energy cost from economy config
  progress.meta.energy = Math.max(0, progress.meta.energy - 5); // small energy cost

  // Recalculate playerLevel from total xp
  const derived = derivePlayerLevel(progress.meta.xp);
  progress.meta.playerLevel = derived.level;

  // Check if new categories should be unlocked
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
          isUnlocked: idx < 3, // unlock first 3 levels of new category
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

  progress.updatedAt = new Date().toISOString();
  return progress;
}

/** Convenience wrapper to load, modify, and persist */
export async function completeLevelAndPersist(params: {
  category: string;
  levelNumber: number;
  score: number;
  bonusWords: number;
  crosswordWords: number; // Add crossword words count
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
    params.crosswordWords, // Pass crossword words count
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
  progress.meta.energy = DEFAULT_ENERGY_CAP;
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
