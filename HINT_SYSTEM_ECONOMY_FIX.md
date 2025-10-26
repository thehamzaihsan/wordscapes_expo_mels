# Hint System Economy Integration & Navigation Fix

## Overview
Fixed the hint system to use values from the economy.json file and resolved the "Go to Shop" button navigation issue in the purchase hint modal.

## Issues Fixed

### 1. ✅ Economy Values Integration
**Problem**: Hint packages were using hardcoded values instead of economy.json values  
**Solution**: Updated XP Shop and Debug Menu to use economy-based values

#### Economy Configuration (from economy.json)
```json
{
  "hints": {
    "cost": 250,    // Gems per hint package
    "quantity": 3   // Hints per package
  }
}
```

### 2. ✅ Purchase Modal Navigation Fix
**Problem**: "Go to Shop" button had TODO comment and no actual navigation  
**Solution**: Added onNavigate prop to LetterWheel component and implemented navigation

## Changes Made

### 1. XP Shop Economy Integration
**File**: `/app/components/screens/XPShopScreen.tsx`

**Before** (Hardcoded):
```typescript
const getHintPackages = () => {
  return [
    { id: 1, hints: 5, gems: 10, popular: false, badge: null },
    { id: 2, hints: 15, gems: 25, popular: true, badge: "POPULAR" },
    { id: 3, hints: 30, gems: 45, popular: false, badge: "BEST VALUE" }
  ];
};
```

**After** (Economy-Based):
```typescript
const getHintPackages = () => {
  const baseHintCost = economy.hints.cost;        // 250 gems
  const baseHintQuantity = economy.hints.quantity; // 3 hints
  
  return [
    {
      id: 1,
      hints: baseHintQuantity,                    // 3 hints
      gems: baseHintCost,                         // 250 gems
      popular: false,
      badge: null,
    },
    {
      id: 2,
      hints: baseHintQuantity * 5,                // 15 hints
      gems: Math.floor(baseHintCost * 4.2),       // 1050 gems (~16% discount)
      popular: true,
      badge: "POPULAR",
    },
    {
      id: 3,
      hints: baseHintQuantity * 10,               // 30 hints
      gems: Math.floor(baseHintCost * 7.5),       // 1875 gems (~25% discount)
      popular: false,
      badge: "BEST VALUE",
    },
  ];
};
```

### 2. Debug Menu Economy Integration
**File**: `/app/components/screens/DebugScreen.tsx`

**Before** (Hardcoded):
```typescript
<ThemedButton title="-5" onPress={() => updateResource('hints', -5)} />
<ThemedButton title="+5" onPress={() => updateResource('hints', 5)} />
<ThemedButton title="+20" onPress={() => updateResource('hints', 20)} />
```

**After** (Economy-Based):
```typescript
<ThemedButton 
  title={`-${economy.hints.quantity}`}           // "-3"
  onPress={() => updateResource('hints', -economy.hints.quantity)} 
/>
<ThemedButton 
  title={`+${economy.hints.quantity}`}           // "+3"
  onPress={() => updateResource('hints', economy.hints.quantity)} 
/>
<ThemedButton 
  title={`+${economy.hints.quantity * 5}`}       // "+15"
  onPress={() => updateResource('hints', economy.hints.quantity * 5)} 
/>
```

### 3. LetterWheel Navigation Fix
**File**: `/app/components/game/inputWheel.tsx`

**Interface Update**:
```typescript
interface LetterWheelProps {
  // ... existing props
  onNavigate?: (screen: string) => void; // Added navigation function
}
```

**Component Props**:
```typescript
const LetterWheel: React.FC<LetterWheelProps> = ({
  // ... existing props
  onNavigate, // Added onNavigate prop
}) => {
```

**Button Fix**:
```typescript
// Before (Broken)
<ThemedButton
  title="Go to Shop"
  onPress={() => {
    setPurchaseHintModal(false);
    // TODO: Navigate to XP Shop
  }}
/>

// After (Working)
<ThemedButton
  title="Go to Shop"
  onPress={() => {
    setPurchaseHintModal(false);
    if (onNavigate) {
      onNavigate('xpshop');
    }
  }}
/>
```

### 4. GameScreen Integration
**File**: `/app/components/screens/GameScreen.tsx`

**Added onNavigate prop to LetterWheel**:
```typescript
<LetterWheel
  // ... existing props
  onNavigate={onNavigate}  // Pass navigation function from GameScreen
/>
```

## Updated Package Pricing (Economy-Based)

| Package | Hints | Gems Cost | Gems per Hint | Discount |
|---------|-------|-----------|---------------|----------|
| Small   | 3     | 250       | 83.33         | None     |
| Popular | 15    | 1,050     | 70.00         | 16% off  |
| Best    | 30    | 1,875     | 62.50         | 25% off  |

## Benefits of Economy Integration

### ✅ **Centralized Configuration**
- **Single Source**: All hint values controlled from economy.json
- **Easy Updates**: Change pricing without touching multiple files
- **Consistency**: Debug menu and shop use same values

### ✅ **Scalable Pricing**
- **Base Package**: Uses exact economy values (3 hints for 250 gems)
- **Bulk Discounts**: Calculated based on base values with percentage discounts
- **Maintainability**: Adding new packages follows same economy-based pattern

### ✅ **Working Navigation**
- **Functional Flow**: "Go to Shop" now properly navigates to XP Shop
- **Seamless UX**: No more broken buttons in purchase flow
- **Complete Integration**: From game → modal → shop → purchase → back to game

## Testing Flow

### 1. **No Hints Scenario**
1. **Start level** with 0 hints
2. **Click hint button** → Purchase modal appears
3. **Click "Go to Shop"** → Navigate to XP Shop ✅
4. **Purchase hints** → Return to game with hints available

### 2. **Economy Value Verification**
1. **Open XP Shop** → See packages: 3/250, 15/1050, 30/1875 gems
2. **Open Debug Menu** → See controls: -3, +3, +15 hints
3. **All values match** economy.json configuration ✅

### 3. **Cross-Level Hint Usage**
1. **Purchase 15 hints** → Available across all levels
2. **Use hints on different levels** → Count decreases globally
3. **Shop displays** current hint count accurately ✅

## Files Modified

1. **`/app/components/screens/XPShopScreen.tsx`**
   - Updated `getHintPackages()` to use economy values
   - Maintained discount structure with percentage-based calculations

2. **`/app/components/screens/DebugScreen.tsx`**
   - Updated hint control buttons to use economy quantities
   - Dynamic button labels show actual economy values

3. **`/app/components/game/inputWheel.tsx`**
   - Added `onNavigate` prop to interface and function
   - Fixed "Go to Shop" button with proper navigation implementation

4. **`/app/components/screens/GameScreen.tsx`**
   - Passed `onNavigate` prop to LetterWheel component
   - Maintained existing navigation pattern

## Economy Value Details

### Current Economy Configuration
```json
{
  "hints": {
    "cost": 250,     // Premium pricing for strategic resource
    "quantity": 3    // Reasonable quantity per package
  }
}
```

### Package Calculations
- **Small Package**: `3 hints × 83.33 gems/hint = 250 gems`
- **Popular Package**: `15 hints × 70.00 gems/hint = 1,050 gems` (16% bulk discount)
- **Best Value Package**: `30 hints × 62.50 gems/hint = 1,875 gems` (25% bulk discount)

The hint system now fully integrates with the game's economy and provides a seamless user experience from hint usage to purchase flow!