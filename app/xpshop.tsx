import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import BackgroundImage from "./components/common/BackgroundImage";
import LoadingScreen from "./components/common/LoadingScreen";
import XPShopScreen from "./components/screens/XPShopScreen";

export default function XPShopRoute() {
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
    }
    setTimeout(() => setIsLoading(false), 600);
  };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      {isLoading && <LoadingScreen progress={0.7} />}
      <XPShopScreen onNavigate={handleNavigate} />
    </View>
  );
}