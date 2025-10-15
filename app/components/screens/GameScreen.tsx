import { Difficulty } from "@/constants/difficulty";
import {
  completeLevelAndPersist,
  loadGuestProgress,
  type GuestProgressPayload,
} from "@/hooks/guest-progress";
import { updateGuestSnapshotFromProgress } from "@/lib/guestSnapshot";
import { Audio } from "expo-av";
import LottieView from "lottie-react-native";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LetterWheel from "../game/inputWheel";
import { useGameLogic } from "../game/useGameLogic";
import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";

interface GameScreenProps {
  onNavigate?: (screen: string) => void;
  difficulty?: Difficulty;
  baseWord?: string;
  levelTitle?: string;
  categoryName?: string;
  levelData?: {
    level: number;
    baseWord: string;
    letters: string[];
    crosswordWords: string[];
    difficulty: Difficulty;
  };
}

export default function GameScreen({
  onNavigate,
  difficulty = "medium",
  baseWord = "planet",
  levelTitle = "Planet",
  categoryName,
  levelData,
}: GameScreenProps) {
  const {
    // state
    gameGrid,
    letters,
    crosswordWords,
    allValidWords,
    foundCrosswordWords,
    foundBonusWords,
    loading,
    error,
    score,
    gameComplete,
    cellSize,
    hintsLeft,

    // refs
    // gameCompleteRef,

    // actions
    handleWordSubmit,
    handleWordHint,
    // handleNextLevel,
  } = useGameLogic({
    difficulty,
    baseWord,
    levelData,
    categoryName,
    onNavigate,
  });

  // Preload sounds
  const correctSoundRef = useRef<Audio.Sound | null>(null);
  const bonusSoundRef = useRef<Audio.Sound | null>(null);
  const wrongSoundRef = useRef<Audio.Sound | null>(null);
  const completeSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [correct, bonus, wrong, complete] = await Promise.all([
          Audio.Sound.createAsync(
            require("../../../assets/sounds/correct-word.mp3"),
            { volume: 0.7 }
          ),
          Audio.Sound.createAsync(
            require("../../../assets/sounds/bonus-word.mp3"),
            { volume: 0.7 }
          ),
          Audio.Sound.createAsync(
            require("../../../assets/sounds/wrong-word.mp3"),
            { volume: 0.6 }
          ),
          Audio.Sound.createAsync(
            require("../../../assets/sounds/level-complete.mp3"),
            { volume: 0.8 }
          ),
        ]);
        if (!mounted) return;
        correctSoundRef.current = correct.sound;
        bonusSoundRef.current = bonus.sound;
        wrongSoundRef.current = wrong.sound;
        completeSoundRef.current = complete.sound;
      } catch {}
    })();
    return () => {
      mounted = false;
      correctSoundRef.current?.unloadAsync();
      bonusSoundRef.current?.unloadAsync();
      wrongSoundRef.current?.unloadAsync();
      completeSoundRef.current?.unloadAsync();
    };
  }, []);

  // Persist completion exactly once per level clear
  const persistedRef = useRef(false);
  useEffect(() => {
    if (!gameComplete || persistedRef.current) return;
    persistedRef.current = true;
    (async () => {
      const levelNumber = levelData?.level || 1;
      const category = categoryName || "Mountain";
      const crosswordCount = crosswordWords.length;
      const bonusCount = foundBonusWords.length;
      console.info("[COMPLETE] Persisting rewards", {
        category,
        levelNumber,
        bonusWords: bonusCount,
        crosswordWords: crosswordCount,
      });

      const prev = await loadGuestProgress();
      const prevMeta = prev?.meta;
      const prevCompleted = prev?.categories?.[category]?.find(
        (l) => l.level === levelNumber
      )?.isCompleted;

      const updated: GuestProgressPayload | null =
        await completeLevelAndPersist({
          category,
          levelNumber,
          score,
          bonusWords: bonusCount,
          crosswordWords: crosswordCount,
          attempts: 1,
          levelDefs: undefined,
        }).catch((e) => {
          console.warn("[COMPLETE] failed to save guest progress", e);
          return null;
        });

      if (updated) {
        console.info("[COMPLETE] Saved guest progress", {
          gemsBefore: prevMeta?.gems,
          gemsAfter: updated.meta.gems,
          xpBefore: prevMeta?.xp,
          xpAfter: updated.meta.xp,
          wasFirstCompletion: !prevCompleted,
        });
        try {
          await updateGuestSnapshotFromProgress(updated);
        } catch {}
      }
    })();
  }, [
    gameComplete,
    levelData?.level,
    categoryName,
    crosswordWords.length,
    foundBonusWords.length,
    score,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onNavigate?.("levels")}
          style={styles.backButton}
        >
          <ChevronLeft size={16} color="#22C55E" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      {loading ? (
        <Text style={styles.infoText}>Loading…</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : !gameGrid ? (
        <Text style={styles.infoText}>No grid</Text>
      ) : (
        <>
          <View style={styles.gridContainer}>
            {gameGrid.map((row, r) => (
              <View key={r} style={styles.row}>
                {row.map((cell, c) => (
                  <View
                    key={`${r}-${c}`}
                    style={[
                      styles.cell,
                      { width: cellSize, height: cellSize },
                      cell.isActive
                        ? cell.isRevealed
                          ? styles.revealedCell
                          : styles.hiddenCell
                        : styles.emptyCell,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        { fontSize: cellSize * 0.5 },
                        cell.isRevealed
                          ? styles.revealedText
                          : styles.hiddenText,
                      ]}
                    >
                      {cell.isRevealed ? cell.letter : ""}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.wheel}>
            {letters.length ? (
              <LetterWheel
                letters={letters}
                onLetterSelect={() => {}}
                onWordComplete={async (w) => {
                  const result = await handleWordSubmit(w);
                  try {
                    if (result?.success) {
                      if (result.type === "crossword") {
                        await correctSoundRef.current?.replayAsync();
                      } else if (result.type === "bonus") {
                        await bonusSoundRef.current?.replayAsync();
                      }
                    } else {
                      await wrongSoundRef.current?.replayAsync();
                    }
                  } catch {}
                }}
                validWords={allValidWords}
                foundWords={[...foundCrosswordWords, ...foundBonusWords]}
                onHint={handleWordHint}
                hintsLeft={hintsLeft}
                canUsePaidHints={true}
              />
            ) : (
              <Text style={styles.infoText}>No letters</Text>
            )}
          </View>
        </>
      )}

      <Modal transparent visible={gameComplete} onRequestClose={() => {}}>
        <View style={styles.modalContainer}>
          <ThemedCard style={styles.modalCard} variant="glassStrong" padding="lg">
            <ThemedText >LEVEL COMPLETED</ThemedText>
            <LottieView
              source={require("../../../assets/animations/level-complete.json")}
              autoPlay
              loop={false}
              style={{ width: 200, height: 200 }}
            />
            {/* Play complete sound once when modal opens */}
            {gameComplete && (
              <View style={{ height: 0, width: 0 }}>
                {/* Trigger on open */}
                {(() => {
                  completeSoundRef.current?.replayAsync().catch(() => {});
                  return null;
                })()}
              </View>
            )}
            <ThemedButton
              variant="primary"
              title="Back to Levels"
              style={styles.nextButton}
              onPress={() => {
                onNavigate?.("levels");
              }}
            >
            </ThemedButton>
          </ThemedCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: "center" },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },
  backButtonText: { color: "#22C55E", fontWeight: "600" },
  score: { fontSize: 18, fontWeight: "bold", color: "#22C55E" },
  infoText: { color: "#6B7280" },
  errorText: { color: "red" },
  gridContainer: { marginTop: 8 },
  row: { flexDirection: "row" },
  cell: {
    margin: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    width: 40,
    height: 40,
  },
  emptyCell: { backgroundColor: "transparent" },
  hiddenCell: {
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  revealedCell: {
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#16A34A",
  },
  cellText: { fontWeight: "bold" },
  hiddenText: { color: "transparent" },
  revealedText: { color: "#fff" },
  wheel: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },
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
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  nextButton: {
    marginTop: 12,
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  nextButtonText: { color: "#fff", fontWeight: "bold" },
});
