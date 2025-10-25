// This is a backup of the original XPShopScreen.tsx before fixing
// The issue was that TouchableOpacity containers had onPress handlers
// but the ThemedButton inside them didn't have onPress handlers
// causing the purchase functions to not be called properly