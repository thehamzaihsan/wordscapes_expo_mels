import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import { ChevronLeft } from "lucide-react-native";
import economy from "@/constants/economy.json";
import {
  loadGuestProgress,
  saveGuestProgress,
  derivePlayerLevel,
  type GuestProgressPayload,
} from "@/hooks/guest-progress";
import { showToast } from "@/lib/toast";

interface XPShopScreenProps {
  onNavigate: (screen: string) => void;
  fromScreen?: string; // Track where user came from
}

const XPShopScreen: React.FC<XPShopScreenProps> = ({ onNavigate, fromScreen = "levels" }) => {
  const [progress, setProgress] = useState<GuestProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const gp = await loadGuestProgress();
      setProgress(gp);
    } catch (error) {
      console.error("Failed to load progress:", error);
      showToast("Failed to load progress", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseXP = async (xpAmount: number, gemsCost: number) => {
    if (!progress) return;
    
    if (progress.meta.gems < gemsCost) {
      Alert.alert(
        "Insufficient Gems",
        `You need ${gemsCost} gems to purchase ${xpAmount} XP. You currently have ${progress.meta.gems} gems.`,
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Purchase XP",
      `Purchase ${xpAmount} XP for ${gemsCost} gems?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Purchase",
          onPress: async () => {
            setPurchasing(true);
            try {
              const updatedProgress = {
                ...progress,
                meta: {
                  ...progress.meta,
                  gems: progress.meta.gems - gemsCost,
                  xp: progress.meta.xp + xpAmount,
                },
                updatedAt: new Date().toISOString(),
              };

              // Recalculate player level
              const derived = derivePlayerLevel(updatedProgress.meta.xp);
              updatedProgress.meta.playerLevel = derived.level;

              await saveGuestProgress(updatedProgress);
              setProgress(updatedProgress);
              
              showToast(`Purchased ${xpAmount} XP!`, "success");
            } catch (error) {
              console.error("Purchase failed:", error);
              showToast("Purchase failed", "error");
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  const getXPPackages = () => {
    const baseXP = economy.xp.buyRate.xp;
    const baseGems = economy.xp.buyRate.gems;
    
    return [
      {
        id: 1,
        xp: baseXP,
        gems: baseGems,
        popular: false,
        badge: null,
      },
      {
        id: 2,
        xp: baseXP * 3,
        gems: Math.floor(baseGems * 2.5), // 20% bonus
        popular: true,
        badge: "POPULAR",
      },
      {
        id: 3,
        xp: baseXP * 6,
        gems: Math.floor(baseGems * 4.5), // 25% bonus
        popular: false,
        badge: "BEST VALUE",
      },
      {
        id: 4,
        xp: baseXP * 10,
        gems: Math.floor(baseGems * 7), // 30% bonus
        popular: false,
        badge: "MEGA PACK",
      },
    ];
  };

  const getCurrentLevelProgress = () => {
    if (!progress) return null;
    
    const derived = derivePlayerLevel(progress.meta.xp);
    const progressPercent = (derived.levelXp / derived.nextLevelXp) * 100;
    
    return {
      currentLevel: derived.level,
      xpInLevel: derived.levelXp,
      xpNeeded: derived.nextLevelXp,
      progressPercent,
      totalXP: progress.meta.xp,
    };
  };

  const getNextCategoryInfo = () => {
    if (!progress) return null;
    
    const { getCategoryOrder, getUnlockedCategories, xpNeededToUnlockCategory } = require('@/hooks/guest-progress');
    const categoryOrder = getCategoryOrder();
    const unlockedCategories = getUnlockedCategories(progress.meta.playerLevel);
    const nextCategoryIndex = unlockedCategories.length;
    const nextCategory = categoryOrder[nextCategoryIndex];
    
    if (!nextCategory) return null;
    
    const requiredXP = xpNeededToUnlockCategory(nextCategoryIndex);
    const remainingXP = Math.max(0, requiredXP - progress.meta.xp);
    
    return {
      name: nextCategory,
      emoji: nextCategory === 'Ocean' ? '🌊' : nextCategory === 'Forest' ? '🌲' : '🎯',
      requiredXP,
      remainingXP,
      progressPercent: requiredXP > 0 ? (progress.meta.xp / requiredXP) * 100 : 100,
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading XP Shop...</Text>
      </View>
    );
  }

  const levelProgress = getCurrentLevelProgress();
  const nextCategory = getNextCategoryInfo();
  const xpPackages = getXPPackages();

  return (
    <View style={styles.container}>
      <BlurView intensity={50} tint="dark" style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onNavigate("levels")}
        >
          <ChevronLeft size={20} color="white" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>⚡ XP SHOP</Text>
          <Text style={styles.subtitle}>Boost Your Progress</Text>
          
          {/* Current Gems */}
          <View style={styles.gemsDisplay}>
            <Text style={styles.gemsIcon}>💎</Text>
            <Text style={styles.gemsText}>{progress?.meta.gems || 0}</Text>
          </View>
        </View>
      </BlurView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Current Progress Section */}
        {levelProgress && (
          <View style={styles.progressCard}>
            <Text style={styles.cardTitle}>Current Progress</Text>
            
            <View style={styles.levelInfo}>
              <Text style={styles.currentLevelText}>Level {levelProgress.currentLevel}</Text>
              <Text style={styles.xpText}>
                {levelProgress.xpInLevel} / {levelProgress.xpNeeded} XP
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[styles.progressBar, { width: `${levelProgress.progressPercent}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(levelProgress.progressPercent)}% to next level
              </Text>
            </View>
            
            <Text style={styles.totalXpText}>Total XP: {levelProgress.totalXP}</Text>
          </View>
        )}

        {/* Next Category Unlock */}
        {nextCategory && (
          <View style={styles.categoryCard}>
            <Text style={styles.cardTitle}>Next Unlock</Text>
            
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryEmoji}>{nextCategory.emoji}</Text>
              <View style={styles.categoryDetails}>
                <Text style={styles.categoryName}>{nextCategory.name}</Text>
                <Text style={styles.categoryProgress}>
                  {nextCategory.remainingXP} XP needed
                </Text>
              </View>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[styles.progressBar, { width: `${nextCategory.progressPercent}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(nextCategory.progressPercent)}% complete
              </Text>
            </View>
          </View>
        )}

        {/* XP Packages */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>XP Packages</Text>
          <Text style={styles.sectionSubtitle}>
            Skip the grind and boost your progress instantly!
          </Text>
          
          <View style={styles.packagesGrid}>
            {xpPackages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageCard,
                  pkg.popular && styles.popularPackage,
                ]}
                onPress={() => handlePurchaseXP(pkg.xp, pkg.gems)}
                disabled={purchasing || (progress?.meta.gems || 0) < pkg.gems}
                activeOpacity={0.8}
              >
                {pkg.badge && (
                  <View style={[
                    styles.packageBadge,
                    pkg.popular && styles.popularBadge,
                  ]}>
                    <Text style={styles.badgeText}>{pkg.badge}</Text>
                  </View>
                )}
                
                <Text style={styles.packageXP}>+{pkg.xp}</Text>
                <Text style={styles.packageXPLabel}>XP</Text>
                
                <View style={styles.packageCost}>
                  <Text style={styles.packageGems}>{pkg.gems}</Text>
                  <Text style={styles.packageGemsIcon}>💎</Text>
                </View>
                
                <View style={[
                  styles.purchaseButton,
                  (progress?.meta.gems || 0) < pkg.gems && styles.disabledButton,
                ]}>
                  <Text style={[
                    styles.purchaseButtonText,
                    (progress?.meta.gems || 0) < pkg.gems && styles.disabledButtonText,
                  ]}>
                    {(progress?.meta.gems || 0) < pkg.gems ? "Not enough gems" : "Purchase"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>💡 Why Buy XP?</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitText}>• Unlock new categories faster</Text>
            <Text style={styles.benefitText}>• Progress through player levels</Text>
            <Text style={styles.benefitText}>• Access exclusive content sooner</Text>
            <Text style={styles.benefitText}>• Skip the level grinding</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121213",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121213",
  },
  loadingText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    alignSelf: "flex-start",
    paddingEnd: 16,
    marginBottom: 16,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  headerContent: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  gemsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(31,41,55,0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginTop: 8,
  },
  gemsIcon: {
    fontSize: 18,
  },
  gemsText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  progressCard: {
    backgroundColor: "rgba(31,41,55,0.8)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  levelInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  currentLevelText: {
    color: "#8B5CF6",
    fontSize: 20,
    fontWeight: "bold",
  },
  xpText: {
    color: "#D1D5DB",
    fontSize: 16,
    fontWeight: "600",
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: "rgba(55,65,81,0.7)",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: 6,
  },
  progressText: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
  },
  totalXpText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  categoryCard: {
    backgroundColor: "rgba(31,41,55,0.8)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  categoryProgress: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "600",
  },
  packagesSection: {
    gap: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionSubtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  packagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  packageCard: {
    width: "48%",
    backgroundColor: "rgba(31,41,55,0.8)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#374151",
    alignItems: "center",
    position: "relative",
  },
  popularPackage: {
    borderColor: "#8B5CF6",
    backgroundColor: "rgba(139,92,246,0.1)",
  },
  packageBadge: {
    position: "absolute",
    top: -8,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularBadge: {
    backgroundColor: "#8B5CF6",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  packageXP: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  packageXPLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  packageCost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  packageGems: {
    color: "#F59E0B",
    fontSize: 18,
    fontWeight: "bold",
  },
  packageGemsIcon: {
    fontSize: 16,
  },
  purchaseButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#6B7280",
  },
  purchaseButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  disabledButtonText: {
    color: "#9CA3AF",
  },
  infoCard: {
    backgroundColor: "rgba(31,41,55,0.8)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  benefitsList: {
    gap: 8,
  },
  benefitText: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
  },
});

export default XPShopScreen;