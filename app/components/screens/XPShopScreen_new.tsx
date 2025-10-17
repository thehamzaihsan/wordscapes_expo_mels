import economy from "@/constants/economy.json";
import {
  derivePlayerLevel,
  loadGuestProgress,
  saveGuestProgress,
  triggerEnergyRegenCheck,
  type GuestProgressPayload,
} from "@/hooks/guest-progress";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { clampEnergy } from "@/lib/energy";
import { showToast } from "@/lib/toast";
import { ChevronLeft, Gem, Zap, Battery } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";
import ThemedModal from "../ui/ThemedModal";

interface XPShopScreenProps {
  onNavigate: (screen: string) => void;
  fromScreen?: string;
}

interface PurchaseModalData {
  type: 'xp' | 'energy' | 'error';
  title: string;
  message: string;
  amount?: number;
  cost?: number;
  onConfirm?: () => void;
}

const XPShopScreen: React.FC<XPShopScreenProps> = ({ onNavigate, fromScreen = "levels" }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [progress, setProgress] = useState<GuestProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<PurchaseModalData | null>(null);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const gp = await triggerEnergyRegenCheck() || await loadGuestProgress();
      setProgress(gp);
    } catch (error) {
      console.error("Failed to load progress:", error);
      showToast("Failed to load progress", "error");
    } finally {
      setLoading(false);
    }
  };

  const showPurchaseModal = (data: PurchaseModalData) => {
    setModalData(data);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setModalData(null);
  };

  const handlePurchaseXP = async (xpAmount: number, gemsCost: number) => {
    if (!progress) return;
    
    if (progress.meta.gems < gemsCost) {
      showPurchaseModal({
        type: 'error',
        title: 'Insufficient Gems',
        message: `You need ${gemsCost} gems to purchase ${xpAmount} XP. You currently have ${progress.meta.gems} gems.`,
      });
      return;
    }

    showPurchaseModal({
      type: 'xp',
      title: 'Purchase XP',
      message: `Purchase ${xpAmount} XP for ${gemsCost} gems?`,
      amount: xpAmount,
      cost: gemsCost,
      onConfirm: () => confirmPurchaseXP(xpAmount, gemsCost),
    });
  };

  const confirmPurchaseXP = async (xpAmount: number, gemsCost: number) => {
    if (!progress) return;
    
    setPurchasing(true);
    hideModal();
    
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
  };

  const handlePurchaseEnergy = async (energyAmount: number, gemsCost: number) => {
    if (!progress) return;
    
    if (progress.meta.gems < gemsCost) {
      showPurchaseModal({
        type: 'error',
        title: 'Insufficient Gems',
        message: `You need ${gemsCost} gems to purchase ${energyAmount} energy. You currently have ${progress.meta.gems} gems.`,
      });
      return;
    }

    const currentEnergy = progress.meta.energy;
    const maxEnergy = economy.energy.refillMax;
    
    if (currentEnergy >= maxEnergy) {
      showPurchaseModal({
        type: 'error',
        title: 'Energy Full',
        message: `Your energy is already at maximum (${maxEnergy}/${maxEnergy}).`,
      });
      return;
    }

    showPurchaseModal({
      type: 'energy',
      title: 'Purchase Energy',
      message: `Purchase ${energyAmount} energy for ${gemsCost} gems?`,
      amount: energyAmount,
      cost: gemsCost,
      onConfirm: () => confirmPurchaseEnergy(energyAmount, gemsCost),
    });
  };

  const confirmPurchaseEnergy = async (energyAmount: number, gemsCost: number) => {
    if (!progress) return;
    
    setPurchasing(true);
    hideModal();
    
    try {
      const updatedProgress = {
        ...progress,
        meta: {
          ...progress.meta,
          gems: progress.meta.gems - gemsCost,
          energy: clampEnergy(progress.meta.energy + energyAmount),
          lastEnergyUpdate: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };

      await saveGuestProgress(updatedProgress);
      setProgress(updatedProgress);
      
      showToast(`Purchased ${energyAmount} energy!`, "success");
    } catch (error) {
      console.error("Purchase failed:", error);
      showToast("Purchase failed", "error");
    } finally {
      setPurchasing(false);
    }
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
        gems: Math.floor(baseGems * 2.5),
        popular: true,
        badge: "POPULAR",
      },
    ];
  };

  const getEnergyPackages = () => {
    const refillCost = economy.gems.usedFor.energyRefill;
    const refillAmount = economy.energy.refillMax;
    
    return [
      {
        id: 1,
        energy: Math.floor(refillAmount * 0.25),
        gems: refillCost,
        popular: false,
        badge: null,
      },
      {
        id: 2,
        energy: Math.floor(refillAmount * 0.5),
        gems: Math.floor(refillCost * 1.8),
        popular: true,
        badge: "POPULAR",
      },
    ];
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ThemedText variant="body1" color="primary" weight="semibold">
            Loading Shop...
          </ThemedText>
        </View>
      </View>
    );
  }

  const xpPackages = getXPPackages();
  const energyPackages = getEnergyPackages();

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
        
        <ThemedButton
          title="Back"
          variant="glass"
          size="sm"
          leftIcon={<ChevronLeft size={20} color={theme.colors.text} />}
          onPress={() => onNavigate(fromScreen)}
          style={styles.backButton}
        />

        <ThemedCard variant="glassStrong" padding="lg" style={styles.headerCard}>
          <View style={styles.headerTitle}>
            <Zap size={24} color={theme.colors.primary} />
            <ThemedText variant="heading2" weight="bold" align="center" style={styles.title}>
              Power Shop
            </ThemedText>
          </View>
          <ThemedText variant="body2" align="center" color="textSecondary" style={styles.subtitle}>
            Purchase XP and Energy to boost your progress
          </ThemedText>
          
          <View style={styles.resourcesDisplay}>
            <View style={styles.gemsDisplay}>
              <Gem size={20} color={theme.colors.warning} />
              <ThemedText variant="heading3" weight="bold" color="warning" style={styles.gemsText}>
                {progress?.meta.gems || 0}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                gems
              </ThemedText>
            </View>
            <View style={styles.energyDisplay}>
              <Battery size={20} color={theme.colors.success} />
              <ThemedText variant="heading3" weight="bold" color="success" style={styles.energyText}>
                {progress?.meta.energy || 0}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                / {economy.energy.refillMax} energy
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" align="center" style={styles.sectionTitle}>
            XP Packages
          </ThemedText>
          <ThemedText variant="body2" color="textSecondary" align="center" style={styles.sectionSubtitle}>
            Skip the grind and boost your progress instantly!
          </ThemedText>
          
          <View style={styles.packagesGrid}>
            {xpPackages.map((pkg) => (
              <View
                key={pkg.id}
                style={[
                  styles.packageCard,
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                  pkg.popular && { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` }
                ]}
              >
                {pkg.badge && (
                  <View style={[
                    styles.packageBadge,
                    { backgroundColor: pkg.popular ? theme.colors.primary : theme.colors.warning }
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
                  onPress={() => handlePurchaseXP(pkg.xp, pkg.gems)}
                  style={styles.purchaseButton}
                />
              </View>
            ))}
          </View>
        </ThemedCard>

        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" align="center" style={styles.sectionTitle}>
            Energy Packages
          </ThemedText>
          <ThemedText variant="body2" color="textSecondary" align="center" style={styles.sectionSubtitle}>
            Refuel your energy to keep playing without waiting!
          </ThemedText>
          
          <View style={styles.packagesGrid}>
            {energyPackages.map((pkg) => (
              <View
                key={pkg.id}
                style={[
                  styles.packageCard,
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                  pkg.popular && { borderColor: theme.colors.success, backgroundColor: `${theme.colors.success}10` }
                ]}
              >
                {pkg.badge && (
                  <View style={[
                    styles.packageBadge,
                    { backgroundColor: pkg.popular ? theme.colors.success : theme.colors.info }
                  ]}>
                    <ThemedText variant="caption" weight="bold" color="textInverse" style={styles.badgeText}>
                      {pkg.badge}
                    </ThemedText>
                  </View>
                )}
                
                <ThemedText variant="heading2" weight="bold" style={styles.packageXP}>
                  +{pkg.energy}
                </ThemedText>
                <ThemedText variant="body2" color="textSecondary" weight="semibold" style={styles.packageXPLabel}>
                  Energy
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
                  title={
                    (progress?.meta.energy || 0) >= economy.energy.refillMax 
                      ? "Energy Full" 
                      : (progress?.meta.gems || 0) < pkg.gems 
                        ? "Not enough gems" 
                        : "Purchase"
                  }
                  variant={(progress?.meta.gems || 0) >= pkg.gems && (progress?.meta.energy || 0) < economy.energy.refillMax ? "primary" : "ghost"}
                  size="sm"
                  fullWidth
                  disabled={purchasing || (progress?.meta.gems || 0) < pkg.gems || (progress?.meta.energy || 0) >= economy.energy.refillMax}
                  onPress={() => handlePurchaseEnergy(pkg.energy, pkg.gems)}
                  style={styles.purchaseButton}
                />
              </View>
            ))}
          </View>
        </ThemedCard>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Custom Purchase Confirmation Modal */}
      <ThemedModal
        isVisible={modalVisible}
        onClose={hideModal}
        title={modalData?.title}
        size="small"
        backdrop="blur"
        closeOnBackdropPress={true}
        showCloseButton={false}
      >
        <View style={styles.modalContent}>
          <ThemedText variant="body1" align="center" style={styles.modalMessage}>
            {modalData?.message}
          </ThemedText>
          
          {modalData?.type !== 'error' && modalData?.amount && modalData?.cost && (
            <View style={styles.modalSummary}>
              <View style={styles.modalSummaryRow}>
                <ThemedText variant="body2" color="textSecondary">
                  {modalData.type === 'xp' ? 'XP Amount:' : 'Energy Amount:'}
                </ThemedText>
                <ThemedText variant="body2" weight="semibold" color="primary">
                  +{modalData.amount}
                </ThemedText>
              </View>
              <View style={styles.modalSummaryRow}>
                <ThemedText variant="body2" color="textSecondary">
                  Cost:
                </ThemedText>
                <View style={styles.modalCostRow}>
                  <ThemedText variant="body2" weight="semibold" color="warning">
                    {modalData.cost}
                  </ThemedText>
                  <Gem size={14} color={theme.colors.warning} />
                </View>
              </View>
            </View>
          )}
          
          <View style={styles.modalButtons}>
            {modalData?.type === 'error' ? (
              <ThemedButton
                title="OK"
                variant="primary"
                size="md"
                fullWidth
                onPress={hideModal}
              />
            ) : (
              <>
                <ThemedButton
                  title="Cancel"
                  variant="ghost"
                  size="md"
                  onPress={hideModal}
                  style={styles.cancelButton}
                />
                <ThemedButton
                  title="Purchase"
                  variant="primary"
                  size="md"
                  onPress={modalData?.onConfirm || hideModal}
                  disabled={purchasing}
                  isLoading={purchasing}
                  style={styles.confirmButton}
                />
              </>
            )}
          </View>
        </View>
      </ThemedModal>
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
  resourcesDisplay: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  gemsDisplay: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: theme.spacing.xs,
  },
  energyDisplay: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: theme.spacing.xs,
  },
  gemsText: {
    fontSize: 18,
  },
  energyText: {
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
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
  // Modal styles
  modalContent: {
    alignItems: 'center' as const,
  },
  modalMessage: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  modalSummary: {
    width: '100%',
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.base,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
  },
  modalSummaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.xs,
  },
  modalCostRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    width: '100%',
    gap: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});

export default XPShopScreen;
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, {
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          paddingLeft: insets.left + theme.spacing.lg,
          paddingRight: insets.right + theme.spacing.lg,
        }]}
        showsVerticalScrollIndicator={false}
      >
        
        <ThemedButton
          title="Back"
          variant="glass"
          size="sm"
          leftIcon={<ChevronLeft size={20} color={theme.colors.text} />}
          onPress={() => onNavigate(fromScreen)}
          style={styles.backButton}
        />

        <ThemedCard variant="glassStrong" padding="lg" style={styles.headerCard}>
          <View style={styles.headerTitle}>
            <Zap size={24} color={theme.colors.primary} />
            <ThemedText variant="heading2" weight="bold" align="center" style={styles.title}>
              Power Shop
            </ThemedText>
          </View>
          <ThemedText variant="body2" align="center" color="textSecondary" style={styles.subtitle}>
            Purchase XP and Energy to boost your progress
          </ThemedText>
          
          <View style={styles.resourcesDisplay}>
            <View style={styles.gemsDisplay}>
              <Gem size={20} color={theme.colors.warning} />
              <ThemedText variant="heading3" weight="bold" color="warning" style={styles.gemsText}>
                {progress?.meta.gems || 0}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                gems
              </ThemedText>
            </View>
            <View style={styles.energyDisplay}>
              <Battery size={20} color={theme.colors.success} />
              <ThemedText variant="heading3" weight="bold" color="success" style={styles.energyText}>
                {progress?.meta.energy || 0}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                / {economy.energy.refillMax} energy
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" align="center" style={styles.sectionTitle}>
            XP Packages
          </ThemedText>
          <ThemedText variant="body2" color="textSecondary" align="center" style={styles.sectionSubtitle}>
            Skip the grind and boost your progress instantly!
          </ThemedText>
          
          <View style={styles.packagesGrid}>
            {xpPackages.map((pkg) => (
              <View
                key={pkg.id}
                style={[
                  styles.packageCard,
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                  pkg.popular && { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` }
                ]}
              >
                {pkg.badge && (
                  <View style={[
                    styles.packageBadge,
                    { backgroundColor: pkg.popular ? theme.colors.primary : theme.colors.warning }
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
                  onPress={() => handlePurchaseXP(pkg.xp, pkg.gems)}
                  style={styles.purchaseButton}
                />
              </View>
            ))}
          </View>
        </ThemedCard>

        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" align="center" style={styles.sectionTitle}>
            Energy Packages
          </ThemedText>
          <ThemedText variant="body2" color="textSecondary" align="center" style={styles.sectionSubtitle}>
            Refuel your energy to keep playing without waiting!
          </ThemedText>
          
          <View style={styles.packagesGrid}>
            {energyPackages.map((pkg) => (
              <View
                key={pkg.id}
                style={[
                  styles.packageCard,
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                  pkg.popular && { borderColor: theme.colors.success, backgroundColor: `${theme.colors.success}10` }
                ]}
              >
                {pkg.badge && (
                  <View style={[
                    styles.packageBadge,
                    { backgroundColor: pkg.popular ? theme.colors.success : theme.colors.info }
                  ]}>
                    <ThemedText variant="caption" weight="bold" color="textInverse" style={styles.badgeText}>
                      {pkg.badge}
                    </ThemedText>
                  </View>
                )}
                
                <ThemedText variant="heading2" weight="bold" style={styles.packageXP}>
                  +{pkg.energy}
                </ThemedText>
                <ThemedText variant="body2" color="textSecondary" weight="semibold" style={styles.packageXPLabel}>
                  Energy
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
                  title={
                    (progress?.meta.energy || 0) >= economy.energy.refillMax 
                      ? "Energy Full" 
                      : (progress?.meta.gems || 0) < pkg.gems 
                        ? "Not enough gems" 
                        : "Purchase"
                  }
                  variant={(progress?.meta.gems || 0) >= pkg.gems && (progress?.meta.energy || 0) < economy.energy.refillMax ? "primary" : "ghost"}
                  size="sm"
                  fullWidth
                  disabled={purchasing || (progress?.meta.gems || 0) < pkg.gems || (progress?.meta.energy || 0) >= economy.energy.refillMax}
                  onPress={() => handlePurchaseEnergy(pkg.energy, pkg.gems)}
                  style={styles.purchaseButton}
                />
              </View>
            ))}
          </View>
        </ThemedCard>

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
  resourcesDisplay: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  gemsDisplay: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: theme.spacing.xs,
  },
  energyDisplay: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: theme.spacing.xs,
  },
  gemsText: {
    fontSize: 18,
  },
  energyText: {
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
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
});

export default XPShopScreen;