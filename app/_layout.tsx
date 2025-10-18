import { initializeGameManager } from "@/hooks/game-manager";
import { useEnergyRegen } from "@/hooks/useEnergyRegen";
import { cleanupOldTempProgress } from "@/hooks/useLevelProgress";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { isSupabaseEnabled } from "@/lib/supabase";
import { ToastHost } from "@/lib/toast";
import * as Font from 'expo-font';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AnimatedSplashScreen from '../app/components/screens/SplashScreen';
import useAutoSync from "../hooks/useAutoSync";
import { updateGlobalSettings, useSettings } from "../hooks/useSettings";
import BackgroundImage from "./components/common/BackgroundImage";

// SplashScreen.preventAutoHideAsync();

function LayoutWithInsets() {
  useAutoSync();
  useEnergyRegen(); // Add energy regeneration hook
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const { theme } = useTheme();

  // Update global settings when they change
  useEffect(() => {
    updateGlobalSettings(settings);
  }, [settings]);

  // Initialize app and cleanup old temporary progress
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize game manager
        initializeGameManager();
        
        // Cleanup old temporary progress data
        await cleanupOldTempProgress();
      } catch (error) {
        console.warn('Failed to initialize app:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background: for web this sets document.body background; for native uses Image */}
      <BackgroundImage />

      {/* App content always on top */}
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
          <Stack.Screen
            name="xpshop"
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
    position: "relative",
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "transparent",
    zIndex: 2,
    position: "relative",
  },
});

// --- New Code for RootLayout ---

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // --- THIS IS THE KEY CHANGE ---
        // We create two "tasks" that will run at the same time:
        // 1. Loading your fonts and assets.
        const assetLoadingPromise = Font.loadAsync({
          Helvetica: require("../assets/fonts/Helvetica.ttf"),
          'Cormorant-Garamond': require('../assets/fonts/Cormorant-Garamond.ttf'),
        });

        // 2. A simple timer that waits for 3 seconds.
        const minimumDisplayTimePromise = new Promise(resolve => setTimeout(resolve, 3000));

        // `Promise.all` waits for BOTH tasks to finish.
        // If assets load in 1 second, it will wait 2 more seconds for the timer.
        // If assets take 5 seconds to load, the timer will be done, and it will proceed immediately.
        await Promise.all([assetLoadingPromise, minimumDisplayTimePromise]);
        
        initializeGameManager();
      } catch (e) {
        console.warn(e);
      } finally {
        // Now we are certain at least 3 seconds have passed and assets are loaded.
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide the native splash screen once the app is ready and laid out.
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // While the app is not ready, we show your custom splash screen.
  // This will now be visible for a minimum of 3 seconds.
  if (!appIsReady) {
    return <AnimatedSplashScreen />;
  }

  // When ready, render the main app and attach the callback to hide the native splash.
  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider defaultTheme="light">
          <LayoutWithInsets />
          <ToastHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
