import {
  StyleSheet,
  Text,
  View
} from "react-native";

export default function GameScreen(){
  return (
    <View style={styles.container}>
      <Text>hello</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121213",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a3c",
  },
  backButton: {
    flex: 1,
  },
  backButtonText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 2,
    alignItems: "center",
  },
  levelText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  scoreText: {
    color: "#F59E0B",
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  timerText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  crosswordContainer: {
    flex: 1,
    paddingTop: 20,
  },
  crosswordScrollContent: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  crosswordGrid: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  crosswordRow: {
    flexDirection: "row",
  },
  crosswordCell: {
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCrosswordCell: {
    backgroundColor: "#f0f0f0",
  },
  activeCrosswordCell: {
    backgroundColor: "#ffffff",
  },
  foundCrosswordCell: {
    backgroundColor: "#8B5CF6",
  },
  crosswordCellText: {
    color: "#333",
    fontSize: 12,
    fontWeight: "bold",
  },
  foundCellText: {
    color: "#ffffff",
  },
  bottomSection: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#3a3a3c",
  },
  circleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  currentWordBubble: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
    minWidth: 140,
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  currentWordBubbleText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  letterCircle: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#3a3a3c",
  },
  circleLetter: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#A78BFA",
  },
  selectedCircleLetter: {
    backgroundColor: "#F59E0B",
    borderColor: "#FBBF24",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.6,
  },
  letterTouchArea: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  circleLetterText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedCircleLetterText: {
    color: "#000000",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: "#3a3a3c",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#555",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButton: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
  },
  secondaryButton: {
    backgroundColor: "#8B5CF6",
    borderColor: "#7C3AED",
  },
  disabledButton: {
    backgroundColor: "#555",
    borderColor: "#444",
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  progressContainer: {
    alignItems: "center",
    paddingTop: 10,
  },
  progressText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

