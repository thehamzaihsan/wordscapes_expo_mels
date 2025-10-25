import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
import DebugScreen from "@/components/screens/DebugScreen";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function DebugRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleNavigate = (screen: string) => {
    setIsLoading(true);
    if (screen === "levels") {
      router.back();
    } else if (screen === "profile") {
      router.push("/profile");
    } else if (screen === "shop") {
      router.push("/shop");
    } else if (screen === "xpshop") {
      router.push("/xpshop");
    }
    setTimeout(() => setIsLoading(false), 600);
  };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      {isLoading && <LoadingScreen progress={0.7} />}
      <DebugScreen onNavigate={handleNavigate} />
    </View>
  );
}
