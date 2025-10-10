import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

interface GameCompletionModalProps {
  visible: boolean;
  score: number;
  onNextLevel: () => void;
}

export default function GameCompletionModal({
  visible,
  score,
  onNextLevel,
}: GameCompletionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.modalContainer}>
        <BlurView intensity={50} style={styles.absolute} />
        <View style={styles.animationContainer}>
          <LottieView
            source={require("../../assets/animations/level-complete.json")}
            autoPlay
            loop={false}
            style={styles.lottieAnimation}
          />
          <Text style={styles.gameCompleteText}>Level Complete!</Text>
          <Text style={styles.gameCompleteText}>Score: {score}</Text>
          <TouchableOpacity
            style={styles.nextLevelButton}
            onPress={onNextLevel}
          >
            <Text style={styles.nextLevelButtonText}>Next Level</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  animationContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  lottieAnimation: {
    width: 250,
    height: 250,
  },
  gameCompleteText: {
    color: "#ffffffff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  nextLevelButton: {
    marginTop: 15,
    backgroundColor: "#8B5CF6",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextLevelButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
});