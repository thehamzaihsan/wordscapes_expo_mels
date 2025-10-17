import { Difficulty } from "@/constants/difficulty";
import { useFocusEffect, useRouter } from "expo-router";
// Guest progress handled inside LevelScreen; this wrapper only passes params.
import { useCallback } from "react";
import { BackHandler, Platform, View } from "react-native";
import BackgroundImage from "./components/common/BackgroundImage";
import LoadingScreen from "./components/common/LoadingScreen";
import LevelScreen from "./components/screens/LevelScreen";
import React, { useState } from "react";

interface LevelData {
  baseWord: string;
  difficulty: Difficulty;
  levelTitle: string;
  levelData: {
    level?: number;
    baseWord: string;
    letters: string[];
    crosswordWords: string[];
    difficulty: Difficulty;
  };
  categoryName?: string;
}

export default function LevelsRoute() {
  const router = useRouter();
  // removed unused selectedLevel state

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back(); // Navigate back to login
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

  const handleNavigate = (screen: string, levelData?: LevelData) => {
    if (screen === "login") {
      router.back(); // Use back() for going back to login
    } else if (screen === "index") {
      // Return to opening screen
      router.replace("/");
    } else if (screen === "game") {
      if (levelData) {
        router.push({
          pathname: "/game",
          params: {
            baseWord: levelData.baseWord,
            difficulty: levelData.difficulty,
            levelTitle: levelData.levelTitle,
            categoryName: levelData.categoryName || "Forest",
            levelNumber: String(levelData.levelData?.level ?? 1),
            levelDataJSON: JSON.stringify(levelData.levelData),
          },
        });
      } else {
        router.push("/game");
      }
    } else if (screen === "shop") {
      router.push("/shop");
    } else if (screen === "xpshop") {
      router.push("/xpshop");
    } else if (screen === "profile") {
      router.push("/profile");
    } else if (screen === "settings") {
      router.push("/settings");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      {isLoading && <LoadingScreen />}
      <LevelScreen onNavigate={handleNavigate} />
    </View>
  );
}
