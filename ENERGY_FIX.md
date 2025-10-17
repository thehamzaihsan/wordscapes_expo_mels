# Energy System Fix - Prevent Playing with Zero Energy

## Problem
Players could start and play levels even when their energy was zero, which broke the energy-based progression system.

## Root Cause
The energy check was only happening after level completion in `applyLevelCompletion`, but there was no check before allowing players to start a level.

## The Fix

### 1. Added Energy Check Before Level Start
**LevelScreen.tsx** - Enhanced `handleLevelPress`:
- Added energy requirement check before allowing level navigation
- Deducts energy immediately when starting a level
- Prevents navigation if insufficient energy

### 2. Visual Feedback for Energy Requirements
**LevelCard.tsx** - Added energy-aware level cards:
- Shows special "Need X Energy" state when energy is insufficient
- Disables touch interaction for levels requiring more energy than available
- Added orange tint styling for energy warning states

### 3. Configurable Energy Cost
**economy.json** - Added `costPerLevel` property:
```json
"energy": {
  "costPerLevel": 5
}
```

### 4. New Energy Deduction Function
**guest-progress.ts** - Added `deductEnergyForLevel()`:
- Safely deducts energy at level start
- Returns boolean success/failure
- Updates progress immediately

### 5. Updated Energy Flow
**Before**: Energy deducted only on level completion
**After**: Energy deducted when starting level

## Implementation Details

### Energy Cost Configuration
- **Default Cost**: 5 energy per level
- **Configurable**: Via `economy.energy.costPerLevel`
- **Consistent**: Same cost used across all components

### Visual States
1. **Unlocked + Sufficient Energy**: Normal playable level
2. **Unlocked + Insufficient Energy**: Orange tint, "Need X Energy" message, disabled
3. **Locked**: Gray lock icon (unchanged)
4. **Completed**: Hidden from list (previous fix)

### Energy Deduction Flow
1. **Check**: Verify sufficient energy before navigation
2. **Deduct**: Remove energy when starting level
3. **Navigate**: Proceed to game screen
4. **Complete**: Award rewards (no additional energy deduction)

## Benefits

✅ **Prevents Exploitation**: Can't play multiple levels on single energy payment  
✅ **Clear Feedback**: Players know when they can't afford to play  
✅ **Consistent UX**: Energy requirements are clearly communicated  
✅ **Configurable**: Energy costs can be adjusted via economy config  
✅ **Proper Flow**: Energy deducted at start, not completion  

## User Experience

- **Sufficient Energy**: Level cards are normal and clickable
- **Insufficient Energy**: Level cards show "Need X Energy" and are disabled
- **Zero Energy**: All unlocked levels become unplayable until energy regenerates
- **Energy Display**: Header shows current energy with color coding (green/red)

## Testing Scenarios

1. **Normal Play**: Start with full energy, can play levels normally
2. **Low Energy**: When energy drops below cost, levels become disabled
3. **Zero Energy**: No levels playable, must wait for regen or buy refill
4. **Energy Regen**: Levels become available again as energy regenerates
5. **Purchase Energy**: Buying energy refill re-enables level play

This fix ensures the energy system works as intended, preventing exploitation while providing clear user feedback.