import BackgroundImage from "@/components/common/BackgroundImage";
import WordSpringsText from "@/components/common/WordSpringsText";
import ThemedButton from "@/components/ui/ThemedButton";
import Modal from "@/components/ui/ThemedModal";
import ThemedText from "@/components/ui/ThemedText";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { checkOnline } from "@/lib/network";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Play, Settings, Users, UserX, WifiOff } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading, session } = useSupabaseAuth();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [errorModal, setErrorModal] = useState<null | {
    title: string;
    subtitle?: string;
    icon?: "offline" | "guest";
    primary?: { label: string; action: () => void };
    secondary?: { label: string; action: () => void };
  }>(null);

  const handlePlay = () => {
    if (session) router.push("/levels");
    else router.push("/login");
  };
  const handleSettings = () => router.push("/settings");

  const handleMultiplayer = async () => {
    // 1) Internet check (quick, cross‑platform)
    const online = await checkOnline();
    if (!online) {
      setErrorModal({
        title: "No Internet",
        subtitle: "You're offline. Check your connection and try again.",
        icon: "offline",
        primary: {
          label: "Try again",
          action: () => {
            setErrorModal(null);
            handleMultiplayer();
          },
        },
        secondary: { label: "Close", action: () => setErrorModal(null) },
      });
      return;
    }

    // 2) Must be authenticated
    if (!session?.user?.id) {
      setErrorModal({
        title: "Sign in required",
        subtitle: "Multiplayer is only available for signed‑in players.",
        icon: "guest",
        primary: {
          label: "Sign in",
          action: () => {
            setErrorModal(null);
            router.push("/login");
          },
        },
        secondary: { label: "Cancel", action: () => setErrorModal(null) },
      });
      return;
    }

    // 3) Profile must not be guest
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_guest")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      setErrorModal({
        title: "Profile error",
        subtitle: "We couldn't verify your account. Please try again.",
        primary: {
          label: "Retry",
          action: () => {
            setErrorModal(null);
            handleMultiplayer();
          },
        },
        secondary: { label: "Close", action: () => setErrorModal(null) },
      });
      return;
    }

    if (!profile || profile.is_guest) {
      setErrorModal({
        title: "Guest accounts can't play multiplayer",
        subtitle:
          "Create or sign in to a free account to battle other players.",
        icon: "guest",
        primary: {
          label: "Sign in",
          action: () => {
            setErrorModal(null);
            router.push("/login");
          },
        },
        secondary: { label: "Cancel", action: () => setErrorModal(null) },
      });
      return;
    }

    router.push("/multiplayer");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <BackgroundImage />
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <ThemedText
          variant="body1"
          color="textSecondary"
          style={{ marginTop: theme.spacing.base }}
        >
          Loading...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundImage />
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={[
            styles.safeArea,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
          ]}
        >
          {/* Logo Section */}
          <View style={styles.compactLogoContainer}>
            {/* REPLACE <Logo /> with the Image component */}
            <Image
              source={require("../assets/images/WorldSprings_logo_1.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <WordSpringsText
              style={{ fontSize: 40, paddingTop: 15, paddingBottom: 15 }}
            >
              Word Springs
            </WordSpringsText>
          </View>

          {/* Main Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <ThemedButton
              title="Multiplayer"
              variant="primary"
              size="xl"
              fullWidth
              leftIcon={<Users size={20} color="white" />}
              onPress={handleMultiplayer}
              style={styles.primaryButton}
            />

            <ThemedButton
              title="Start Playing"
              variant="primary"
              size="xl"
              fullWidth
              leftIcon={<Play size={20} color="white" />}
              onPress={handlePlay}
              style={styles.primaryButton}
            />

            <ThemedButton
              title="Settings"
              variant="secondary"
              size="xl"
              fullWidth
              leftIcon={<Settings size={20} color={theme.colors.text} />}
              onPress={handleSettings}
              style={styles.secondaryButton}
            />
          </View>

          {/* Quick Access Footer */}
          {/* <View style={styles.footerSection}>
          <ThemedText variant="caption" align="center"  style={styles.footerText}>
            Play thousands of word puzzles
          </ThemedText>
        </View> */}
        </View>
      </ScrollView>
      {/* Enhanced error modal */}
      <Modal
        isVisible={!!errorModal}
        onClose={() => setErrorModal(null)}
        title={errorModal?.title}
        subtitle={errorModal?.subtitle}
        backdrop="blur"
        showCloseButton
        size="small"
      >
        <View style={{ gap: theme.spacing.md }}>
          {/* Icon Display */}
          {errorModal?.icon && (
            <View style={{
              alignItems: "center",
              paddingBottom: theme.spacing.sm,
            }}>
              <View style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: errorModal.icon === "offline" 
                  ? theme.colors.error + '15' 
                  : theme.colors.warning + '15',
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: errorModal.icon === "offline" 
                  ? theme.colors.error + '30' 
                  : theme.colors.warning + '30',
              }}>
                {errorModal.icon === "offline" ? (
                  <WifiOff size={36} color={theme.colors.error} />
                ) : errorModal.icon === "guest" ? (
                  <UserX size={36} color={theme.colors.warning} />
                ) : null}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
            {errorModal?.primary && (
              <ThemedButton
                title={errorModal.primary.label}
                variant="primary"
                size="lg"
                onPress={errorModal.primary.action}
                fullWidth
              />
            )}
            {errorModal?.secondary && (
              <ThemedButton
                title={errorModal.secondary.label}
                variant="ghost"
                size="md"
                onPress={errorModal.secondary.action}
                fullWidth
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: any) => ({
  loadingContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "transparent", // Remove background to show layout image
  },
  container: {
    flex: 1,
    position: "relative" as const,
    backgroundColor: "transparent", // Remove background to show layout image
  },
  safeArea: {
    flex: 1,
    width: "100%" as const,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: "space-around" as const, // To provide space around content
    alignItems: "center" as const,
  },
  headerSection: {
    marginTop: theme.spacing.xl4,
    marginBottom: theme.spacing.lg,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginVertical: theme.spacing.xl4,
  },
  logoWrapper: {
    alignItems: "center" as const,
    marginBottom: theme.spacing.lg,
  },
  actionButtonsContainer: {
    width: "100%" as const,
    maxWidth: 320,
    marginBottom: theme.spacing.xl4,
    gap: theme.spacing.base,
  },
  primaryButton: {
    marginBottom: theme.spacing.sm,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  secondaryButton: {
    marginBottom: theme.spacing.lg,
  },
  footerSection: {
    marginTop: theme.spacing.xl4,
    marginBottom: theme.spacing.lg,
  },
  footerText: {
    opacity: 0.8,
  },
  compactLogoContainer: {
    alignItems: "center" as const,
    // marginBottom: theme.spacing.xl2,
    marginTop: theme.spacing.xl2,
  },
  logoImage: {
    width: 200,
    height: 200,
  },
});
