import { initializeGameManager } from "@/hooks/game-manager";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { isSupabaseEnabled } from "@/lib/supabase";
import { ToastHost } from "@/lib/toast";
import * as Font from 'expo-font';
import { Stack } from "expo-router";
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

// SplashScreen.preventAutoHideAsync();

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
      {/* Background: for web this sets document.body background; for native uses Image */}

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

// --- New Code for RootLayout ---

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          Helvetica: require("../assets/fonts/Helvetica.ttf"),
          'Cormorant-Garamond': require('../assets/fonts/Cormorant-Garamond.ttf'),
        });
        initializeGameManager();
        // ... other setup
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide the native (color-only) splash screen
      // await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // While app is not ready, show your JS Splash Screen
  if (!appIsReady) {
    return <AnimatedSplashScreen />; 
  }

  // App is ready, render the app
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

