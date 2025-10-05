import React, { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Mail, CheckCircle, AlertCircle, ArrowRight } from "lucide-react-native";
import { resendConfirmationEmail } from "@/lib/auth";
import { showToast } from "@/lib/toast";

interface EmailConfirmationScreenProps {
  onNavigate: (screen: string) => void;
  email?: string;
}

const EmailConfirmationScreen: React.FC<EmailConfirmationScreenProps> = ({
  onNavigate,
  email = "your email",
}) => {
  const [countdown, setCountdown] = useState(5);
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto redirect countdown
  useEffect(() => {
    if (countdown > 0 && isAutoRedirecting) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isAutoRedirecting) {
      onNavigate("login");
    }
  }, [countdown, isAutoRedirecting, onNavigate]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleGoToLogin = useCallback(() => {
    setIsAutoRedirecting(false);
    onNavigate("login");
  }, [onNavigate]);

  const handleResendEmail = useCallback(async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    try {
      const result = await resendConfirmationEmail(email);
      if (result.ok) {
        showToast("Confirmation email sent successfully!", "success");
        setResendCooldown(60); // 60 second cooldown
      } else {
        showToast(result.error || "Failed to resend email", "error");
      }
    } catch (error) {
      showToast("Failed to resend email. Please try again.", "error");
    } finally {
      setIsResending(false);
    }
  }, [email, resendCooldown, isResending]);

  const stopAutoRedirect = useCallback(() => {
    setIsAutoRedirecting(false);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={Platform.OS === "android" ? "light-content" : "light-content"}
        backgroundColor="#121213"
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <CheckCircle size={64} color="#10B981" />
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Check Your Email!</Text>
            <Text style={styles.subtitle}>
              Account created successfully! We've sent a confirmation email to:
            </Text>
            
            <View style={styles.emailContainer}>
              <Mail size={20} color="#8B5CF6" />
              <Text style={styles.emailText}>{email}</Text>
            </View>

            <View style={styles.instructionContainer}>
              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.instructionText}>
                  Check your email inbox (and spam folder)
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  Click the confirmation link in the email
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  Return here and log in with your credentials
                </Text>
              </View>
            </View>

            {/* Warning */}
            <View style={styles.warningContainer}>
              <AlertCircle size={16} color="#F59E0B" />
              <Text style={styles.warningText}>
                You must confirm your email before you can log in
              </Text>
            </View>
          </View>

          {/* Auto Redirect Notice */}
          {isAutoRedirecting && (
            <View style={styles.autoRedirectContainer}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={styles.autoRedirectText}>
                Automatically redirecting to login in {countdown} seconds...
              </Text>
              <TouchableOpacity onPress={stopAutoRedirect} style={styles.cancelAutoButton}>
                <Text style={styles.cancelAutoText}>Cancel auto-redirect</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGoToLogin}
            >
              <Text style={styles.primaryButtonText}>Continue to Login</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                (isResending || resendCooldown > 0) && styles.secondaryButtonDisabled
              ]}
              onPress={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
            >
              {isResending ? (
                <ActivityIndicator size="small" color="#D1D5DB" />
              ) : (
                <Text style={styles.secondaryButtonText}>
                  {resendCooldown > 0 
                    ? `Resend Email (${resendCooldown}s)` 
                    : "Resend Email"
                  }
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              Didn't receive an email? Check your spam folder or try resending.
            </Text>
            <Text style={styles.footerSubtext}>
              Make sure to check all email folders including promotions and social tabs.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121213",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  container: {
    alignItems: "center",
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#374151",
    marginBottom: 32,
    gap: 8,
  },
  emailText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  instructionContainer: {
    width: "100%",
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: "#D1D5DB",
    lineHeight: 20,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 32,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#F59E0B",
    fontWeight: "500",
    flex: 1,
  },
  autoRedirectContainer: {
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#374151",
  },
  autoRedirectText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  cancelAutoButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelAutoText: {
    fontSize: 12,
    color: "#8B5CF6",
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#7C3AED",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: "#374151",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4B5563",
  },
  secondaryButtonText: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  footerContainer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 16,
  },
});

export default EmailConfirmationScreen;