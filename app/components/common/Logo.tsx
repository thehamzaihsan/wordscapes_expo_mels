import { Image } from "react-native";

export default function Logo() {
  return (
    <Image
      source={require("../../../assets/images/wordspring.png")}
      style={{
        width: 350,
        height: 100,
        resizeMode: "contain",
        marginBottom: 0,
        marginTop: 20,
      }}
    />
  );
}
