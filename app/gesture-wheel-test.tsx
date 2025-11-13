import BackgroundImage from "@/components/common/BackgroundImage";
import GestureInputWheel from "@/components/game/GestureInputWheelSimple";
import ThemedButton from "@/components/ui/ThemedButton";
import ThemedCard from "@/components/ui/ThemedCard";
import ThemedText from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { showToast } from "@/lib/toast";
import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function GestureWheelTestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  // Test data
  const testLetters = ["C", "A", "T", "S", "R", "E", "D"];
  const validWords = [
    "cat",
    "cats",
    "car",
    "cars",
    "care",
    "cares",
    "cast",
    "caste",
    "rat",
    "rats",
    "rate",
    "rates",
    "scar",
    "scared",
    "star",
    "stare",
    "stared",
    "trade",
    "red",
    "rest",
    "ted",
    "test",
    "eat",
    "eats",
    "seat",
    "set",
    "date",
    "dates",
    "dear",
    "read",
    "dare",
    "dares",
  ];

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [attemptedWords, setAttemptedWords] = useState<
    { word: string; valid: boolean; timestamp: number }[]
  >([]);
  const [score, setScore] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(3);

  const handleWordComplete = (word: string) => {
    const lowerWord = word.toLowerCase();
    
    // Check if already found
    if (foundWords.includes(lowerWord)) {
      showToast("Already found!", "info");
      setAttemptedWords((prev) => [
        { word: lowerWord, valid: false, timestamp: Date.now() },
        ...prev.slice(0, 9),
      ]);
      return;
    }

    // Check if valid
    const isValid = validWords.includes(lowerWord);
    
    if (isValid) {
      setFoundWords((prev) => [...prev, lowerWord]);
      setScore((prev) => prev + lowerWord.length * 10);
      showToast(`+${lowerWord.length * 10} points!`, "success");
      setAttemptedWords((prev) => [
        { word: lowerWord, valid: true, timestamp: Date.now() },
        ...prev.slice(0, 9),
      ]);
    } else {
      showToast("Not a valid word", "error");
      setAttemptedWords((prev) => [
        { word: lowerWord, valid: false, timestamp: Date.now() },
        ...prev.slice(0, 9),
      ]);
    }
  };

  const handleHint = async (word: string): Promise<boolean> => {
    if (hintsLeft <= 0) {
      return false;
    }
    setHintsLeft((prev) => prev - 1);
    return true;
  };

  const resetGame = () => {
    setFoundWords([]);
    setAttemptedWords([]);
    setScore(0);
    setHintsLeft(3);
    showToast("Game reset!", "info");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingTop: insets.top + 20,
      paddingBottom: insets.bottom + 20,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      gap: 12,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceVariant + "40",
      justifyContent: "center",
      alignItems: "center",
    },
    headerTextContainer: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "white",
    },
    subtitle: {
      fontSize: 14,
      color: "white",
      opacity: 0.8,
    },
    statsContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      alignItems: "center",
      padding: 16,
    },
    statLabel: {
      fontSize: 12,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "bold",
    },
    wheelCard: {
      padding: 20,
      marginBottom: 20,
      alignItems: "center",
    },
    progressCard: {
      padding: 16,
      marginBottom: 20,
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    progressTitle: {
      fontSize: 16,
      fontWeight: "600",
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.colors.success,
    },
    attemptsCard: {
      padding: 16,
      marginBottom: 20,
    },
    attemptsTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
    },
    attemptsList: {
      gap: 8,
    },
    attemptItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 8,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 8,
      gap: 8,
    },
    attemptWord: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
    },
    foundWordsCard: {
      padding: 16,
      marginBottom: 20,
    },
    foundWordsTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
    },
    foundWordsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    foundWordChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.success + "20",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.success,
    },
    foundWordText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.success,
      textTransform: "uppercase",
    },
    emptyText: {
      textAlign: "center",
      fontSize: 14,
      opacity: 0.6,
    },
    instructionsCard: {
      padding: 16,
      marginBottom: 20,
    },
    instructionsTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
    },
    instructionItem: {
      marginBottom: 12,
    },
    instructionLabel: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 4,
    },
    instructionText: {
      fontSize: 13,
      opacity: 0.8,
      lineHeight: 18,
    },
  });

  const progress = (foundWords.length / validWords.length) * 100;

  return (
    <View style={styles.container}>
      <BackgroundImage />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedButton
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
            leftIcon={<ArrowLeft size={20} color="white" />}
            style={styles.backButton}
          />
          <View style={styles.headerTextContainer}>
            <ThemedText style={styles.title}>Gesture Wheel Test</ThemedText>
            <ThemedText style={styles.subtitle}>
              Swipe to form words
            </ThemedText>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <ThemedCard variant="glassStrong" style={styles.statCard}>
            <ThemedText color="textSecondary" style={styles.statLabel}>
              Score
            </ThemedText>
            <ThemedText style={styles.statValue}>{score}</ThemedText>
          </ThemedCard>
          <ThemedCard variant="glassStrong" style={styles.statCard}>
            <ThemedText color="textSecondary" style={styles.statLabel}>
              Found
            </ThemedText>
            <ThemedText style={styles.statValue}>
              {foundWords.length}/{validWords.length}
            </ThemedText>
          </ThemedCard>
          <ThemedCard variant="glassStrong" style={styles.statCard}>
            <ThemedText color="textSecondary" style={styles.statLabel}>
              Hints
            </ThemedText>
            <ThemedText style={styles.statValue}>{hintsLeft}</ThemedText>
          </ThemedCard>
        </View>

        {/* Progress */}
        <ThemedCard variant="glassStrong" style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <ThemedText style={styles.progressTitle}>Progress</ThemedText>
            <ThemedText color="textSecondary">
              {Math.round(progress)}%
            </ThemedText>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </ThemedCard>

        {/* Instructions */}
        <ThemedCard variant="glassStrong" style={styles.instructionsCard}>
          <ThemedText style={styles.instructionsTitle}>
            How to Play
          </ThemedText>
          <View style={styles.instructionItem}>
            <ThemedText style={styles.instructionLabel}>
              🔤 Swipe/Drag
            </ThemedText>
            <ThemedText style={styles.instructionText}>
              Touch and hold the first letter, then drag through the other
              letters to spell a word. Keep your finger on the screen.
            </ThemedText>
          </View>
          <View style={styles.instructionItem}>
            <ThemedText style={styles.instructionLabel}>
              ✋ Lift/Release
            </ThemedText>
            <ThemedText style={styles.instructionText}>
              Lift your finger to submit the word. It will be checked
              automatically.
            </ThemedText>
          </View>
          <View style={styles.instructionItem}>
            <ThemedText style={styles.instructionLabel}>
              👆 Tap Shuffle
            </ThemedText>
            <ThemedText style={styles.instructionText}>
              Tap the shuffle button (left) to rearrange letters or hint button
              (right) for help.
            </ThemedText>
          </View>
        </ThemedCard>

        {/* Gesture Wheel */}
        <ThemedCard variant="glassStrong" style={styles.wheelCard}>
          <GestureInputWheel
            letters={testLetters}
            onWordComplete={handleWordComplete}
            validWords={validWords}
            foundWords={foundWords}
            crosswordWords={validWords.slice(0, 5)}
            onHint={handleHint}
            hintsLeft={hintsLeft}
            canUsePaidHints={true}
          />
        </ThemedCard>

        {/* Recent Attempts */}
        <ThemedCard variant="glassStrong" style={styles.attemptsCard}>
          <ThemedText style={styles.attemptsTitle}>Recent Attempts</ThemedText>
          {attemptedWords.length > 0 ? (
            <View style={styles.attemptsList}>
              {attemptedWords.slice(0, 5).map((attempt, index) => (
                <View key={`${attempt.word}-${attempt.timestamp}`} style={styles.attemptItem}>
                  {attempt.valid ? (
                    <CheckCircle size={16} color={theme.colors.success} />
                  ) : (
                    <XCircle size={16} color={theme.colors.error} />
                  )}
                  <ThemedText
                    style={[
                      styles.attemptWord,
                      {
                        color: attempt.valid
                          ? theme.colors.success
                          : theme.colors.error,
                      },
                    ]}
                  >
                    {attempt.word.toUpperCase()}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>
              Start swiping to form words!
            </ThemedText>
          )}
        </ThemedCard>

        {/* Found Words */}
        <ThemedCard variant="glassStrong" style={styles.foundWordsCard}>
          <ThemedText style={styles.foundWordsTitle}>
            Found Words ({foundWords.length})
          </ThemedText>
          {foundWords.length > 0 ? (
            <View style={styles.foundWordsGrid}>
              {foundWords.map((word) => (
                <View key={word} style={styles.foundWordChip}>
                  <ThemedText style={styles.foundWordText}>{word}</ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>
              No words found yet
            </ThemedText>
          )}
        </ThemedCard>

        {/* Reset Button */}
        <ThemedButton
          variant="secondary"
          title="Reset Game"
          onPress={resetGame}
          fullWidth
        />
      </ScrollView>
    </View>
  );
}
