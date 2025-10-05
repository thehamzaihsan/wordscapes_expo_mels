import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function PasswordResetConfirmation() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check Your Email</Text>
      <Text style={styles.subtitle}>
        If an account exists for that address, a password reset link has been
        sent.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/login")}
      >
        <Text style={styles.buttonText}>Return to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121213",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 24,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
