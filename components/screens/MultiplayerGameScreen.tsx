import { useEffect, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import WordSpringsText from "@/components/common/WordSpringsText";
import ThemedButton from "@/components/ui/ThemedButton";
import Modal from "@/components/ui/ThemedModal";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { useMatchPuzzle } from "@/hooks/useMatchPuzzle";
import { useMultiplayerGameLogic } from "@/hooks/useMultiplayerGameLogic";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import {
  adjustRankingOnFinish,
  createMatch,
  finishMatch,
  getMatchPlayers,
} from "@/lib/matches";
import { dequeueForMatch } from "@/lib/matchmaking";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/lib/toast";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AdComponent from "../common/AdComponent";
import BackgroundImage from "../common/BackgroundImage";
import LoadingScreen from "../common/LoadingScreen";
import LetterWheel from "../game/inputWheel";

interface MultiplayerGameScreenProps {
  onNavigate?: (screen: string) => void;
  matchId: string | null;
}

export default function MultiplayerGameScreen({
  onNavigate,
  matchId,
}: MultiplayerGameScreenProps) {
  useWindowDimensions(); // currently unused but keeps responsive capability; placeholder
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { timeLeft, gameActive, startGame, stopGame } =
    useMultiplayerGameLogic();

  // Live match hooks
  const { session } = useSupabaseAuth();
  const playerId = session?.user?.id ?? null;
  const {
    letters: puzzleLetters,
    words: puzzleWords,
    ready: puzzleReady,
  } = useMatchPuzzle(matchId, playerId);
  const {
    wordsFound,
    opponentWords,
    submitWord,
    rematchCreatedId,
    status,
    lastReason,
  } = useLiveMatch({ matchId, playerId });
  useEffect(() => {
    if (rematchCreatedId) {
      onNavigate?.(`multiplayer-game?match=${rematchCreatedId}`);
    }
  }, [rematchCreatedId, onNavigate]);

  const [showWithdraw, setShowWithdraw] = useState(false as boolean);
  const [gameOver, setGameOver] = useState(false as boolean);
  const [resultText, setResultText] = useState<string>("");
  // withdrawing overlay no longer used; we navigate instantly on withdraw
  // const [withdrawing, setWithdrawing] = useState(false as boolean);
  const [rematchPending, setRematchPending] = useState(false as boolean);
  const [rematchDeclined, setRematchDeclined] = useState(false as boolean);
  const [initiatedWithdraw, setInitiatedWithdraw] = useState(false as boolean);
  const [endAck, setEndAck] = useState(false as boolean);
  const [leftName, setLeftName] = useState<string>("Player 1");
  const [rightName, setRightName] = useState<string>("Player 2");

  // Add a short synchronization delay once the puzzle is ready so both clients render letters/words together
  const [syncDelayDone, setSyncDelayDone] = useState(false);
  useEffect(() => {
    if (!puzzleReady) {
      setSyncDelayDone(false);
      return;
    }
    const t = setTimeout(() => setSyncDelayDone(true), 1200); // ~1.2s grace period
    return () => clearTimeout(t);
  }, [puzzleReady]);

  useEffect(() => {
    // Start timer only after puzzle is ready and grace period is complete and non-empty content exists
    if (
      puzzleReady &&
      syncDelayDone &&
      puzzleLetters.length &&
      puzzleWords.length
    ) {
      startGame();
      if (playerId) dequeueForMatch(playerId);
    }
  }, [
    startGame,
    playerId,
    puzzleReady,
    syncDelayDone,
    puzzleLetters.length,
    puzzleWords.length,
  ]);

  // Load human-readable names for both players
  useEffect(() => {
    const run = async () => {
      if (!matchId || !playerId) return;
      const players = await getMatchPlayers(matchId);
      if (!players) return;
      try {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,username")
          .in("id", [players.p1, players.p2]);
        const nameById: Record<string, string> = {};
        (profs || []).forEach((p: any) => {
          if (p?.id) nameById[p.id] = p.username || "Player";
        });
        const meLeft = playerId === players.p1; // assume left is p1 side
        const myName = nameById[playerId] || (meLeft ? "Player 1" : "Player 2");
        const oppId = playerId === players.p1 ? players.p2 : players.p1;
        const oppName = nameById[oppId] || (meLeft ? "Player 2" : "Player 1");
        if (meLeft) {
          setLeftName(myName);
          setRightName(oppName);
        } else {
          // If I'm p2, show me on left as well (consistent layout)
          setLeftName(myName);
          setRightName(oppName);
        }
      } catch {}
    };
    run();
  }, [matchId, playerId]);

  // End game if remote signals completion (e.g., withdraw)
  useEffect(() => {
    if (gameOver || initiatedWithdraw || endAck) return;
    if (status === "completed") {
      if (lastReason === "withdraw") {
        // Opponent withdrew (I did not initiate) -> victory
        setResultText("Opponent withdrew. You win!");
      } else {
        setResultText("Match finished");
      }
      setGameOver(true);
    }
  }, [status, lastReason, gameOver, initiatedWithdraw, endAck]);

  // Stop the local timer as soon as gameOver is set, or when we navigate away
  useEffect(() => {
    if (gameOver) stopGame();
  }, [gameOver, stopGame]);

  useEffect(() => {
    return () => {
      // Ensure intervals are cleared if the screen unmounts for any reason
      stopGame();
    };
  }, [stopGame]);

  // End game conditions: time up or all words found
  useEffect(() => {
    if (gameOver || endAck) return;
    // Guard: don't evaluate completion until puzzle loaded and has at least one word
    if (!puzzleReady || puzzleWords.length === 0) return;
    const totalFound = wordsFound.length + opponentWords.length;
    const allWordsCount = puzzleWords.length;
    if (timeLeft <= 0 || totalFound >= allWordsCount) {
      const my = wordsFound.length;
      const opp = opponentWords.length;
      if (my > opp) setResultText("You win! Congratulations");
      else if (my < opp) setResultText("You lose");
      else setResultText("It's a tie");
      setGameOver(true);
    }
  }, [
    timeLeft,
    wordsFound.length,
    opponentWords.length,
    puzzleWords.length,
    puzzleReady,
    gameOver,
    endAck,
  ]);
  // Apply ranking deltas and mark match finished when gameOver transitions
  useEffect(() => {
    const run = async () => {
      if (!gameOver || !matchId || !playerId) return;
      // If match ended due to withdraw (handled by initiator), do not re-apply ranking here
      if (lastReason === "withdraw") return;
      const players = await getMatchPlayers(matchId);
      if (!players) return;
      const myCount = wordsFound.length;
      const oppCount = opponentWords.length;
      let outcome: "p1" | "p2" | "tie" = "tie";
      if (myCount > oppCount) outcome = playerId === players.p1 ? "p1" : "p2";
      else if (myCount < oppCount)
        outcome = playerId === players.p1 ? "p2" : "p1";
      await adjustRankingOnFinish(matchId, players.p1, players.p2, outcome);
      const winId =
        outcome === "tie" ? null : outcome === "p1" ? players.p1 : players.p2;
      await finishMatch(
        matchId,
        winId,
        myCount === oppCount ? "tie" : "completed"
      );
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver, lastReason]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const onWordComplete = async (word: string) => {
    const w = (word || "").toUpperCase();
    // validate against synchronized puzzle and ensure uniqueness across both players
    if (!puzzleWords.includes(w)) return;
    if (wordsFound.includes(w) || opponentWords.includes(w)) return;
    await submitWord(w);
  };

  // While waiting for synchronized puzzle or the grace delay, show a loading screen
  // unless the match is already over — if gameOver is true we must render the
  // Game Over modal so the player sees win/lose/tie instead of the loading UI.
  if (
    !gameOver &&
    (!gameActive ||
      !puzzleReady ||
      !syncDelayDone ||
      !puzzleLetters.length ||
      !puzzleWords.length)
  ) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <BackgroundImage />
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <View style={styles.header}>
          <ThemedButton
            title="Back"
            variant="glass"
            size="sm"
            onPress={() => {
              setShowWithdraw(true);
            }}
          />
          <View style={styles.playerInfo}>
            <WordSpringsText style={styles.playerName}>
              {leftName}
            </WordSpringsText>
            <WordSpringsText style={styles.playerScore}>
              Words: {wordsFound.length}/{puzzleWords.length}
            </WordSpringsText>
          </View>
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
          <View style={styles.playerInfo}>
            <WordSpringsText style={styles.playerName}>
              {rightName}
            </WordSpringsText>
            <WordSpringsText style={styles.playerScore}>
              Words: {opponentWords.length}/{puzzleWords.length}
            </WordSpringsText>
          </View>
        </View>

        <View style={styles.wheelContainer}>
          <LetterWheel
            letters={puzzleLetters}
            onWordComplete={onWordComplete}
            validWords={puzzleWords}
            foundWords={[...wordsFound, ...opponentWords]}
            onNavigate={onNavigate}
          />
        </View>
        {/* Word lists */}
        <View style={styles.wordLists}>
          <View style={styles.wordColumn}>
            <Text style={styles.wordHeader}>
              Your Words ({wordsFound.length})
            </Text>
            <View style={styles.wordListBox}>
              {wordsFound.map((w) => (
                <Text key={w} style={styles.wordItem}>
                  {w}
                </Text>
              ))}
              {wordsFound.length === 0 && (
                <Text style={styles.wordEmpty}>None yet</Text>
              )}
            </View>
          </View>
          <View style={styles.wordColumn}>
            <Text style={styles.wordHeader}>
              Opponent ({opponentWords.length})
            </Text>
            <View style={styles.wordListBox}>
              {opponentWords.map((w) => (
                <Text key={w} style={styles.wordItem}>
                  {w}
                </Text>
              ))}
              {opponentWords.length === 0 && (
                <Text style={styles.wordEmpty}>None yet</Text>
              )}
            </View>
          </View>
        </View>

        <AdComponent />
      </View>
      {/* Withdraw confirm */}
      <Modal
        isVisible={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        title="Withdraw?"
        showCloseButton
      >
        <Text style={{ color: "white", marginBottom: 12 }}>
          Do you want to withdraw? You will lose 10 ranking points and your
          opponent gains 10.
        </Text>
        <ThemedButton
          title="Confirm Withdraw"
          variant="primary"
          onPress={async () => {
            if (!matchId || !playerId) return;
            setShowWithdraw(false);
            setInitiatedWithdraw(true);
            stopGame();
            // Navigate away immediately; don't show modal or wait on network
            if (onNavigate) onNavigate("multiplayer");
            else router.replace("/multiplayer");

            // Fire-and-forget server-side completion so opponent gets event
            const players = await getMatchPlayers(matchId);
            if (!players) return;
            const opp = playerId === players.p1 ? players.p2 : players.p1;
            const outcome =
              playerId === players.p1 ? "withdraw_p1" : "withdraw_p2";
            adjustRankingOnFinish(
              matchId,
              players.p1,
              players.p2,
              outcome as any
            ).catch(() => {});
            finishMatch(matchId, opp, "withdraw").catch(() => {});
          }}
        />
        <ThemedButton
          title="Cancel"
          variant="secondary"
          onPress={() => setShowWithdraw(false)}
        />
      </Modal>
      {/* withdrawing overlay removed since we navigate instantly */}
      {/* Game over modal */}
      <Modal
        isVisible={gameOver}
        onClose={async () => {
          setEndAck(true);
          setGameOver(false);
          if (playerId) await dequeueForMatch(playerId);
          stopGame();
        }}
        title="Match Finished"
        showCloseButton
      >
        <WordSpringsText style={{ fontSize: 24, textAlign: "center" }}>
          {resultText}
        </WordSpringsText>
        <View style={{ height: 12 }} />
        <ThemedButton
          title="Go back"
          variant="secondary"
          onPress={async () => {
            setEndAck(true);
            setGameOver(false);
            if (playerId) await dequeueForMatch(playerId);
            stopGame();
            onNavigate?.("multiplayer");
          }}
        />
        <View style={{ height: 8 }} />
        <ThemedButton
          title={rematchPending ? "Waiting for opponent..." : "Play again"}
          disabled={rematchPending}
          variant="primary"
          onPress={async () => {
            if (!matchId || !playerId) return;
            setRematchDeclined(false);
            setEndAck(true);
            setGameOver(false); // close popup immediately
            // Signal intent
            await supabase.from("match_events").insert({
              match_id: matchId,
              sender: playerId,
              event_type: "rematch_request",
              payload: {},
            });
            setRematchPending(true);
            setTimeout(() => {
              if (!rematchCreatedId) {
                setRematchPending(false);
                setRematchDeclined(true);
              }
            }, 10000);
            // Check if both requested; if so, smallest user id creates new match
            const { data: ev } = await supabase
              .from("match_events")
              .select("sender")
              .eq("match_id", matchId)
              .eq("event_type", "rematch_request");
            const unique = Array.from(
              new Set((ev || []).map((e: any) => e.sender))
            );
            if (unique.length >= 2) {
              const players = await getMatchPlayers(matchId);
              if (!players) return;
              const creator = [players.p1, players.p2].sort()[0];
              if (playerId === creator) {
                // Fetch latest ranking starts
                const { data: s } = await supabase
                  .from("user_stats")
                  .select("user_id,ranking_points")
                  .in("user_id", [players.p1, players.p2]);
                const byId: Record<string, number> = {};
                (s || []).forEach(
                  (row: any) => (byId[row.user_id] = row.ranking_points ?? 200)
                );
                const newId = await createMatch(
                  players.p1,
                  players.p2,
                  1,
                  byId[players.p1] ?? 200,
                  byId[players.p2] ?? 200
                );
                if (newId) {
                  await supabase.from("match_events").insert({
                    match_id: matchId,
                    sender: playerId,
                    event_type: "rematch_created",
                    payload: { match_id: newId },
                  });
                }
              }
            }
          }}
        />
        {rematchDeclined && (
          <Text style={{ color: "white", textAlign: "center", marginTop: 8 }}>
            Your opponent didn&apos;t accept a rematch.
          </Text>
        )}
        <View style={{ height: 8 }} />
        <ThemedButton
          title="Add friend"
          variant="glass"
          onPress={async () => {
            if (!matchId || !playerId) return;
            const players = await getMatchPlayers(matchId);
            if (!players) return;
            const opp = playerId === players.p1 ? players.p2 : players.p1;
            if (!opp) return;
            if (opp === playerId) return;
            // Check if relationship exists
            const { data: existing } = await supabase
              .from("friend_relationships")
              .select("id,status,requester,addressee")
              .or(
                `and(requester.eq.${playerId},addressee.eq.${opp}),and(requester.eq.${opp},addressee.eq.${playerId})`
              )
              .maybeSingle();
            if (existing) {
              if (existing.status === "accepted") {
                showToast("You're already friends", "info");
                return;
              }
              if (existing.status === "pending") {
                showToast("Friend request already pending", "info");
                return;
              }
            }
            const { error } = await supabase
              .from("friend_relationships")
              .insert({
                requester: playerId,
                addressee: opp,
                status: "pending",
              });
            if (error) showToast(error.message, "error");
            else showToast("Friend request sent", "success");
          }}
        />
        <View style={{ height: 8 }} />
        <ThemedButton
          title="Search new match"
          variant="ghost"
          onPress={async () => {
            if (playerId) await dequeueForMatch(playerId);
            setEndAck(true);
            setGameOver(false);
            onNavigate?.("matchfinding");
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    width: "100%",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  playerInfo: {
    alignItems: "center",
  },
  playerName: {
    fontSize: 30,

    color: "white",
  },
  playerScore: {
    fontSize: 22,
    color: "white",
  },
  timer: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
  },
  infoText: { color: "#6B7280" },
  wheelContainer: {
    flex: 2,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 110,
  },
  wordLists: {
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 24,
  },
  wordColumn: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    padding: 12,
  },
  wordHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 6,
  },
  wordListBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  wordItem: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    color: "white",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  wordEmpty: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
});
