import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, Volume2, VolumeX } from 'lucide-react-native';

interface GameHeaderProps {
  levelTitle: string;
  categoryName?: string;
  score: number;
  scoreScaleAnim: Animated.Value;
  sound: boolean;
  onSoundToggle: () => void;
  onBack: () => void;
}

export default function GameHeader({
  levelTitle,
  categoryName,
  score,
  scoreScaleAnim,
  sound,
  onSoundToggle,
  onBack,
}: GameHeaderProps) {
  return (
    <View style={styles.levelHeader}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <ChevronLeft size={20} color="white" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.levelTitleContainer}>
        <Text style={styles.levelTitle}>{levelTitle}</Text>
        {categoryName && (
          <Text style={styles.categoryText}>{categoryName}</Text>
        )}
      </View>

      <View style={styles.scoreContainer}>
        <Animated.Text
          style={[
            styles.scoreText,
            {
              transform: [{ scale: scoreScaleAnim }],
            },
          ]}
        >
          {score}
        </Animated.Text>
        <TouchableOpacity
          style={styles.soundToggleButton}
          onPress={onSoundToggle}
        >
          {sound ? (
            <Volume2 size={20} color="white" />
          ) : (
            <VolumeX size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  levelHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flex: 0,
    width: "100%",
  },
  levelTitleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  categoryText: {
    fontSize: 14,
    color: "#AAA",
    textAlign: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00ff33ff",
    textAlign: "center",
  },
  soundToggleButton: {
    padding: 8,
    backgroundColor: "rgba(55,65,81,0.8)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    paddingEnd: 16,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});