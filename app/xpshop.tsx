import { useRouter } from "expo-router";
import XPShopScreen from "./components/Screens/XPShopScreen";

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

  return <XPShopScreen onNavigate={handleNavigate} />;
}