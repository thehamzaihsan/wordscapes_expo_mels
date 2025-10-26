import BackgroundImage from "@/components/common/BackgroundImage";
import GlassmorphismDemo from "@/components/screens/GlassmorphismDemo";
import { useRouter } from "expo-router";
import { View } from "react-native";

export default function GlassmorphismDemoRoute() {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    if (screen === "back") {
      router.push("/");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      <GlassmorphismDemo />
    </View>
  );
}
