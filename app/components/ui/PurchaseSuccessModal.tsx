import LottieView from "lottie-react-native";
import { Modal, Platform, StyleSheet, Text, View } from "react-native";

import ThemedButton from "./ThemedButton";
import ThemedCard from "./ThemedCard";
import ThemedText from "./ThemedText";

type Props = {
  visible: boolean;
  gems: number;
  onClose: () => void;
};

export default function PurchaseSuccessModal({
  visible,
  gems,
  onClose,
}: Props) {
  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <ThemedCard style={styles.modalCard} variant="glassStrong" padding="lg">
          <ThemedText>THANK YOU!</ThemedText>
          {Platform.OS !== "web" ? (
            <LottieView
              source={require("../../../assets/animations/level-complete.json")}
              autoPlay
              loop={false}
              style={{ width: 200, height: 200 }}
            />
          ) : (
            <View
              style={{
                width: 200,
                height: 200,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 60 }}>🎉</Text>
            </View>
          )}
          <ThemedText align="center" style={{ marginTop: 4 }}>
            Added {gems.toLocaleString()} gems to your account.
          </ThemedText>
          <ThemedButton
            variant="primary"
            title="Continue"
            style={styles.okButton}
            onPress={onClose}
          />
        </ThemedCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "80%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  okButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
