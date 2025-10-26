import BackgroundImage from "@/components/common/BackgroundImage";
import BackgroundSelectionScreen from "@/components/screens/BackgroundSelectionScreen";
import { View } from "react-native";

export default function BackgroundsRoute() {
  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      <BackgroundSelectionScreen />
    </View>
  );
}
