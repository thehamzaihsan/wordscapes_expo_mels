import { useRouter } from "expo-router";
import GlassmorphismDemo from "./components/screens/GlassmorphismDemo";

export default function GlassmorphismDemoRoute() {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    if (screen === "back") {
      router.back();
    }
  };

  return <GlassmorphismDemo />;
}