<<<<<<< HEAD
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import BackgroundImage from "./components/common/BackgroundImage";
import SettingsScreen from './components/screens/SettingsScreen';
=======
import LoadingScreen from "@/components/common/LoadingScreen";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";

import BackgroundImage from "@/components/common/BackgroundImage";
import SettingsScreen from "@/components/screens/SettingsScreen";
import { BackHandler, Platform, View } from "react-native";
>>>>>>> ui-overhall

export default function SettingsRoute() {
  const router = useRouter();

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back(); // Navigate back to previous screen
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
<<<<<<< HEAD
    if (screen === 'back') {
      router.back(); // Use back() to return to previous screen
    }
=======
    setIsLoading(true);
    setTimeout(() => {
      if (screen === "back") {
        router.back();
      } else if (screen === "credits") {
        router.push("/credits");
      } else if (screen === "debug") {
        router.push("/debug");
      }
      setTimeout(() => setIsLoading(false), 100);
    }, 600);
>>>>>>> ui-overhall
  };

  return (
    <>
      {isLoading && <LoadingScreen progress={0.7} />}
      <SettingsScreen onNavigate={handleNavigate} />
    </>
  );
}
