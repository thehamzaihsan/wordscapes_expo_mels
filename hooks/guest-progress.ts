import economy from "@/constants/economy.json";
import levelsData from "@/constants/levels.json";
import {
  applyEnergyRegeneration,
  clampEnergy,
  getDefaultEnergy,
} from "@/lib/energy";
import { updateGuestSnapshotFromProgress } from "@/lib/guestSnapshot";

import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface GuestLevelProgress {
  level: number;
  baseWord: string;
  difficulty: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  bestScore: number;
  attempts: number;
  lastCompletedAt?: string;
}

export interface GuestCategoryProgress {
  [categoryName: string]: GuestLevelProgress[];
}

export interface GuestMeta {
  gems: number;
  xp: number;
  energy: number;
  playerName: string;
  playerLevel: number;
  avatar?: string;
  hints?: number;
  lastEnergyUpdate?: string;
}

export interface GuestProgressPayload {
  categories: GuestCategoryProgress;
  meta: GuestMeta;
  updatedAt: string;
  version: number;
}

const STORAGE_KEY_GUEST = "wordscapes_guest_progress";
const STORAGE_KEY_PREFIX = "wordscapes_user_progress:";
const CURRENT_VERSION = 7;
const DEFAULT_ENERGY_CAP = getDefaultEnergy();

const defaultMeta: GuestMeta = {
  gems: economy.gems.startingAmount,
  xp: 0,
  energy: DEFAULT_ENERGY_CAP,
  playerName: "Guest",
  playerLevel: 0,
  avatar: "🧩",
  hints: 0,
  lastEnergyUpdate: new Date().toISOString(),
};

export function xpNeededToUnlockCategory(categoryLevel: number): number {
  if (categoryLevel === 0) return 0;
  const unlockLevels = [0, 2, 4, 6, 8];
  const requiredPlayerLevel = unlockLevels[categoryLevel] || categoryLevel * 2;
  let totalXP = 0;
  for (let i = 0; i < requiredPlayerLevel; i++) {
    totalXP += xpNeededForLevel(i);
  }
  return totalXP;
}

export function getCategoryOrder(): string[] {
  return Object.keys(levelsData);
}

export function getUnlockedCategories(playerLevel: number): string[] {
  const categoryOrder = getCategoryOrder();
  const unlockedCategories: string[] = [];
  for (let i = 0; i < categoryOrder.length; i++) {
    const requiredXP = xpNeededToUnlockCategory(i);
    const requiredLevel = derivePlayerLevelFromXP(requiredXP).level;
    if (playerLevel >= requiredLevel) {
      unlockedCategories.push(categoryOrder[i]);
    } else {
      break;
    }
  }
  return unlockedCategories.length > 0
    ? unlockedCategories
    : [categoryOrder[0]];
}

function derivePlayerLevelFromXP(targetXP: number): { level: number } {
  if (targetXP === 0) return { level: 0 };
  let accumulatedXP = 0;
  let level = 0;
  while (accumulatedXP < targetXP) {
    const xpForNextLevel = xpNeededForLevel(level);
    if (accumulatedXP + xpForNextLevel <= targetXP) {
      accumulatedXP += xpForNextLevel;
      level++;
    } else {
      break;
    }
    if (level > 1000) break;
  }
  return { level };
}

export function xpNeededForLevel(level: number): number {
  return 500 + level * 100;
}

export function derivePlayerLevel(xp: number): {
  level: number;
  levelXp: number;
  nextLevelXp: number;
  totalXpForCurrentLevelStart: number;
} {
  let remaining = xp;
  let level = 0;
  let xpForThisLevel = xpNeededForLevel(level);
  let totalXpForCurrentLevelStart = 0;
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

export interface GuestAggregateStats {
  totalLevels: number;
  completedLevels: number;
  completionPercent: number;
  totalAttempts: number;
  categories: number;
  highestLevelReached: number;
}

export function aggregateGuestStats(
  progress: GuestProgressPayload
): GuestAggregateStats {
  let totalLevels = 0,
    completedLevels = 0,
    totalAttempts = 0,
    highestLevelReached = 0;
  Object.values(progress.categories).forEach((levels) => {
    levels.forEach((l) => {
      totalLevels++;
      if (l.isCompleted) {
        completedLevels++;
        highestLevelReached = Math.max(highestLevelReached, l.level);
      } else if (l.isUnlocked) {
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

async function getActiveUserId(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

function keyForUser(uid: string | null): string {
  return uid ? `${STORAGE_KEY_PREFIX}${uid}` : STORAGE_KEY_GUEST;
}

export function checkAndApplyEnergyRegeneration(
  progress: GuestProgressPayload
): { progress: GuestProgressPayload; energyGained: number } {
  if (!progress.meta.lastEnergyUpdate) {
    progress.meta.lastEnergyUpdate = new Date().toISOString();
    return { progress, energyGained: 0 };
  }
  const result = applyEnergyRegeneration(
    progress.meta.energy,
    progress.meta.lastEnergyUpdate
  );
  if (result.shouldUpdate) {
    progress.meta.energy = result.newEnergy;
    progress.meta.lastEnergyUpdate = new Date().toISOString();
    progress.updatedAt = new Date().toISOString();
  }
  return { progress, energyGained: result.energyGained };
}

export async function loadGuestProgress(): Promise<GuestProgressPayload | null> {
  try {
    const uid = await getActiveUserId();
    const key = keyForUser(uid);
    console.log('[loadGuestProgress] Loading from key:', key);
    
    let raw = await AsyncStorage.getItem(key);
    if (!raw && uid) {
      const legacy = await AsyncStorage.getItem(STORAGE_KEY_GUEST);
      if (legacy) {
        await AsyncStorage.setItem(keyForUser(uid), legacy);
        await AsyncStorage.removeItem(STORAGE_KEY_GUEST);
        raw = legacy;
      }
    }
    if (!raw) {
      console.log('[loadGuestProgress] No data found');
      return null;
    }
    
    const parsed: GuestProgressPayload = JSON.parse(raw);
    console.log('[loadGuestProgress] Loaded - Gems:', parsed.meta.gems, 'XP:', parsed.meta.xp);
    
    if (!parsed.version || parsed.version < CURRENT_VERSION) {
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
        hints: typeof parsed.meta?.hints === "number" ? parsed.meta.hints : 0,
        lastEnergyUpdate:
          parsed.meta?.lastEnergyUpdate || new Date().toISOString(),
      };
      if (parsed.version < 4 && (parsed.meta as any).coins !== undefined) {
        const oldCoins = (parsed.meta as any).coins || 0;
        const oldGems = parsed.meta.gems || 0;
        parsed.meta.gems = oldCoins + oldGems;
        delete (parsed.meta as any).coins;
        console.log(
          `[Migration] Combined ${oldCoins} coins + ${oldGems} gems = ${parsed.meta.gems} gems`
        );
      }
      if (parsed.version < 5 && parsed.categories) {
        Object.values(parsed.categories).forEach((levels: any[]) => {
          levels.forEach((level: any) => {
            if (level.stars !== undefined) delete level.stars;
          });
        });
        console.log(`[Migration] Removed stars from level progress data`);
      }
      if (parsed.version < 6 && parsed.categories) {
        const categoryKeys = Object.keys(parsed.categories);
        const firstCategoryName = categoryKeys[0];
        categoryKeys.forEach((categoryName) => {
          const levels = parsed.categories[categoryName];
          if (Array.isArray(levels)) {
            levels.forEach((level: any, levelIndex: number) => {
              if (categoryName === firstCategoryName) {
                if (levelIndex < 3) {
                  level.isUnlocked = true;
                } else {
                  const prevLevel = levels[levelIndex - 1];
                  level.isUnlocked = prevLevel?.isCompleted || false;
                }
              } else {
                if (levelIndex === 0) {
                  level.isUnlocked = true;
                } else {
                  const prevLevel = levels[levelIndex - 1];
                  level.isUnlocked = prevLevel?.isCompleted || false;
                }
              }
            });
          }
        });
        console.log(
          `[Migration] Fixed level unlock states to progressive unlocking`
        );
      }
      if (parsed.version < 7 && parsed.categories) {
        // Add missing categories for accounts created before version 7
        const levelDefinitions = levelsData as Record<string, any[]>;
        const categoryOrder = getCategoryOrder();
        const unlockedCategories = getUnlockedCategories(parsed.meta.playerLevel);
        const firstUnlockedCategory = unlockedCategories[0];
        
        categoryOrder.forEach((category) => {
          if (!parsed.categories[category] && levelDefinitions[category]) {
            const isCategoryUnlocked = unlockedCategories.includes(category);
            const isFirstCategory = category === firstUnlockedCategory;
            
            parsed.categories[category] = levelDefinitions[category].map(
              (lvl: any, idx: number) => ({
                level: lvl.level ?? idx + 1,
                baseWord: lvl.baseWord,
                difficulty: lvl.difficulty,
                isUnlocked: isCategoryUnlocked ? (isFirstCategory ? idx < 3 : idx === 0) : false,
                isCompleted: false,
                bestScore: 0,
                attempts: 0,
              })
            );
          }
        });
        
        // Fix existing first category to have first 3 levels unlocked
        if (firstUnlockedCategory && parsed.categories[firstUnlockedCategory]) {
          const firstCatLevels = parsed.categories[firstUnlockedCategory];
          for (let i = 0; i < Math.min(3, firstCatLevels.length); i++) {
            if (!firstCatLevels[i].isCompleted) {
              firstCatLevels[i].isUnlocked = true;
            }
          }
        }
        
        console.log(
          `[Migration] Added missing categories and fixed first category unlock states`
        );
      }
      parsed.version = CURRENT_VERSION;
      parsed.updatedAt = new Date().toISOString();
      // Don't save here - let the caller decide when to save to avoid race conditions
    }
    const { progress: updatedProgress, energyGained } =
      checkAndApplyEnergyRegeneration(parsed);
    // Don't save energy changes here either - return the updated progress for caller to save if needed
    return updatedProgress;
  } catch (e) {
    console.warn("Failed to load guest progress", e);
    return null;
  }
}

export async function saveGuestProgress(
  progress: GuestProgressPayload
): Promise<void> {
  try {
    const uid = await getActiveUserId();
    const key = keyForUser(uid);
    const data = JSON.stringify(progress);
    
    console.log('[saveGuestProgress] Saving to key:', key);
    console.log('[saveGuestProgress] Gems:', progress.meta.gems, 'XP:', progress.meta.xp);
    
    await AsyncStorage.setItem(key, data);
    
    // Verify it was saved
    const saved = await AsyncStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('[saveGuestProgress] Verified save - Gems:', parsed.meta.gems, 'XP:', parsed.meta.xp);
    } else {
      console.error('[saveGuestProgress] SAVE FAILED - data not in storage!');
    }
    
    await updateGuestSnapshotFromProgress(progress).catch((err) => {
      console.error('[saveGuestProgress] Snapshot update failed:', err);
    });
  } catch (e) {
    console.error("[saveGuestProgress] CRITICAL SAVE ERROR:", e);
    throw e; // Re-throw so caller knows it failed
  }
}

export function buildInitialProgress(
  levelDefs: { [category: string]: any[] },
  playerName?: string,
  playerLevel?: number
): GuestProgressPayload {
  const categories: GuestCategoryProgress = {};
  const currentPlayerLevel = playerLevel ?? 0;
  const unlockedCategories = getUnlockedCategories(currentPlayerLevel);
  const categoryOrder = getCategoryOrder();
  
  // Create ALL categories, not just unlocked ones
  categoryOrder.forEach((category) => {
    if (levelDefs[category]) {
      const isCategoryUnlocked = unlockedCategories.includes(category);
      const isFirstCategory = category === unlockedCategories[0];
      
      categories[category] = levelDefs[category].map(
        (lvl: any, idx: number) => ({
          level: lvl.level ?? idx + 1,
          baseWord: lvl.baseWord,
          difficulty: lvl.difficulty,
          // First category: unlock first 3 levels, other unlocked categories: unlock first level only, locked categories: all locked
          isUnlocked: isCategoryUnlocked ? (isFirstCategory ? idx < 3 : idx === 0) : false,
          isCompleted: false,
          bestScore: 0,
          attempts: 0,
        })
      );
    }
  });
  const totalXp = playerLevel ? calculateTotalXpForLevel(playerLevel) : 0;
  return {
    categories,
    meta: {
      ...defaultMeta,
      playerName: playerName || defaultMeta.playerName,
      playerLevel: currentPlayerLevel,
      xp: totalXp,
    },
    updatedAt: new Date().toISOString(),
    version: CURRENT_VERSION,
  };
}

function calculateTotalXpForLevel(targetLevel: number): number {
  let totalXp = 0;
  for (let level = 0; level < targetLevel; level++) {
    totalXp += xpNeededForLevel(level);
  }
  return totalXp;
}

export function applyLevelCompletion(
  progress: GuestProgressPayload,
  category: string,
  levelNumber: number,
  score: number,
  bonusWordsFound: number,
  crosswordWordsFound: number,
  attemptsThisRun: number
): GuestProgressPayload {
  console.log('[LevelCompletion] Starting:', {
    category,
    levelNumber,
    score,
    bonusWordsFound,
    crosswordWordsFound,
  });
  
  const categoryLevels = progress.categories[category];
  if (!categoryLevels) {
    console.error('[LevelCompletion] Category not found:', category);
    return progress;
  }
  
  const idx = categoryLevels.findIndex((l) => l.level === levelNumber);
  if (idx === -1) {
    console.error('[LevelCompletion] Level not found:', { category, levelNumber });
    return progress;
  }
  
  const lvl = categoryLevels[idx];
  const isFirstCompletion = !lvl.isCompleted;
  
  console.log('[LevelCompletion] Level found:', {
    levelIndex: idx,
    isFirstCompletion,
    currentlyCompleted: lvl.isCompleted,
    currentBestScore: lvl.bestScore,
  });
  const updated: GuestLevelProgress = {
    ...lvl,
    isCompleted: true,
    bestScore: Math.max(lvl.bestScore, score),
    attempts: lvl.attempts + attemptsThisRun,
    lastCompletedAt: new Date().toISOString(),
  };
  categoryLevels[idx] = updated;
  
  // Unlock next level
  if (idx + 1 < categoryLevels.length) {
    const nextLevel = categoryLevels[idx + 1];
    categoryLevels[idx + 1] = { ...nextLevel, isUnlocked: true };
    console.log('[LevelUnlock] Unlocked next level:', {
      category,
      nextLevelNumber: nextLevel.level,
      wasAlreadyUnlocked: nextLevel.isUnlocked,
    });
  } else {
    console.log('[LevelUnlock] No more levels in category:', category);
  }
  if (isFirstCompletion) {
    const gemsEarned = economy.gems.earnPerLevel + (bonusWordsFound * economy.bonusWord.rewardGems);
    const xpEarned = (crosswordWordsFound * economy.xp.gainPerWord) + (bonusWordsFound * economy.xp.gainPerBonusWord);
    
    progress.meta.gems += gemsEarned;
    progress.meta.xp += xpEarned;
    
    console.log('[Rewards] Level completion rewards:', {
      gemsEarned,
      xpEarned,
      newGemsTotal: progress.meta.gems,
      newXpTotal: progress.meta.xp,
      isFirstCompletion,
      category,
      levelNumber
    });
  } else {
    console.log('[Rewards] Level already completed - no rewards awarded');
  }
  progress.meta.lastEnergyUpdate = new Date().toISOString();
  const derived = derivePlayerLevel(progress.meta.xp);
  progress.meta.playerLevel = derived.level;
  const unlockedCategories = getUnlockedCategories(progress.meta.playerLevel);
  const levelDefinitions = levelsData as Record<string, any[]>;
  unlockedCategories.forEach((categoryName) => {
    if (!progress.categories[categoryName] && levelDefinitions[categoryName]) {
      progress.categories[categoryName] = levelDefinitions[categoryName].map(
        (lvl: any, idx: number) => ({
          level: lvl.level ?? idx + 1,
          baseWord: lvl.baseWord,
          difficulty: lvl.difficulty,
          isUnlocked: idx === 0,
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

export async function ensureCategoriesUnlocked(
  progress: GuestProgressPayload
): Promise<GuestProgressPayload> {
  const unlockedCategories = getUnlockedCategories(progress.meta.playerLevel);
  const levelDefinitions = levelsData as Record<string, any[]>;
  let modified = false;
  unlockedCategories.forEach((categoryName) => {
    if (!progress.categories[categoryName] && levelDefinitions[categoryName]) {
      progress.categories[categoryName] = levelDefinitions[categoryName].map(
        (lvl: any, idx: number) => ({
          level: lvl.level ?? idx + 1,
          baseWord: lvl.baseWord,
          difficulty: lvl.difficulty,
          isUnlocked: idx === 0,
          isCompleted: false,
          bestScore: 0,
          attempts: 0,
        })
      );
      modified = true;
      console.log(
        `[Category Unlock] Added missing category: ${categoryName} for player level ${progress.meta.playerLevel}`
      );
    }
  });
  if (modified) {
    // Reload the latest progress to avoid overwriting recent changes
    const latest = await loadGuestProgress();
    if (latest) {
      // Merge the new categories into the latest progress
      Object.keys(progress.categories).forEach((cat) => {
        if (!latest.categories[cat]) {
          latest.categories[cat] = progress.categories[cat];
        }
      });
      latest.updatedAt = new Date().toISOString();
      await saveGuestProgress(latest);
      return latest;
    } else {
      progress.updatedAt = new Date().toISOString();
      await saveGuestProgress(progress);
    }
  }
  return progress;
}

export async function deductEnergyForLevel(): Promise<boolean> {
  const progress = await loadGuestProgress();
  if (!progress) return false;
  const energyCost = economy.energy.costPerLevel;
  const currentEnergy = progress.meta.energy || 0;
  if (currentEnergy < energyCost) return false;
  progress.meta.energy = Math.max(0, progress.meta.energy - energyCost);
  progress.meta.lastEnergyUpdate = new Date().toISOString();
  progress.updatedAt = new Date().toISOString();
  await saveGuestProgress(progress);
  updateGuestSnapshotFromProgress(progress).catch(() => {});
  return true;
}

export async function completeLevelAndPersist(params: {
  category: string;
  levelNumber: number;
  score: number;
  bonusWords: number;
  crosswordWords: number;
  attempts: number;
  levelDefs?: { [category: string]: any[] };
}): Promise<GuestProgressPayload | null> {
  let progress = await loadGuestProgress();
  if (!progress && params.levelDefs) {
    progress = buildInitialProgress(params.levelDefs);
  }
  if (!progress) return null;
  const energyCost = economy.energy.costPerLevel;
  const currentEnergy = progress.meta.energy || 0;
  if (currentEnergy >= energyCost) {
    progress.meta.energy = Math.max(0, progress.meta.energy - energyCost);
    progress.meta.lastEnergyUpdate = new Date().toISOString();
    console.log(
      `[Energy] Deducted ${energyCost} energy on level completion. Remaining: ${progress.meta.energy}`
    );
  } else {
    console.warn(
      `[Energy] Insufficient energy to deduct on completion. Required: ${energyCost}, Available: ${currentEnergy}`
    );
  }
  applyLevelCompletion(
    progress,
    params.category,
    params.levelNumber,
    params.score,
    params.bonusWords,
    params.crosswordWords,
    params.attempts
  );
  
  console.log('[completeLevelAndPersist] Saving progress to storage...');
  await saveGuestProgress(progress);
  
  console.log('[completeLevelAndPersist] Updating snapshot...');
  await updateGuestSnapshotFromProgress(progress).catch((err) => {
    console.error('[completeLevelAndPersist] Failed to update snapshot:', err);
  });
  
  // After saving, if we have a user, trigger a sync.
  const uid = await getActiveUserId();
  if (uid) {
    console.log('[completeLevelAndPersist] Requesting sync for user:', uid);
    const { requestSync } = await import("@/lib/sync");
    // Request a coordinated sync; immediate flag asks the coordinator to
    // run as soon as possible but still dedupe concurrent calls.
    requestSync(uid, { immediate: true }).catch((err) => {
      console.warn("[completeLevelAndPersist] Background sync failed", err);
    });
  } else {
    console.log('[completeLevelAndPersist] No user ID - skipping sync');
  }
  
  console.log('[completeLevelAndPersist] Completion successful, returning progress');
  return progress;
}

export async function createNewGuestProfile(options: {
  playerName: string;
  levelDefs: { [category: string]: any[] };
}): Promise<GuestProgressPayload> {
  const progress = buildInitialProgress(options.levelDefs, options.playerName);
  await saveGuestProgress(progress);
  updateGuestSnapshotFromProgress(progress).catch(() => {});
  return progress;
}

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

export async function updateGuestAvatar(
  avatar: string
): Promise<GuestProgressPayload | null> {
  const progress = await loadGuestProgress();
  let working = progress;
  if (!working) {
    working = buildInitialProgress(levelsData as any);
  } else {
    working.meta.avatar = avatar;
  }
  working.updatedAt = new Date().toISOString();
  await saveGuestProgress(working);
  updateGuestSnapshotFromProgress(working).catch(() => {});
  return working;
}

export async function resetGuestEconomy(): Promise<GuestProgressPayload | null> {
  const progress = await loadGuestProgress();
  if (!progress) return null;
  progress.meta.gems = defaultMeta.gems;
  progress.meta.energy = DEFAULT_ENERGY_CAP;
  progress.meta.lastEnergyUpdate = new Date().toISOString();
  progress.updatedAt = new Date().toISOString();
  await saveGuestProgress(progress);
  updateGuestSnapshotFromProgress(progress).catch(() => {});
  return progress;
}

export async function clearGuestProgress(): Promise<void> {
  try {
    const uid = await getActiveUserId();
    await AsyncStorage.removeItem(keyForUser(uid));
  } catch (e) {
    console.warn("Failed to clear guest progress", e);
  }
}

export async function clearAllLocalProgressForActiveUser(): Promise<void> {
  try {
    const uid = await getActiveUserId();
    await AsyncStorage.removeItem(STORAGE_KEY_GUEST);
    if (uid) await AsyncStorage.removeItem(keyForUser(uid));
  } catch (e) {
    console.warn("Failed to clear local progress for active user", e);
  }
}

export async function purchaseHints(): Promise<GuestProgressPayload | null> {
  const progress = await loadGuestProgress();
  if (!progress) return null;
  const hintCost = 100;
  const hintsQuantity = 3;
  if (progress.meta.gems < hintCost) {
    throw new Error(
      `Insufficient gems. Need ${hintCost} gems to purchase ${hintsQuantity} hints.`
    );
  }
  progress.meta.gems -= hintCost;
  progress.meta.hints = (progress.meta.hints || 0) + hintsQuantity;
  progress.updatedAt = new Date().toISOString();
  await saveGuestProgress(progress);
  updateGuestSnapshotFromProgress(progress).catch(() => {});
  return progress;
}

export async function triggerEnergyRegenCheck(): Promise<GuestProgressPayload | null> {
  try {
    const progress = await loadGuestProgress();
    if (!progress) return null;
    const { progress: updatedProgress, energyGained } =
      checkAndApplyEnergyRegeneration(progress);
    if (energyGained > 0) {
      await saveGuestProgress(updatedProgress);
      return updatedProgress;
    }
    return progress;
  } catch (error) {
    console.warn("Failed to check energy regeneration:", error);
    return null;
  }
}

export async function useHint(): Promise<GuestProgressPayload | null> {
  const progress = await loadGuestProgress();
  if (!progress) return null;
  if ((progress.meta.hints || 0) <= 0) {
    throw new Error("No hints available. Purchase more hints to continue.");
  }
  progress.meta.hints = (progress.meta.hints || 0) - 1;
  progress.updatedAt = new Date().toISOString();
  await saveGuestProgress(progress);
  updateGuestSnapshotFromProgress(progress).catch(() => {});
  return progress;
}
