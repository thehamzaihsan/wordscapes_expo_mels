import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { signInEmailPassword } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { ChevronLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoadingScreen from "../common/LoadingScreen";
import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedInput from "../ui/ThemedInput";
import ThemedText from "../ui/ThemedText";

interface LoginScreenProps {
  onNavigate: (screen: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isScreenLoading, setIsScreenLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate a short delay for a smoother transition
    const timer = setTimeout(() => setIsScreenLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleBackClick = (): void => {
    onNavigate("back");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      showToast("Email & password required", "error");
      return;
    }
    setIsLoading(true);
    try {
      const res = await signInEmailPassword(
        email.trim().toLowerCase(),
        password
      );
      if (!res.ok) {
        showToast(res.error || "Login failed", "error");
      } else {
        showToast("Welcome back", "success");
        onNavigate("levels");
      }
    } catch (e: any) {
      showToast(e?.message || "Login error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = (): void => onNavigate("guest-name");
  const handleForgotPassword = () => onNavigate("forgot-password");
  const handleCreateAccount = (): void => onNavigate("create-account");

  if (isScreenLoading) {
    return <LoadingScreen />;
  }
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        contentContainerStyle={[
          styles.loginScrollContent,
          {
            paddingTop: insets.top + theme.spacing.lg,
            paddingBottom: insets.bottom + theme.spacing.lg,
            paddingLeft: insets.left + theme.spacing.lg,
            paddingRight: insets.right + theme.spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <ThemedButton
          title="Back"
          variant="glass"
          size="sm"
          leftIcon={<ChevronLeft size={20} color={theme.colors.text} />}
          onPress={handleBackClick}
          style={styles.backButton}
        />

        {/* /* Compact Logo */}
        {/* <View style={styles.compactLogoContainer}> */}
        {/* REPLACE <Logo /> with the Image component */}
        {/* <Image
            source={require("../../../assets/images/WorldSprings_logo_1.png")} 
            style={styles.logoImage} 
            resizeMode="contain" 
          /> */}
        {/* <WordSpringsText style={{ fontSize: 32 }}> 
            WORDSPRINGS
          </WordSpringsText> */}
        {/* </View>  */}

        {/* Login Form Card */}
        <ThemedCard variant="glassStrong" padding="xl" style={styles.loginCard}>
          <ThemedText
            variant="heading2"
            weight="bold"
            align="center"
            style={styles.loginTitle}
          >
            Sign In to Play
          </ThemedText>

          <ThemedText
            variant="body2"
            align="center"
            color="textSecondary"
            style={styles.loginSubtitle}
          >
            Enter your credentials to continue your word journey
          </ThemedText>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <ThemedInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              variant="outlined"
              leftIcon={<Mail size={20} color={theme.colors.textSecondary} />}
              style={styles.input}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <ThemedInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              variant="outlined"
              leftIcon={<Lock size={20} color={theme.colors.textSecondary} />}
              rightIcon={
                showPassword ? (
                  <EyeOff size={20} color={theme.colors.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.colors.textSecondary} />
                )
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
              style={styles.input}
            />
          </View>

          {/* Login Button */}
          <ThemedButton
            title={isLoading ? "Signing In..." : "Sign In"}
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading}
            onPress={handleLogin}
            style={styles.loginButton}
          />

          {/* Forgot Password */}
          <ThemedButton
            title="Forgot Password?"
            variant="ghost"
            size="sm"
            onPress={handleForgotPassword}
            style={styles.forgotButton}
          />

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
            <ThemedText
              variant="caption"
              color="textSecondary"
              style={styles.dividerText}
            >
              or
            </ThemedText>
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
          </View>

          {/* Alternative Actions */}
          <ThemedButton
            title="Create New Account"
            variant="outline"
            size="md"
            fullWidth
            onPress={handleCreateAccount}
            style={styles.createAccountButton}
          />

          <ThemedButton
            title="Continue as Guest"
            variant="secondary"
            size="md"
            fullWidth
            onPress={handleGuestLogin}
            style={styles.guestButton}
          />
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
    position: "relative" as const,
    backgroundColor: "transparent", // Remove background to show layout image
    // Web: center the content with a max width for desktop layouts.
    // Mobile: take full width so the screen is visible on small devices.
    ...(Platform.OS === "web"
      ? { maxWidth: 1600, alignSelf: "center" as const }
      : {}),
  },
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start" as const,
  },
  backButton: {
    alignSelf: "flex-start" as const,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: 12,
    paddingRight: 15,
  },
  compactLogoContainer: {
    alignItems: "center" as const,
    marginBottom: theme.spacing.xl2,
  },
  loginCard: {
    maxWidth: 400,
    alignSelf: "center" as const,
    width: "100%",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  loginTitle: {
    marginBottom: theme.spacing.sm,
  },
  loginSubtitle: {
    marginBottom: theme.spacing.xl3,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  input: {
    borderRadius: theme.borderRadius.md,
  },
  loginButton: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.base,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  forgotButton: {
    marginBottom: theme.spacing.xl,
    alignSelf: "center" as const,
  },
  dividerContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginVertical: theme.spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: theme.spacing.base,
  },
  createAccountButton: {
    marginBottom: theme.spacing.md,
  },
  guestButton: {
    marginBottom: theme.spacing.sm,
  },
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
  logoImage: {
    width: 150,
    height: 150,
  },
});

export default LoginScreen;
