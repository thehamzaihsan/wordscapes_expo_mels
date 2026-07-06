import { Difficulty } from "@/constants/difficulty";
import { useFocusEffect, useRouter } from "expo-router";
// Guest progress handled inside LevelScreen; this wrapper only passes params.
import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
import LevelScreen from "@/components/screens/LevelScreen";
import { useCallback, useState } from "react";
import { BackHandler, Platform, View } from "react-native";

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
  const [isLoading, setIsLoading] = useState(false);

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/"); // Back goes home, not to the login form
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
    setIsLoading(true);
    setTimeout(() => {
      if (screen === "login") {
        router.push("/login"); // Use back() for going back to login
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
      } else if (screen === "backgrounds") {
        router.push("/backgrounds");
      }
      setTimeout(() => setIsLoading(false), 100);
    }, 600);
  };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      {isLoading && <LoadingScreen />}
      <LevelScreen onNavigate={handleNavigate} />
    </View>
  );
}
