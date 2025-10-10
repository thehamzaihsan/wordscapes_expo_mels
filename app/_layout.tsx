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
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background, // Use theme background color
        position: 'relative', // Ensure proper stacking context
      }}
    >
      {/* Background animation behind everything */}
      {/* <BGAnimation /> */}
      {/* App content always on top */}
      <View
        style={{
          flex: 1,
          backgroundColor: "transparent",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          zIndex: 10, // Ensure content is above animation
          position: 'relative', // Establish stacking context
        }}
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
            // animation: 'slide_from_right',
            gestureEnabled: true,
            contentStyle: { 
              backgroundColor: "transparent", 
              zIndex: 20, // Ensure screens are above everythingpinde
            },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="levels"
            options={{ headerShown: false, gestureEnabled: true }}
          />
          <Stack.Screen
            name="game"
            options={{ headerShown: false, gestureEnabled: true }}
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
        </Stack>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    KnightWarrior: require("../assets/fonts/KnightWarrior.otf"),
    Helvetica: require("../assets/fonts/Helvetica.ttf"),
  });

  // Set Helvetica as the default font for all Text components
  React.useEffect(() => {
    if (fontsLoaded) {
      // @ts-ignore
      Text.defaultProps = Text.defaultProps || {};
      // Only set if not already set (prevents infinite loop in Fast Refresh)
      // @ts-ignore - defaultProps is not typed but still works for global font override
      if (Text.defaultProps.style?.fontFamily !== "Helvetica") {
        // @ts-ignore
        Text.defaultProps.style = [
          // @ts-ignore
          Text.defaultProps.style || {},
          { fontFamily: "Helvetica" },
        ];
      }
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Initialize game manager for optimal performance across the app
    initializeGameManager();
    if (Platform.OS === "android") {
      const backAction = () => {
        // Let Expo Router handle the back navigation
        return false; // Return false to let the default behavior handle it
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#121213", // Keep static for loading screen
        }}
      >
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider defaultTheme="game">
          <LayoutWithInsets />
          <ToastHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
