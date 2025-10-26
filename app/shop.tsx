import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
import StoreScreen from "@/components/screens/StoreScreen";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { BackHandler, Platform, View } from "react-native";

export default function ShopRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const { session, loading } = useSupabaseAuth();

  // Redirect to levels only when this route is focused, to avoid stealing
  // control during flows like password recovery on other screens.
  useFocusEffect(
    useCallback(() => {
      if (!loading && !session) {
        router.replace("/login");
      }
      console.log(session);
      return undefined;
    }, [loading, session, router])
  );

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back(); // Navigate back to levels
        return true; // Prevent default behavior
      };

      if (Platform.OS === "android") {
        const subscription = BackHandler.addEventListener(
          "hardwareBackPress",
          onBackPress
        );
        return () => subscription.remove();
      }
    }, [router])
  );

  const handleNavigate = (screen: string) => {
    setIsLoading(true);
    setTimeout(() => {
      if (screen === "levels") {
        router.back();
      }
      setTimeout(() => setIsLoading(false), 100);
    }, 600);
  };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      {isLoading && <LoadingScreen />}
      <StoreScreen onNavigate={handleNavigate} />
    </View>
  );
}
