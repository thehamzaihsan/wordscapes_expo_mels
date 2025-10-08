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
