import {
  resetPassword,
  signInEmailPassword,
  signInWithGoogle,
} from "@/lib/auth";
import { isSupabaseEnabled } from "@/lib/supabase";
import { showToast } from "@/lib/toast";
import { ChevronLeft, Play, Settings } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo from "./logo";



interface LoginScreenProps {
  onNavigate: (screen: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const insets = useSafeAreaInsets();
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);


  const handlePlayClick = (): void => {
    setShowLogin(true);
  };

  const handleBackClick = (): void => {
    setShowLogin(false);
    setEmail("");
    setPassword("");
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

  const handleGuestLogin = (): void => {
    onNavigate("guest-name");
  };

  const handleForgotPassword = () => {
    setResetEmail(email);
    setShowReset(true);
  };

  const handleCreateAccount = (): void => {
    onNavigate("create-account");
  };

  const handleGoogleLogin = async (): Promise<void> => {
    if (googleLoading) return;
    if (!isSupabaseEnabled()) {
      showToast("Supabase not configured", "error");
      return;
    }
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.ok) showToast(res.error || "Google sign-in failed", "error");
    } catch (e: any) {
      showToast(e?.message || "Google error", "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendReset = async () => {
    if (!resetEmail.trim()) {
      showToast("Enter email", "error");
      return;
    }
    setResetLoading(true);
    try {
      const res = await resetPassword(resetEmail.trim().toLowerCase());
      if (!res.ok) showToast(res.error || "Failed to send reset", "error");
      else {
        showToast("Reset email sent", "success");
        setShowReset(false);
      }
    } catch (e: any) {
      showToast(e?.message || "Error sending reset", "error");
    } finally {
      setResetLoading(false);
    }
  };



  const renderMainMenu = () => (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {/* <StatusBar barStyle="light-content" backgroundColor="#121213" /> */}
      <View style={styles.mainContent}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoSection}>
            <Logo />
          </View>
        </View>
        {/* Menu Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handlePlayClick}
            style={styles.primaryButton}
          >
            <Play size={18} color={"white"} />
            <Text style={styles.primaryButtonText}> Play Game</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onNavigate("settings")}
            style={styles.secondaryButton}
          >
            <Settings size={18} color={"white"} />
            <Text style={styles.secondaryButtonText}> Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderLoginScreen = () => (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#121213" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity onPress={handleBackClick} style={styles.backButton}>
          <ChevronLeft size={16} color={"white"} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        {/* Compact Logo */}
        <View style={styles.compactLogoContainer}>
          <Logo />
        </View>
        {/* Login Form */}
        <View style={styles.loginForm}>
          <Text style={styles.loginTitle}>LOGIN TO PLAY</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#6B7280"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#6B7280"
              secureTextEntry
            />
          </View>
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? "CONNECTING..." : "LOGIN"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        {/* Guest Login */}
        <TouchableOpacity onPress={handleGuestLogin} style={styles.guestButton}>
          <Text style={styles.guestButtonText}>CONTINUE AS GUEST</Text>
        </TouchableOpacity>
        {/* Google Login */}
        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={googleLoading}
          style={styles.googleLoginButton}
        >
          {googleLoading ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <View style={styles.googleContentRow}>
              <Image
                source={{
                  uri: "https://developers.google.com/identity/images/g-logo.png",
                }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleLoginButtonText}>
                SIGN IN WITH GOOGLE
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {/* Create Account */}
        <View style={styles.createAccountContainer}>
          <Text style={styles.createAccountText}>New player? </Text>
          <TouchableOpacity onPress={handleCreateAccount}>
            <Text style={styles.createAccountLink}>CREATE ACCOUNT</Text>
          </TouchableOpacity>
        </View>
        {showReset && (
          <View style={styles.resetCard}>
            <Text style={styles.resetTitle}>Reset Password</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={resetEmail}
              onChangeText={setResetEmail}
              placeholder="you@example.com"
              placeholderTextColor="#6B7280"
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[styles.loginButton, { flex: 1 }]}
                disabled={resetLoading}
                onPress={handleSendReset}
              >
                <Text style={styles.loginButtonText}>
                  {resetLoading ? "SENDING..." : "SEND LINK"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.guestButton, { flex: 1 }]}
                onPress={() => setShowReset(false)}
              >
                <Text style={styles.guestButtonText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return showLogin ? renderLoginScreen() : renderMainMenu();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoSection: {
    alignItems: "center",
    position: "relative",
  },
  letterRow: {
    flexDirection: "row",
    marginBottom: 8,
    justifyContent: "center",
  },
  letterTile: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  letterText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  betaTag: {
    position: "absolute",
    top: -10,
    right: -30,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    transform: [{ rotate: "15deg" }],
  },
  betaText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
  },
  primaryButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#7C3AED",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: "#374151",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4B5563",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  compactLogoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  compactLetterRow: {
    flexDirection: "row",
    marginBottom: 4,
    justifyContent: "center",
  },
  loginForm: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#374151",
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#4B5563",
    paddingStart: 20,
  },
  loginButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  loginButtonDisabled: {
    backgroundColor: "#4B5563",
    borderColor: "#6B7280",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },
  forgotPassword: {
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "#8B5CF6",
    fontSize: 14,
  },
  guestButton: {
    backgroundColor: "#374151",
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#4B5563",
  },
  googleLoginButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  googleLoginButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  googleContentRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  googleIcon: { width: 18, height: 18, resizeMode: "contain" },
  guestButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },
  createAccountContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  createAccountText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  createAccountLink: {
    color: "#8B5CF6",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  resetCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#374151",
    marginTop: 10,
    gap: 14,
  },
  resetTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});

export default LoginScreen;
