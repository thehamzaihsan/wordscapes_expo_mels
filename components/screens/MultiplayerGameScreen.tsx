import { useEffect, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import WordSpringsText from "@/components/common/WordSpringsText";
import ThemedButton from "@/components/ui/ThemedButton";
import Modal from "@/components/ui/ThemedModal";
import { useLiveMatch } from "@/hooks/useLiveMatch";
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

  const {
    timeLeft,
    // Keep local logic for validation/timer only
    letters,
    allValidWords,
    gameActive,
    startGame,
    handleWordSubmit,
  } = useMultiplayerGameLogic();

  // Live match hooks
  const { session } = useSupabaseAuth();
  const playerId = session?.user?.id ?? null;
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

  useEffect(() => {
    startGame();
    if (playerId) dequeueForMatch(playerId);
  }, [startGame, playerId]);

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

  // End game conditions: time up or all words found
  useEffect(() => {
    if (gameOver || endAck) return;
    if (
      timeLeft <= 0 ||
      wordsFound.length + opponentWords.length >= allValidWords.length
    ) {
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
    allValidWords.length,
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

  // For now, we'll assume player 1 is submitting words.
  // In a real scenario, you'd have a way to distinguish players.
  const onWordComplete = async (word: string) => {
    // local validation first
    const res = handleWordSubmit(word, 1);
    if (res?.success) {
      await submitWord(word);
    }
  };

  if (!gameActive) {
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
            onPress={() => setShowWithdraw(true)}
          />
          <View style={styles.playerInfo}>
            <WordSpringsText style={styles.playerName}>
              {leftName}
            </WordSpringsText>
            <WordSpringsText style={styles.playerScore}>
              Words: {wordsFound.length}/{allValidWords.length}
            </WordSpringsText>
          </View>
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
          <View style={styles.playerInfo}>
            <WordSpringsText style={styles.playerName}>
              {rightName}
            </WordSpringsText>
            <WordSpringsText style={styles.playerScore}>
              Words: {opponentWords.length}/{allValidWords.length}
            </WordSpringsText>
          </View>
        </View>

        <View style={styles.wheelContainer}>
          {letters.length ? (
            <LetterWheel
              letters={letters}
              onWordComplete={onWordComplete}
              validWords={allValidWords}
              foundWords={[...wordsFound, ...opponentWords]}
              onNavigate={onNavigate}
            />
          ) : (
            <Text style={styles.infoText}>No letters</Text>
          )}
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
});
