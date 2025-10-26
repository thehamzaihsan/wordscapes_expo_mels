# Navigation Test for "Go to Shop" Button

## Issue
The "Go to Shop" button in the hint purchase modal was not working.

## Root Cause
The `handleNavigate` function in `/app/game.tsx` only handled the "levels" screen but not the "xpshop" screen.

## Fix Applied

### 1. Updated GameRoute Navigation Handler
**File**: `/app/game.tsx`

**Before**:
```typescript
const handleNavigate = (screen: string) => {
  if (screen === "levels") {
    router.back(); // Use back() to return to levels
  }
};
```

**After**:
```typescript
const handleNavigate = (screen: string) => {
  console.log("handleNavigate called with screen:", screen);
  if (screen === "levels") {
    router.back(); // Use back() to return to levels
  } else if (screen === "xpshop") {
    console.log("Navigating to XP Shop");
    router.push("/xpshop"); // Navigate to XP Shop
  } else {
    console.log("Unknown screen:", screen);
  }
};
```

### 2. Added Debugging to Button
**File**: `/app/components/game/inputWheel.tsx`

```typescript
<ThemedButton
  variant="primary"
  title="Go to Shop"
  style={styles.hintModalButton}
  onPress={() => {
    console.log("Go to Shop button pressed");
    console.log("onNavigate function:", onNavigate);
    setPurchaseHintModal(false);
    // Add slight delay to ensure modal closes before navigation
    setTimeout(() => {
      if (onNavigate) {
        console.log("Calling onNavigate with 'xpshop'");
        onNavigate('xpshop');
      } else {
        console.log("onNavigate function not available");
      }
    }, 100);
  }}
/>
```

## Expected Console Output When Working
```
Go to Shop button pressed
onNavigate function: [Function]
Calling onNavigate with 'xpshop'
handleNavigate called with screen: xpshop
Navigating to XP Shop
```

## Navigation Flow Verification
1. **Game Screen** → User runs out of hints → Clicks hint button
2. **Purchase Modal** → "No Hints Available" modal appears
3. **Go to Shop Button** → Clicked → Console logs appear
4. **Navigation** → App navigates to `/xpshop` route
5. **XP Shop Screen** → User can purchase hint packs

## Routes Verified
- ✅ `/game` - GameRoute exists
- ✅ `/xpshop` - XPShop route exists  
- ✅ Navigation handler supports both routes

## Testing Steps
1. Start a level with 0 hints
2. Click the hint button (lightbulb icon)
3. Modal should appear: "No Hints Available"
4. Click "Go to Shop" button
5. Check console for debug logs
6. Verify navigation to XP Shop screen

The navigation should now work correctly with proper route handling for the XP Shop.