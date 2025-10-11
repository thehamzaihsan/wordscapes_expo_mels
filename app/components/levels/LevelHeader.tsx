import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface LevelHeaderProps {
  displayName: string;
  guestMeta: any;
  onBackPress: () => void;
  onShopPress: () => void;
  onProfilePress: () => void;
  onNavigate: (screen: string) => void;
}

const LevelHeader: React.FC<LevelHeaderProps> = ({
  displayName,
  guestMeta,
  onBackPress,
  onShopPress,
  onProfilePress,
  onNavigate,
}) => {
  const { derivePlayerLevel } = require('@/hooks/guest-progress');
  
  return (
    <View style={styles.header}>
      {/* Top Row: Back Button on left, Resources and Avatar on right */}
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <ChevronLeft size={20} color="white" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.resourcesContainer}>
          <TouchableOpacity
            style={styles.resourceItem}
            onPress={onShopPress}
            activeOpacity={0.7}
          >
            <Text style={styles.resourceIcon}>💎</Text>
            <Text style={styles.resourceText}>{guestMeta?.gems ?? 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceItem}
            onPress={onShopPress}
            activeOpacity={0.7}
          >
            <Text style={styles.resourceIcon}>⚡</Text>
            <Text
              style={[
                styles.resourceText,
                {
                  color:
                    (guestMeta?.energy ?? 0) > 50 ? "#10B981" : "#EF4444",
                },
              ]}
            >
              {guestMeta?.energy ?? 0}/100
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onProfilePress}
            style={styles.avatarButton}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarIcon}>{guestMeta?.avatar || "🧩"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Player Info */}
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{displayName}</Text>
        <Text style={styles.levelText}>Level {guestMeta?.playerLevel ?? 0}</Text>
        
        {/* XP Progress Bar */}
        {(() => {
          const xp = guestMeta?.xp ?? 0;
          const derived = derivePlayerLevel(xp);
          const within = derived.levelXp;
          const needed = derived.nextLevelXp;
          const pct = Math.min(100, Math.max(0, (within / needed) * 100));
          
          // Check next category unlock
          const { getCategoryOrder, getUnlockedCategories, xpNeededToUnlockCategory } = require('@/hooks/guest-progress');
          const categoryOrder = getCategoryOrder();
          const unlockedCategories = getUnlockedCategories(guestMeta?.playerLevel || 0);
          const nextCategoryIndex = unlockedCategories.length;
          const nextCategory = categoryOrder[nextCategoryIndex];
          const nextCategoryXP = nextCategory ? xpNeededToUnlockCategory(nextCategoryIndex) : 0;
          const nextCategoryRemaining = Math.max(0, nextCategoryXP - xp);
          
          return (
            <>
              <View style={styles.xpLabelContainer}>
                <Text style={styles.xpLabel}>
                  {within}/{needed} XP (Total {xp})
                </Text>
                <TouchableOpacity 
                  style={styles.buyXpButton}
                  onPress={() => onNavigate('xpshop')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buyXpText}>⚡ Buy XP</Text>
                </TouchableOpacity>
              </View>
              {nextCategory && nextCategoryRemaining > 0 && (
                <Text style={styles.nextUnlockText}>
                  {nextCategoryRemaining} XP to unlock {nextCategory}
                </Text>
              )}
              <View style={styles.xpBarContainer}>
                <View style={styles.xpBarBackground}>
                  <View style={[styles.xpBar, { width: `${pct}%` }]} />
                </View>
              </View>
            </>
          );
        })()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "rgba(31,41,55,0.85)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#374151",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    paddingEnd: 16,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resourcesContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  resourceIcon: {
    fontSize: 16,
  },
  resourceText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  avatarIcon: {
    fontSize: 20,
  },
  playerInfo: {
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  playerName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  levelText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
  },
  xpLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  xpLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "left",
    flex: 1,
  },
  buyXpButton: {
    backgroundColor: "rgba(139,92,246,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.4)",
  },
  buyXpText: {
    color: "#8B5CF6",
    fontSize: 10,
    fontWeight: "600",
  },
  nextUnlockText: {
    color: "#8B5CF6",
    fontSize: 10,
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 4,
  },
  nextUnlockText: {
    color: "#8B5CF6",
    fontSize: 10,
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 4,
  },
  xpBarContainer: {
    alignItems: "center",
    width: "100%",
  },
  xpBarBackground: {
    width: "85%",
    height: 10,
    backgroundColor: "rgba(55,65,81,0.85)",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(75,85,99,0.3)",
  },
  xpBar: {
    height: "100%",
    backgroundColor: "rgba(139,92,246,0.8)",
    borderRadius: 5,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});

export default LevelHeader;