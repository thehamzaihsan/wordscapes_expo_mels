import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Play, Settings } from "lucide-react-native";
import {
  ActivityIndicator,
  StatusBar,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo from "./components/common/Logo";
import ThemedButton from "./components/ui/ThemedButton";
import ThemedText from "./components/ui/ThemedText";

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading, session } = useSupabaseAuth();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handlePlay = () => {
    if (session) router.push("/levels");
    else router.push("/login");
  };
  const handleSettings = () => router.push("/settings");

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <ThemedText variant="body1" color="textSecondary" style={{ marginTop: theme.spacing.base }}>
          Loading...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={[styles.safeArea, {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }]}>
        
       

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Logo />
          </View>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionButtonsContainer}>
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
    </View>
  );
}

const createStyles = (theme: any) => ({
  loadingContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'transparent', // Remove background to show layout image
  },
  container: {
    flex: 1,
    position: 'relative' as const,
    backgroundColor: 'transparent', // Remove background to show layout image
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  headerSection: {
    marginTop: theme.spacing.xl4,
    marginBottom: theme.spacing.lg,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginVertical: theme.spacing.xl4,
  },
  logoWrapper: {
    alignItems: 'center' as const,
    marginBottom: theme.spacing.lg,
  },
  actionButtonsContainer: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center' as const,
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
});
