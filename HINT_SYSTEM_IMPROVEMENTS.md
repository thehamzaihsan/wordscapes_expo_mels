# Hint System Improvements

## Overview
Implemented a comprehensive hint system with global hints, visual indicators, purchase system, and debug tools. The new system allows hints to be used across multiple levels and provides a better user experience.

## Features Implemented

### 1. ✅ Global Hint System
**Replaced per-level hints with global hints that persist across all levels:**

- **Global Storage**: Hints stored in `progress.meta.hints`
- **Cross-Level Usage**: Hints can be used on any level, not just one per level
- **Persistent**: Hints remain available until used, regardless of level switches

### 2. ✅ Visual Dot Indicator on Hint Button
**Added red notification dot showing number of available hints:**

```typescript
{hintsLeft > 0 && (
  <View style={styles.hintDot}>
    <Text style={styles.hintDotText}>{hintsLeft}</Text>
  </View>
)}
```

**Features:**
- **Red Badge**: Positioned on top-right of hint button
- **Count Display**: Shows exact number of hints available
- **Visibility**: Only appears when hints > 0

### 3. ✅ Purchase Hint Modal
**Modal appears when no hints are available and hint button is pressed:**

```typescript
<Modal visible={purchaseHintModal}>
  <ThemedCard>
    <ThemedText>No Hints Available</ThemedText>
    <ThemedText>
      Purchase hint packs from the XP Shop to continue getting help
    </ThemedText>
    <ThemedButton title="Go to Shop" onPress={navigateToShop} />
    <ThemedButton title="Cancel" onPress={closeModal} />
  </ThemedCard>
</Modal>
```

**Features:**
- **Informative**: Explains why hints aren't available
- **Action-Oriented**: Direct link to XP Shop
- **Dismissible**: Cancel option to continue without hints

### 4. ✅ Hint Packages in XP Shop
**Added hint purchasing system with multiple package options:**

```typescript
const hintPackages = [
  { id: 1, hints: 5, gems: 10, popular: false, badge: null },
  { id: 2, hints: 15, gems: 25, popular: true, badge: "POPULAR" },
  { id: 3, hints: 30, gems: 45, popular: false, badge: "BEST VALUE" }
];
```

**Features:**
- **Multiple Tiers**: 5, 15, and 30 hint packages
- **Competitive Pricing**: Bulk discounts for larger packages
- **Visual Badges**: "POPULAR" and "BEST VALUE" indicators
- **Gem Integration**: Uses existing gem currency

### 5. ✅ Hints Display in XP Shop
**Added hints to resource display alongside gems and energy:**

```typescript
<View style={styles.hintsDisplay}>
  <Lightbulb size={20} color={theme.colors.warning} />
  <ThemedText variant="heading3" weight="bold" color="warning">
    {progress?.meta.hints || 0}
  </ThemedText>
  <ThemedText variant="caption" color="textSecondary">
    hints
  </ThemedText>
</View>
```

**Features:**
- **Visual Consistency**: Matches gems and energy display
- **Real-Time Updates**: Shows current hint count
- **Lightbulb Icon**: Clear visual association

### 6. ✅ Debug Menu Hint Controls
**Added hint management to debug panel for testing:**

```typescript
// Debug controls for hints
<ThemedButton title="-1" onPress={() => updateResource('hints', -1)} />
<ThemedButton title="-5" onPress={() => updateResource('hints', -5)} />
<ThemedButton title="+5" onPress={() => updateResource('hints', 5)} />
<ThemedButton title="+20" onPress={() => updateResource('hints', 20)} />
```

**Features:**
- **Fine Control**: Add/remove individual hints
- **Bulk Operations**: Add/remove multiple hints
- **Testing Support**: Easy testing of hint functionality
- **Resource Integration**: Uses existing debug resource system

## Technical Implementation

### Game Logic Changes
```typescript
// Global hint state management
const [globalHints, setGlobalHints] = useState(0);

// Load hints from guest progress
useEffect(() => {
  const loadHints = async () => {
    const progress = await loadGuestProgress();
    setGlobalHints(progress?.meta.hints || 0);
  };
  loadHints();
}, []);

// Updated hint handler
const handleWordHint = useCallback(async (hintedWord: string): Promise<boolean> => {
  if (globalHints > 0) {
    // Deduct hint and update progress
    const progress = await loadGuestProgress();
    progress.meta.hints = (progress.meta.hints || 0) - 1;
    await saveGuestProgress(progress);
    setGlobalHints(progress.meta.hints);
    return true;
  }
  return false; // Triggers purchase modal
}, [globalHints]);
```

### UI Component Updates
```typescript
// LetterWheel hint button with dot indicator
<TouchableOpacity style={styles.hintButton} onPress={handleHint}>
  <Lightbulb size={24} color="#ffffff" />
  {hintsLeft > 0 && (
    <View style={styles.hintDot}>
      <Text style={styles.hintDotText}>{hintsLeft}</Text>
    </View>
  )}
</TouchableOpacity>

// Updated hint handler
const handleHint = useCallback(async (): Promise<void> => {
  if (hintsLeft <= 0) {
    setPurchaseHintModal(true); // Show purchase modal
    return;
  }
  // Normal hint logic...
}, [hintsLeft]);
```

### XP Shop Integration
```typescript
// Hint purchase function
const handlePurchaseHints = (hintsAmount: number, gemsCost: number) => {
  if (progress.meta.gems < gemsCost) {
    showPurchaseModal({ type: 'error', title: 'Insufficient Gems' });
    return;
  }
  
  showPurchaseModal({
    type: 'xp',
    title: 'Purchase Hints',
    message: `Purchase ${hintsAmount} hints for ${gemsCost} gems?`,
    onConfirm: () => confirmPurchaseHints(hintsAmount, gemsCost)
  });
};

const confirmPurchaseHints = async (hintsAmount: number, gemsCost: number) => {
  const updatedProgress = {
    ...progress,
    meta: {
      ...progress.meta,
      gems: progress.meta.gems - gemsCost,
      hints: (progress.meta.hints || 0) + hintsAmount
    }
  };
  
  await saveGuestProgress(updatedProgress);
  setProgress(updatedProgress);
  showToast(`Purchased ${hintsAmount} hints!`, "success");
};
```

## User Experience Flow

### 1. Using Hints (Happy Path)
1. **Player has hints** → Dot indicator shows on hint button
2. **Player clicks hint** → Random unfound word revealed
3. **Hint count decreases** → Visual indicator updates
4. **Player continues** → Can use more hints on same or different levels

### 2. No Hints Available
1. **Player has no hints** → No dot indicator on hint button
2. **Player clicks hint** → Purchase modal appears
3. **Player chooses "Go to Shop"** → Navigates to XP Shop
4. **Player purchases hints** → Returns to game with hints available

### 3. Hint Shopping Experience
1. **Player opens XP Shop** → Sees current hint count in header
2. **Player views hint packages** → Three tiers with clear pricing
3. **Player selects package** → Confirmation modal with details
4. **Purchase completes** → Instant hint availability

### 4. Multi-Level Hint Usage
1. **Player buys 15 hints** → Available across all levels
2. **Uses 3 hints on Level A** → 12 hints remain
3. **Switches to Level B** → Still has 12 hints available
4. **Uses 5 more hints** → 7 hints remain for future use

## Benefits

### ✅ **Improved User Experience**
- **Visual Clarity**: Dot indicator shows hint availability at a glance
- **Seamless Flow**: Clear path from no hints → purchase → usage
- **Cross-Level Value**: Hints work on any level, increasing perceived value

### ✅ **Monetization Enhancement**
- **Clear Value Proposition**: Bulk packages offer better value
- **Friction Reduction**: Easy purchase flow when hints needed
- **Repeat Purchases**: Hints consumed across multiple levels

### ✅ **Developer Benefits**
- **Debug Tools**: Easy testing and management of hint system
- **Flexible Pricing**: Multiple package tiers for different user types
- **Analytics Ready**: Clear purchase and usage tracking points

### ✅ **Technical Robustness**
- **Persistent Storage**: Hints survive app restarts and level switches
- **Error Handling**: Graceful degradation when purchase fails
- **State Consistency**: Real-time updates across all components

## Package Pricing Strategy

| Package | Hints | Gems Cost | Gems per Hint | Value |
|---------|-------|-----------|---------------|--------|
| Small   | 5     | 10        | 2.0           | Basic  |
| Popular | 15    | 25        | 1.67          | 17% off |
| Best    | 30    | 45        | 1.5           | 25% off |

**Pricing Logic:**
- **Entry Level**: Low commitment for first-time buyers
- **Popular Tier**: Sweet spot for regular players
- **Value Tier**: Best deal for heavy hint users

## Future Enhancements

### Potential Improvements
1. **Daily Free Hint**: One free hint per day
2. **Hint Refill**: Energy-style regeneration system
3. **Targeted Hints**: Specific word length or difficulty hints
4. **Hint Streaks**: Bonus hints for consecutive daily play
5. **Social Hints**: Share/request hints from friends

### Analytics Opportunities
1. **Usage Patterns**: Which levels need hints most
2. **Purchase Behavior**: Most popular package sizes
3. **Retention Impact**: Do hints improve player retention
4. **Monetization**: Revenue per hint user vs non-hint users

The hint system now provides a complete, user-friendly experience that enhances gameplay while creating monetization opportunities through the XP Shop integration.