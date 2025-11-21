import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { ChevronLeft, Volume2, VolumeX } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

import { Difficulty } from "@/constants/difficulty";
import { useSettings } from "@/hooks/useSettings";
import AdComponent from "../common/AdComponent";
import LetterWheel from "../game/inputWheel";
import LetterWheelGesture from "../game/InputWheelGesture";
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
  const { width } = useWindowDimensions();
  const isBigScreen = width >= 768;
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  
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
    globalHints,

    // refs
    // gameCompleteRef,

    // actions
    handleWordSubmit,
    handleWordHint,
    revealWordCells,
    nextLevel,
    // handleNextLevel,
  } = useGameLogic({
    difficulty,
    baseWord,
    levelData,
    categoryName,
    onNavigate,
  });

  // Update modal visibility when gameComplete changes
  useEffect(() => {
    setModalVisible(gameComplete);
  }, [gameComplete]);

  const { settings, updateSetting } = useSettings();
  const soundEnabled = settings.soundEnabled;
  const animationsEnabled = settings.animationsEnabled;
  const useGestureWheel = settings.useGestureWheel ?? true; // Default to true for gesture wheel

  const toggleSound = useCallback(() => {
    updateSetting("soundEnabled", !soundEnabled);
  }, [soundEnabled, updateSetting]);

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
            require("../../assets/sounds/correct-word.mp3"),
            { volume: 0.7 }
          ),
          Audio.Sound.createAsync(
            require("../../assets/sounds/bonus-word.mp3"),
            { volume: 0.7 }
          ),
          Audio.Sound.createAsync(
            require("../../assets/sounds/wrong-word.mp3"),
            { volume: 0.6 }
          ),
          Audio.Sound.createAsync(
            require("../../assets/sounds/level-complete.mp3"),
            { volume: 0.8 }
          ),
        ]);
        if (!mounted) return;
        correctSoundRef.current = correct.sound;
        bonusSoundRef.current = bonus.sound;
        wrongSoundRef.current = wrong.sound;
        completeSoundRef.current = complete.sound;
      } catch (error) {
        console.error("Failed to load sounds", error);
      }
    })();
    return () => {
      mounted = false;
      correctSoundRef.current?.unloadAsync();
      bonusSoundRef.current?.unloadAsync();
      wrongSoundRef.current?.unloadAsync();
      completeSoundRef.current?.unloadAsync();
    };
  }, []);

  // --- Flying letter animation setup ---
  type AnimatingLetter = {
    id: string;
    letter: string;
    position: Animated.ValueXY;
  };
  const [animatingLetters, setAnimatingLetters] = useState<AnimatingLetter[]>(
    []
  );
  const gridCellRefs = useRef<Record<string, View | null>>({});
  const letterWheelRef = useRef<View>(null);
  const containerRef = useRef<View>(null);

  const measure = (ref: View) =>
    new Promise<{ px: number; py: number; width: number; height: number }>(
      (resolve) => {
        ref.measure((x, y, width, height, px, py) =>
          resolve({ px, py, width, height })
        );
      }
    );

  const startFloatingAnimation = useCallback(
    (word: string) =>
      new Promise<void>(async (resolve) => {
        // If animations are disabled, skip the animation
        if (!animationsEnabled) {
          resolve();
          return;
        }

        if (!containerRef.current || !letterWheelRef.current) {
          resolve();
          return;
        }
        const containerBox = await measure(containerRef.current);
        const wheelBox = await measure(letterWheelRef.current);
        const startX = wheelBox.px + wheelBox.width / 2 - containerBox.px;
        const startY = wheelBox.py + wheelBox.height / 2 - containerBox.py;

        const upper = word.toUpperCase();
        const targets: { r: number; c: number }[] = [];
        if (gameGrid && gameGrid.length) {
          const rows = gameGrid.length;
          const cols = gameGrid[0].length;
          // Horizontal scan first
          outer: for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols - upper.length; c++) {
              let ok = true;
              for (let i = 0; i < upper.length; i++) {
                const cell = gameGrid[r][c + i];
                if (!cell?.isActive || cell.letter !== upper[i]) {
                  ok = false;
                  break;
                }
              }
              if (ok) {
                for (let i = 0; i < upper.length; i++)
                  targets.push({ r, c: c + i });
                break outer;
              }
            }
          }
          // If not found horizontally, try vertical
          if (targets.length === 0) {
            outer2: for (let r = 0; r <= rows - upper.length; r++) {
              for (let c = 0; c < cols; c++) {
                let ok = true;
                for (let i = 0; i < upper.length; i++) {
                  const cell = gameGrid[r + i][c];
                  if (!cell?.isActive || cell.letter !== upper[i]) {
                    ok = false;
                    break;
                  }
                }
                if (ok) {
                  for (let i = 0; i < upper.length; i++)
                    targets.push({ r: r + i, c });
                  break outer2;
                }
              }
            }
          }
        }

        if (targets.length === 0) {
          resolve();
          return;
        }

        const letters: AnimatingLetter[] = [];
        const animations: Animated.CompositeAnimation[] = [];
        for (let i = 0; i < upper.length; i++) {
          const t = targets[i];
          const key = `${t.r}-${t.c}`;
          const cellRef = gridCellRefs.current[key];
          if (!cellRef) continue;
          const cellBox = await measure(cellRef);
          const endX = cellBox.px - containerBox.px;
          const endY = cellBox.py - containerBox.py;
          const item: AnimatingLetter = {
            id: `${upper}-${i}`,
            letter: upper[i],
            position: new Animated.ValueXY({ x: startX, y: startY }),
          };
          letters.push(item);
          animations.push(
            Animated.timing(item.position, {
              toValue: { x: endX, y: endY },
              duration: 550,
              useNativeDriver: false,
            })
          );
        }
        if (!letters.length) {
          resolve();
          return;
        }
        setAnimatingLetters(letters);
        Animated.stagger(90, animations).start(() => {
          setAnimatingLetters([]);
          resolve();
        });
      }),
    [gameGrid, animationsEnabled]
  );

  // Persistence of completion is handled inside useGameLogic to avoid double-deduction and race conditions

  return (
    <View style={styles.container} ref={containerRef}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onNavigate?.("levels")}
          style={styles.backButton}
        >
          <ChevronLeft size={16} color="#22C55E" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.levelTitle}>{levelTitle}</Text>

        <View style={styles.headerRight}>
          {/* <Text style={styles.score}>Score: {score}</Text> */}
          <TouchableOpacity onPress={toggleSound} style={styles.soundToggle}>
            {soundEnabled ? (
              <Volume2 size={18} color="#111827" />
            ) : (
              <VolumeX size={18} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <Text style={styles.infoText}>Loading…</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : !gameGrid ? (
        <Text style={styles.infoText}>No grid</Text>
      ) : (
        <View
          style={[
            styles.wrapper,
            { flexDirection: isBigScreen ? "row" : "column" },
          ]}
        >
          {/* Floating letters overlay */}
          {animatingLetters.length > 0 && (
            <View
              style={[
                StyleSheet.absoluteFill,
                { zIndex: 1000, elevation: 1000 },
              ]}
              pointerEvents="none"
            >
              {animatingLetters.map((it) => (
                <Animated.View
                  key={it.id}
                  style={[
                    styles.cell,
                    styles.revealedCell,
                    {
                      position: "absolute",
                      width: cellSize,
                      height: cellSize,
                      zIndex: 1001,
                      elevation: 1001,
                      transform: it.position.getTranslateTransform(),
                    },
                  ]}
                >
                  <Text
                    style={[styles.revealedText, { fontSize: cellSize * 0.5 }]}
                  >
                    {it.letter}
                  </Text>
                </Animated.View>
              ))}
            </View>
          )}
          <View style={styles.gridContainer}>
            {gameGrid.map((row, r) => (
              <View key={r} style={styles.row}>
                {row.map((cell, c) => (
                  <View
                    key={`${r}-${c}`}
                    ref={(el) => {
                      if (el) gridCellRefs.current[`${r}-${c}`] = el;
                    }}
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

          <View style={styles.wheel} ref={letterWheelRef} collapsable={false}>
            {letters.length ? (
              useGestureWheel ? (
                <LetterWheelGesture
                  letters={letters}
                  onLetterSelect={() => {}}
                  onWordComplete={async (w) => {
                    const result = await handleWordSubmit(w, {
                      deferReveal: true,
                    });
                    try {
                      if (result?.success) {
                        if (result.type === "crossword") {
                          if (soundEnabled)
                            await correctSoundRef.current?.replayAsync();
                          // Fire floating animation toward target cells
                          await startFloatingAnimation(w);
                          revealWordCells(w);
                        } else if (result.type === "bonus") {
                          if (soundEnabled)
                            await bonusSoundRef.current?.replayAsync();
                        }
                      } else {
                        if (soundEnabled)
                          await wrongSoundRef.current?.replayAsync();
                      }
                    } catch {}
                  }}
                  validWords={allValidWords}
                  foundWords={[...foundCrosswordWords, ...foundBonusWords]}
                  crosswordWords={crosswordWords}
                  onHint={handleWordHint}
                  hintsLeft={globalHints}
                  canUsePaidHints={false}
                  onNavigate={onNavigate}
                />
              ) : (
                <LetterWheel
                  letters={letters}
                  onLetterSelect={() => {}}
                  onWordComplete={async (w) => {
                    const result = await handleWordSubmit(w, {
                      deferReveal: true,
                    });
                    try {
                      if (result?.success) {
                        if (result.type === "crossword") {
                          if (soundEnabled)
                            await correctSoundRef.current?.replayAsync();
                          // Fire floating animation toward target cells
                          await startFloatingAnimation(w);
                          revealWordCells(w);
                        } else if (result.type === "bonus") {
                          if (soundEnabled)
                            await bonusSoundRef.current?.replayAsync();
                        }
                      } else {
                        if (soundEnabled)
                          await wrongSoundRef.current?.replayAsync();
                      }
                    } catch {}
                  }}
                  validWords={allValidWords}
                  foundWords={[...foundCrosswordWords, ...foundBonusWords]}
                  crosswordWords={crosswordWords}
                  onHint={handleWordHint}
                  hintsLeft={globalHints}
                  canUsePaidHints={false}
                  onNavigate={onNavigate}
                />
              )
            ) : (
              <Text style={styles.infoText}>No letters</Text>
            )}
          </View>
        </View>
      )}

      <AdComponent />

      <Modal transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <ThemedCard
            style={styles.modalCard}
            variant="glassStrong"
            padding="lg"
          >
            <ThemedText>LEVEL COMPLETED</ThemedText>
            {animationsEnabled && (
              <LottieView
                source={require("../../assets/animations/level-complete.json")}
                autoPlay
                loop={false}
                style={{ width: 200, height: 200 }}
              />
            )}
            {!animationsEnabled && (
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
            {/* Play complete sound once when modal opens */}
            {gameComplete && (
              <View style={{ height: 0, width: 0 }}>
                {/* Trigger on open */}
                {(() => {
                  if (soundEnabled)
                    completeSoundRef.current?.replayAsync().catch(() => {});
                  return null;
                })()}
              </View>
            )}
            <ThemedButton
              variant="primary"
              title={nextLevel ? "Next Level" : "Back to Levels"}
              style={styles.nextButton}
              onPress={() => {
                setModalVisible(false);
                if (nextLevel) {
                  router.push({
                    pathname: "/game",
                    params: {
                      levelNumber: nextLevel.level,
                      baseWord: nextLevel.baseWord,
                      difficulty: nextLevel.difficulty,
                      categoryName: categoryName,
                      levelTitle: `Level ${nextLevel.level}`,
                      levelDataJSON: JSON.stringify(nextLevel)
                    }
                  });
                } else {
                  onNavigate?.("levels");
                }
              }}
            ></ThemedButton>
          </ThemedCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    // ...(Platform.OS === "web"
    //   ? { maxWidth: 1600, alignSelf: "center" as const }
    //   : {}),
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  soundToggle: {
    marginLeft: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
  },
  infoText: { color: "#6B7280" },
  errorText: { color: "red" },
  gridContainer: {
    marginTop: 8,
    flex: 1 / 2,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  row: { flexDirection: "row" },
  wrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    alignContent: "space-between",
  },
  cell: {
    margin: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    width: 100,
    height: 100,
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
    flex: 1 / 2,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    height: "100%",
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
  levelTitle: {
    fontFamily: "Pacifico",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#f9f9f9ff",
    fontSize: 26,
    fontWeight: "bold",
    textTransform: "uppercase",
    zIndex: -1, // Ensures the title is behind the buttons and doesn't block presses
  },
});
