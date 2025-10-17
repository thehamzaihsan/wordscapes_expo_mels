import economy from "@/constants/economy.json";

/**
 * Resolve the maximum/default energy value from configuration, with sensible fallbacks.
 */
export function getDefaultEnergy(): number {
  const refill = Number((economy as any)?.energy?.refillMax);
  if (!Number.isNaN(refill) && refill > 0) {
    return refill;
  }
  const dailyCap = Number((economy as any)?.dailyLogin?.maxEnergy);
  if (!Number.isNaN(dailyCap) && dailyCap > 0) {
    return dailyCap;
  }
  return 100;
}

/**
 * Ensure an arbitrary energy value stays within the configured bounds.
 */
export function clampEnergy(value: number): number {
  const max = getDefaultEnergy();
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(value, max));
}

/**
 * Constants for energy regeneration
 */
export const ENERGY_REGEN_RATE = 5; // Energy gained per hour
export const ENERGY_REGEN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Calculate how much energy should be regenerated based on time passed
 */
export function calculateEnergyRegeneration(lastUpdateTime: string): {
  energyToAdd: number;
  hoursElapsed: number;
  nextRegenTime: Date;
} {
  const lastUpdate = new Date(lastUpdateTime);
  const now = new Date();
  const timeDiffMs = now.getTime() - lastUpdate.getTime();
  const hoursElapsed = Math.floor(timeDiffMs / ENERGY_REGEN_INTERVAL_MS);
  
  const energyToAdd = hoursElapsed * ENERGY_REGEN_RATE;
  
  // Calculate when the next energy regen will occur
  const nextRegenTime = new Date(lastUpdate.getTime() + ((hoursElapsed + 1) * ENERGY_REGEN_INTERVAL_MS));
  
  return {
    energyToAdd,
    hoursElapsed,
    nextRegenTime,
  };
}

/**
 * Apply energy regeneration to a current energy value
 */
export function applyEnergyRegeneration(
  currentEnergy: number,
  lastUpdateTime: string
): {
  newEnergy: number;
  energyGained: number;
  nextRegenTime: Date;
  shouldUpdate: boolean;
} {
  const maxEnergy = getDefaultEnergy();
  
  // If already at max energy, no need to regenerate
  if (currentEnergy >= maxEnergy) {
    return {
      newEnergy: currentEnergy,
      energyGained: 0,
      nextRegenTime: new Date(),
      shouldUpdate: false,
    };
  }
  
  const { energyToAdd, nextRegenTime } = calculateEnergyRegeneration(lastUpdateTime);
  
  if (energyToAdd <= 0) {
    return {
      newEnergy: currentEnergy,
      energyGained: 0,
      nextRegenTime,
      shouldUpdate: false,
    };
  }
  
  const newEnergy = clampEnergy(currentEnergy + energyToAdd);
  const actualEnergyGained = newEnergy - currentEnergy;
  
  return {
    newEnergy,
    energyGained: actualEnergyGained,
    nextRegenTime,
    shouldUpdate: true,
  };
}

/**
 * Get time remaining until next energy regeneration
 */
export function getTimeUntilNextEnergyRegen(lastUpdateTime: string): {
  timeRemaining: number; // milliseconds
  nextRegenTime: Date;
  formattedTime: string; // "1h 23m" format
} {
  const { nextRegenTime } = calculateEnergyRegeneration(lastUpdateTime);
  const now = new Date();
  const timeRemaining = Math.max(0, nextRegenTime.getTime() - now.getTime());
  
  const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  
  let formattedTime = "";
  if (hours > 0) {
    formattedTime = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formattedTime = `${minutes}m`;
  } else {
    formattedTime = "Now";
  }
  
  return {
    timeRemaining,
    nextRegenTime,
    formattedTime,
  };
}
