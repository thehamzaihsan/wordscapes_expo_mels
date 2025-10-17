import { Difficulty } from "@/constants/difficulty";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { BackHandler, Platform, View } from "react-native";
import BackgroundImage from "./components/common/BackgroundImage";
import GameScreen from "./components/screens/GameScreen";

export default function GameRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract level data from params
  const baseWord = (params.baseWord as string) || "planet";
  const difficulty = (params.difficulty as Difficulty) || "medium";
  const levelTitle = (params.levelTitle as string) || baseWord;
  const categoryName = (params.categoryName as string) || "Forest";
  const levelNumber = params.levelNumber
    ? Number(params.levelNumber)
    : undefined;

  // Parse level data if provided
  let levelData = null;
  if (params.levelDataJSON) {
    try {
      levelData = JSON.parse(params.levelDataJSON as string);
      console.log("📋 Parsed level data from navigation:", levelData);
    } catch (error) {
      console.warn("Failed to parse level data:", error);
    }
  }

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
    if (screen === "levels") {
      router.back(); // Use back() to return to levels
    } else if (screen === "xpshop") {
      router.push("/xpshop"); // Navigate to XP Shop
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      <GameScreen
        onNavigate={handleNavigate}
        difficulty={difficulty}
        baseWord={baseWord}
        levelTitle={levelTitle}
        categoryName={categoryName}
        levelData={
          levelData
            ? { ...levelData, level: levelNumber || levelData.level }
            : undefined
        }
      />
    </View>
  );
}
