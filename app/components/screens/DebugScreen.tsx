import economy from "@/constants/economy.json";
import {
  loadGuestProgress,
  saveGuestProgress,
  type GuestProgressPayload,
} from "@/hooks/guest-progress";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { clampEnergy } from "@/lib/energy";
import { showToast } from "@/lib/toast";
import { ChevronLeft, Gem, Zap, Battery, Plus, Minus, Bug } from "lucide-react-native";
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

interface DebugScreenProps {
  onNavigate: (screen: string) => void;
  fromScreen?: string;
}

const DebugScreen: React.FC<DebugScreenProps> = ({ onNavigate, fromScreen = "levels" }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [progress, setProgress] = useState<GuestProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  const updateResource = async (resource: 'gems' | 'energy' | 'xp', amount: number) => {
    if (!progress || updating) return;
    
    setUpdating(true);
    try {
      const updatedProgress = { ...progress };
      
      if (resource === 'gems') {
        updatedProgress.meta.gems = Math.max(0, progress.meta.gems + amount);
      } else if (resource === 'energy') {
        updatedProgress.meta.energy = clampEnergy(progress.meta.energy + amount);
      } else if (resource === 'xp') {
        updatedProgress.meta.xp = Math.max(0, progress.meta.xp + amount);
      }
      
      updatedProgress.updatedAt = new Date().toISOString();
      
      await saveGuestProgress(updatedProgress);
      setProgress(updatedProgress);
      
      const sign = amount > 0 ? '+' : '';
      showToast(`${sign}${amount} ${resource.toUpperCase()}`, amount > 0 ? "success" : "info");
    } catch (error) {
      console.error("Update failed:", error);
      showToast("Update failed", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ThemedText variant="body1" color="primary" weight="semibold">
            Loading Debug Panel...
          </ThemedText>
        </View>
      </View>
    );
  }

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
            <Bug size={24} color={theme.colors.error} />
            <ThemedText variant="heading2" weight="bold" align="center" style={styles.title}>
              Debug Panel
            </ThemedText>
          </View>
          <ThemedText variant="body2" align="center" color="textSecondary" style={styles.subtitle}>
            Developer tools for testing and debugging
          </ThemedText>
        </ThemedCard>

        {/* Current Resources */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
            Current Resources
          </ThemedText>
          
          <View style={styles.resourcesDisplay}>
            <View style={styles.resourceRow}>
              <Gem size={20} color={theme.colors.warning} />
              <ThemedText variant="heading3" weight="bold" color="warning" style={styles.resourceValue}>
                {progress?.meta.gems || 0}
              </ThemedText>
              <ThemedText variant="body1" color="textSecondary">
                Gems
              </ThemedText>
            </View>
            
            <View style={styles.resourceRow}>
              <Battery size={20} color={theme.colors.success} />
              <ThemedText variant="heading3" weight="bold" color="success" style={styles.resourceValue}>
                {progress?.meta.energy || 0}
              </ThemedText>
              <ThemedText variant="body1" color="textSecondary">
                / {economy.energy.refillMax} Energy
              </ThemedText>
            </View>
            
            <View style={styles.resourceRow}>
              <Zap size={20} color={theme.colors.primary} />
              <ThemedText variant="heading3" weight="bold" color="primary" style={styles.resourceValue}>
                {progress?.meta.xp || 0}
              </ThemedText>
              <ThemedText variant="body1" color="textSecondary">
                XP (Level {progress?.meta.playerLevel || 0})
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        {/* Gems Controls */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
            💎 Gems Control
          </ThemedText>
          
          <View style={styles.controlsRow}>
            <ThemedButton
              title="-10"
              variant="ghost"
              size="sm"
              leftIcon={<Minus size={16} color={theme.colors.error} />}
              onPress={() => updateResource('gems', -10)}
              disabled={updating}
              style={styles.controlButton}
            />
            <ThemedButton
              title="-100"
              variant="ghost"
              size="sm"
              leftIcon={<Minus size={16} color={theme.colors.error} />}
              onPress={() => updateResource('gems', -100)}
              disabled={updating}
              style={styles.controlButton}
            />
            <ThemedButton
              title="+100"
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} color={theme.colors.textInverse} />}
              onPress={() => updateResource('gems', 100)}
              disabled={updating}
              style={styles.controlButton}
            />
            <ThemedButton
              title="+1000"
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} color={theme.colors.textInverse} />}
              onPress={() => updateResource('gems', 1000)}
              disabled={updating}
              style={styles.controlButton}
            />
          </View>
        </ThemedCard>

        {/* Energy Controls */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
            🔋 Energy Control
          </ThemedText>
          
          <View style={styles.controlsRow}>
            <ThemedButton
              title="-10"
              variant="ghost"
              size="sm"
              leftIcon={<Minus size={16} color={theme.colors.error} />}
              onPress={() => updateResource('energy', -10)}
              disabled={updating}
              style={styles.controlButton}
            />
            <ThemedButton
              title="-25"
              variant="ghost"
              size="sm"
              leftIcon={<Minus size={16} color={theme.colors.error} />}
              onPress={() => updateResource('energy', -25)}
              disabled={updating}
              style={styles.controlButton}
            />
            <ThemedButton
              title="+25"
              variant="success"
              size="sm"
              leftIcon={<Plus size={16} color={theme.colors.textInverse} />}
              onPress={() => updateResource('energy', 25)}
              disabled={updating}
              style={styles.controlButton}
            />
            <ThemedButton
              title="Max"
              variant="success"
              size="sm"
              onPress={() => updateResource('energy', economy.energy.refillMax)}
              disabled={updating}
              style={styles.controlButton}
            />
          </View>
        </ThemedCard>

        {/* XP Controls */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
            ⚡ XP Control
          </ThemedText>
          
          <View style={styles.controlsRow}>
            <ThemedButton
              title="-100"
              variant="ghost"
              size="sm"
              leftIcon={<Minus size={16} color={theme.colors.error} />}
              onPress={() => updateResource('xp', -100)}
              disabled={updating}
              style={styles.controlButton}
            />
            <ThemedButton
              title="-500"
              variant="ghost"
              size="sm"
              leftIcon={<Minus size={16} color={theme.colors.error} />}
              onPress={() => updateResource('xp', -500)}
              disabled={updating}
              style={styles.controlButton}
            />
            <ThemedButton
              title="+200"
              variant="info"
              size="sm"
              leftIcon={<Plus size={16} color={theme.colors.textInverse} />}
              onPress={() => updateResource('xp', 200)}
              disabled={updating}
              style={styles.controlButton}
            />
            <ThemedButton
              title="+1000"
              variant="info"
              size="sm"
              leftIcon={<Plus size={16} color={theme.colors.textInverse} />}
              onPress={() => updateResource('xp', 1000)}
              disabled={updating}
              style={styles.controlButton}
            />
          </View>
        </ThemedCard>

        {/* Quick Access */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
            🚀 Quick Access
          </ThemedText>
          
          <View style={styles.quickAccessRow}>
            <ThemedButton
              title="Visit Power Shop"
              variant="primary"
              size="md"
              onPress={() => onNavigate('xpshop')}
              style={styles.quickAccessButton}
            />
          </View>
        </ThemedCard>

        {/* Warning */}
        <ThemedCard variant="glass" padding="lg" style={styles.warningCard}>
          <ThemedText variant="body2" color="error" align="center" weight="semibold">
            ⚠️ Debug Mode ⚠️
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary" align="center" style={styles.warningText}>
            This panel is for development and testing only. Changes are permanent.
          </ThemedText>
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
  card: {
    marginBottom: theme.spacing.lg,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  warningCard: {
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  sectionTitle: {
    marginBottom: theme.spacing.base,
  },
  resourcesDisplay: {
    gap: theme.spacing.base,
  },
  resourceRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  resourceValue: {
    fontSize: 18,
    minWidth: 60,
  },
  controlsRow: {
    flexDirection: 'row' as const,
    gap: theme.spacing.sm,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  controlButton: {
    flex: 1,
    minWidth: 70,
  },
  quickAccessRow: {
    gap: theme.spacing.sm,
  },
  quickAccessButton: {
    width: '100%',
  },
  warningText: {
    marginTop: theme.spacing.xs,
  },
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
});

export default DebugScreen;