// Test script to verify energy regeneration logic
import { calculateEnergyRegeneration, getTimeUntilNextEnergyRegen, applyEnergyRegeneration } from '../lib/energy';

console.log('Testing energy regeneration logic...');

// Test 1: Calculate energy regeneration for 2 hours ago
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
const result1 = calculateEnergyRegeneration(twoHoursAgo);
console.log('2 hours ago:', result1);

// Test 2: Apply energy regeneration with 50 current energy
const result2 = applyEnergyRegeneration(50, twoHoursAgo);
console.log('Apply regen with 50 energy:', result2);

// Test 3: Get time until next regen
const result3 = getTimeUntilNextEnergyRegen(twoHoursAgo);
console.log('Time until next regen:', result3);

// Test 4: Edge case - energy already at max
const result4 = applyEnergyRegeneration(100, twoHoursAgo);
console.log('Energy at max:', result4);

console.log('Energy regeneration tests completed.');