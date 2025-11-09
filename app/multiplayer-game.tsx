import MultiplayerGameScreen from "@/components/screens/MultiplayerGameScreen";
import { useRouter } from "expo-router";

export default function MultiplayerGameRoute() {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    router.push(`/${screen}` as any);
  };

  return <MultiplayerGameScreen onNavigate={handleNavigate} />;
}
