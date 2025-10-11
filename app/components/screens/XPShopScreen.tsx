import economy from "@/constants/economy.json";
import {
  derivePlayerLevel,
  loadGuestProgress,
  saveGuestProgress,
  type GuestProgressPayload,
} from "@/hooks/guest-progress";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { showToast } from "@/lib/toast";
import { ChevronLeft, Gem, Zap } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";

interface XPShopScreenProps {
  onNavigate: (screen: string) => void;
  fromScreen?: string; // Track where user came from
}

const XPShopScreen: React.FC<XPShopScreenProps> = ({ onNavigate, fromScreen = "levels" }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
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
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ThemedText variant="body1" color="primary" weight="semibold">
            Loading XP Shop...
          </ThemedText>
        </View>
      </View>
    );
  }

  const levelProgress = getCurrentLevelProgress();
  const nextCategory = getNextCategoryInfo();
  const xpPackages = getXPPackages();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, {
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          paddingLeft: insets.left + theme.spacing.lg,
          paddingRight: insets.right + theme.spacing.lg,
        }]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Back Button */}
        <ThemedButton
          title="Back"
          variant="glass"
          size="sm"
          leftIcon={<ChevronLeft size={20} color={theme.colors.text} />}
          onPress={() => onNavigate(fromScreen)}
          style={styles.backButton}
        />

        {/* Header Card */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.headerCard}>
          <View style={styles.headerTitle}>
            <Zap size={24} color={theme.colors.primary} />
            <ThemedText variant="heading2" weight="bold" align="center" style={styles.title}>
              XP Shop
            </ThemedText>
          </View>
          <ThemedText variant="body2" align="center" color="textSecondary" style={styles.subtitle}>
            Purchase XP to level up faster and unlock new categories
          </ThemedText>
          
          {/* Player Gems */}
          <View style={styles.gemsDisplay}>
            <Gem size={20} color={theme.colors.warning} />
            <ThemedText variant="heading3" weight="bold" color="warning" style={styles.gemsText}>
              {progress?.meta.gems || 0}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              gems available
            </ThemedText>
          </View>
        </ThemedCard>

        {/* Current Progress Section */}
        {levelProgress && (
          <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
            <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
              Current Progress
            </ThemedText>
            
            <View style={styles.levelInfo}>
              <ThemedText variant="heading2" weight="bold" color="primary" style={styles.currentLevelText}>
                Level {levelProgress.currentLevel}
              </ThemedText>
              <ThemedText variant="body1" weight="semibold" color="textSecondary" style={styles.xpText}>
                {levelProgress.xpInLevel} / {levelProgress.xpNeeded} XP
              </ThemedText>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarBackground, { backgroundColor: theme.colors.border }]}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      backgroundColor: theme.colors.primary,
                      width: `${levelProgress.progressPercent}%` 
                    }
                  ]} 
                />
              </View>
              <ThemedText variant="caption" color="textSecondary" align="center" style={styles.progressText}>
                {Math.round(levelProgress.progressPercent)}% to next level
              </ThemedText>
            </View>
            
            <ThemedText variant="body2" color="textTertiary" align="center" style={styles.totalXpText}>
              Total XP: {levelProgress.totalXP}
            </ThemedText>
          </ThemedCard>
        )}

        {/* Next Category Unlock */}
        {nextCategory && (
          <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
            <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
              Next Unlock
            </ThemedText>
            
            <View style={styles.categoryInfo}>
              <ThemedText style={styles.categoryEmoji}>{nextCategory.emoji}</ThemedText>
              <View style={styles.categoryDetails}>
                <ThemedText variant="heading4" weight="bold" style={styles.categoryName}>
                  {nextCategory.name}
                </ThemedText>
                <ThemedText variant="body2" color="warning" weight="semibold" style={styles.categoryProgress}>
                  {nextCategory.remainingXP} XP needed
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarBackground, { backgroundColor: theme.colors.border }]}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      backgroundColor: theme.colors.warning,
                      width: `${nextCategory.progressPercent}%` 
                    }
                  ]} 
                />
              </View>
              <ThemedText variant="caption" color="textSecondary" align="center" style={styles.progressText}>
                {Math.round(nextCategory.progressPercent)}% complete
              </ThemedText>
            </View>
          </ThemedCard>
        )}

        {/* XP Packages */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" align="center" style={styles.sectionTitle}>
            XP Packages
          </ThemedText>
          <ThemedText variant="body2" color="textSecondary" align="center" style={styles.sectionSubtitle}>
            Skip the grind and boost your progress instantly!
          </ThemedText>
          
          <View style={styles.packagesGrid}>
            {xpPackages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageCard,
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                  pkg.popular && { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` }
                ]}
                onPress={() => handlePurchaseXP(pkg.xp, pkg.gems)}
                disabled={purchasing || (progress?.meta.gems || 0) < pkg.gems}
                activeOpacity={0.8}
              >
                {pkg.badge && (
                  <View style={[
                    styles.packageBadge,
                    pkg.popular 
                      ? { backgroundColor: theme.colors.primary }
                      : { backgroundColor: theme.colors.warning }
                  ]}>
                    <ThemedText variant="caption" weight="bold" color="textInverse" style={styles.badgeText}>
                      {pkg.badge}
                    </ThemedText>
                  </View>
                )}
                
                <ThemedText variant="heading2" weight="bold" style={styles.packageXP}>
                  +{pkg.xp}
                </ThemedText>
                <ThemedText variant="body2" color="textSecondary" weight="semibold" style={styles.packageXPLabel}>
                  XP
                </ThemedText>
                
                <View style={styles.packageCost}>
                  <ThemedText variant="heading4" weight="bold" color="warning" style={styles.packageGems}>
                    {pkg.gems}
                  </ThemedText>
                  <Gem size={16} color={theme.colors.warning} />
                  <ThemedText variant="caption" color="textSecondary" style={styles.packageGemsLabel}>
                    Gems
                  </ThemedText>
                </View>
                
                <ThemedButton
                  title={(progress?.meta.gems || 0) < pkg.gems ? "Not enough gems" : "Purchase"}
                  variant={(progress?.meta.gems || 0) >= pkg.gems ? "primary" : "ghost"}
                  size="sm"
                  fullWidth
                  disabled={purchasing || (progress?.meta.gems || 0) < pkg.gems}
                  style={styles.purchaseButton}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ThemedCard>

        {/* Info Section */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
            💡 Why Buy XP?
          </ThemedText>
          <View style={styles.benefitsList}>
            <ThemedText variant="body2" color="textSecondary" style={styles.benefitText}>
              • Unlock new categories faster
            </ThemedText>
            <ThemedText variant="body2" color="textSecondary" style={styles.benefitText}>
              • Progress through player levels
            </ThemedText>
            <ThemedText variant="body2" color="textSecondary" style={styles.benefitText}>
              • Access exclusive content sooner
            </ThemedText>
            <ThemedText variant="body2" color="textSecondary" style={styles.benefitText}>
              • Skip the level grinding
            </ThemedText>
          </View>
        </ThemedCard>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => ({
  container: {
    flex: 1,
    position: 'relative' as const,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start' as const,
  },
  backButton: {
    alignSelf: 'flex-start' as const,
    marginBottom: theme.spacing.lg,
  },
  headerCard: {
    marginBottom: theme.spacing.lg,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  headerTitle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: theme.spacing.xs,
  },
  title: {
    marginLeft: theme.spacing.sm,
  },
  subtitle: {
    lineHeight: 18,
    marginBottom: theme.spacing.base,
  },
  gemsDisplay: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  gemsText: {
    fontSize: 18,
  },
  card: {
    marginBottom: theme.spacing.lg,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sectionTitle: {
    marginBottom: theme.spacing.base,
  },
  sectionSubtitle: {
    marginBottom: theme.spacing.lg,
  },
  levelInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.sm,
  },
  currentLevelText: {
    fontSize: 20,
  },
  xpText: {
    fontSize: 16,
  },
  progressBarContainer: {
    marginBottom: theme.spacing.xs,
  },
  progressBarBackground: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden' as const,
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
  },
  totalXpText: {
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  categoryInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
  },
  categoryProgress: {
    fontSize: 14,
  },
  packagesGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: theme.spacing.sm,
    justifyContent: 'space-between' as const,
  },
  packageCard: {
    width: '48%',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.base,
    borderWidth: 2,
    alignItems: 'center' as const,
    position: 'relative' as const,
  },
  packageBadge: {
    position: 'absolute' as const,
    top: -8,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: 10,
  },
  packageXP: {
    fontSize: 24,
    marginTop: theme.spacing.xs,
  },
  packageXPLabel: {
    fontSize: 14,
    marginBottom: theme.spacing.sm,
  },
  packageCost: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: theme.spacing.sm,
  },
  packageGems: {
    fontSize: 18,
  },
  packageGemsLabel: {
    fontSize: 12,
  },
  purchaseButton: {
    marginTop: theme.spacing.xs,
  },
  benefitsList: {
    gap: theme.spacing.xs,
  },
  benefitText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
});

export default XPShopScreen;