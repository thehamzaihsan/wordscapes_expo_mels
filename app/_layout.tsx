import { initializeGameManager } from "@/hooks/game-manager";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { isSupabaseEnabled } from "@/lib/supabase";
import { ToastHost } from "@/lib/toast";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import useAutoSync from "../hooks/useAutoSync";
import { updateGlobalSettings, useSettings } from "../hooks/useSettings";
function LayoutWithInsets() {
  useAutoSync();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const { theme } = useTheme();

  // Update global settings when they change
  useEffect(() => {
    updateGlobalSettings(settings);
  }, [settings]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.contentContainer,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        {!isSupabaseEnabled() && (
          <View
            style={{
              backgroundColor: theme.colors.warning,
              padding: 8,
              borderBottomWidth: 1,
              borderColor: theme.colors.border,
              zIndex: 100,
            }}
          >
            <Text style={{ color: theme.colors.textInverse, fontSize: 12 }}>
              Supabase disabled: set EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_ANON_KEY in .env then restart (expo start
              -c).
            </Text>
          </View>
        )}
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            animation: "none",
            contentStyle: {
              backgroundColor: "transparent",
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{ headerShown: false, animation: "none" }}
          />
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
              gestureEnabled: false,
              animation: "none",
            }}
          />
          <Stack.Screen
            name="levels"
            options={{
              headerShown: false,
              gestureEnabled: false,
              animation: "none",
            }}
          />
          <Stack.Screen
            name="game"
            options={{
              headerShown: false,
              gestureEnabled: false,
              animation: "none",
            }}
          />

          <Stack.Screen
            name="profile"
            options={{ headerShown: false, gestureEnabled: true }}
          />
          <Stack.Screen
            name="create-account"
            options={{ headerShown: false, gestureEnabled: true }}
          />
          <Stack.Screen
            name="email-confirmation"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="otp-verify"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="forgot-password-email"
            options={{ headerShown: false, gestureEnabled: true }}
          />
          <Stack.Screen
            name="forgot-password-otp"
            options={{ headerShown: false, gestureEnabled: true }}
          />
          <Stack.Screen
            name="forgot-password-new"
            options={{ headerShown: false, gestureEnabled: true }}
          />
          <Stack.Screen
            name="login-email"
            options={{ headerShown: false, gestureEnabled: true }}
          />
          <Stack.Screen
            name="login-email-code"
            options={{ headerShown: false, gestureEnabled: true }}
          />
          <Stack.Screen
            name="auth-callback"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="shop"
            options={{ headerShown: false, gestureEnabled: true }}
          />
          <Stack.Screen
            name="settings"
            options={{ headerShown: false, gestureEnabled: true }}
          />
          <Stack.Screen
            name="glassmorphism-demo"
            options={{ headerShown: false, gestureEnabled: true }}
          />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "transparent",
    position: "relative",
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Helvetica: require("../assets/fonts/Helvetica.ttf"),
  });

  // Initialize components when fonts are loaded
  React.useEffect(() => {
    if (fontsLoaded) {
      console.log("Fonts loaded successfully");
    }
  }, [fontsLoaded]);

  useEffect(() => {
    initializeGameManager();
    if (Platform.OS === "android") {
      const backAction = () => {
        return false;
      };
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
      return () => backHandler.remove();
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <ThemeProvider defaultTheme="game">
        <View style={styles.container}>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        </View>
      </ThemeProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider defaultTheme="light">
          <LayoutWithInsets />
          <ToastHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
