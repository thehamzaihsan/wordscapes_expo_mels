import { useRouter } from "expo-router";
<<<<<<< HEAD
=======
import { View } from "react-native";
import BackgroundImage from "./components/common/BackgroundImage";
import LoadingScreen from "./components/common/LoadingScreen";
>>>>>>> ui-overhall
import XPShopScreen from "./components/screens/XPShopScreen";

export default function XPShopRoute() {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    if (screen === "levels") {
      router.back();
    } else if (screen === "profile") {
      router.push("/profile");
    } else if (screen === "shop") {
      router.push("/shop");
    }
  };

<<<<<<< HEAD
  return <XPShopScreen onNavigate={handleNavigate} />;
=======
  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      {isLoading && <LoadingScreen progress={0.7} />}
      <XPShopScreen onNavigate={handleNavigate} />
    </View>
  );
>>>>>>> ui-overhall
}