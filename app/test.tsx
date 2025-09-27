import { generateCrossword } from "@/hooks/crossword-gen";
import {
    filterWordsList,
    generateCrosswordLevel,
    getRandomWords,
} from "@/hooks/game-manager";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

/**
 * Configuration for each difficulty level
 */
interface DifficultyConfig {
  min: number;
  max: number;
  minWords: number;
  popularityRange: number;
}

/**
 * Mapping of difficulty levels to their configurations
 */
const difficultyMap: Record<Difficulty, DifficultyConfig> = {
  easy: { min: 3, max: 6, minWords: 6, popularityRange: 5000 },
  medium: { min: 4, max: 7, minWords: 6, popularityRange: 10000 },
  hard: { min: 5, max: 8, minWords: 7, popularityRange: 15000 },
  expert: { min: 5, max: 9, minWords: 8, popularityRange: 25000 },
};

export default function TestScreen() {
  const [grid, setGrid] = useState<string[][] | null>(null);
  const [baseWord, setBaseWord] = useState("");
  const [letters, setLetters] = useState([]);
  const [crosswordWords, setCrosswordWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const diff = difficultyMap.expert;
  const init = useCallback(() => {
    setLoading(true);
    setError("");

    let success = false;
    let attempts = 0;
    let newGrid: string[][] | null = null;

    while (!success && attempts < 5) {
      const { baseWord, letters, crosswordWords } = generateCrosswordLevel({
        difficulty: "expert",
      });
      const fl_words = filterWordsList(crosswordWords, {
        minLength: diff.min,
        maxLength: diff.max,
      });
      const words = getRandomWords(fl_words, diff.minWords);

      newGrid = generateCrossword(words);

      if (newGrid) {
        setBaseWord(baseWord);
        setLetters(letters);
        setCrosswordWords(crosswordWords);
        setGrid(newGrid);
        success = true;
      }
      attempts++;
    }

    if (!success) {
      setGrid(null);
      setError("Failed to generate crossword after multiple attempts.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6600" />
        <Text style={{ marginTop: 10, color: "#444" }}>
          Generating crossword...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {grid ? (
        <>
          {/* Crossword Grid */}
          <View style={styles.grid}>
            {grid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cell, colIndex) => (
                  <View key={colIndex} style={styles.cell}>
                    <Text style={styles.cellText}>{cell ?? ""}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Game Data */}
          <View style={styles.info}>
            <Text style={styles.infoText}>Base Word: {baseWord}</Text>
            <Text style={styles.infoText}>Letters: {letters}</Text>
            <Text style={styles.infoText}>
              Crossword Words: {crosswordWords.join(", ")}
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Regenerate Button */}
      <TouchableOpacity style={styles.button} onPress={init}>
        <Text style={styles.buttonText}>🔄 Regenerate Crossword</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  grid: {
    marginBottom: 20,
    padding: 5,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  cellText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  info: {
    marginTop: 20,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    marginVertical: 4,
    color: "#444",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginVertical: 10,
    textAlign: "center",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#ff6600",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
