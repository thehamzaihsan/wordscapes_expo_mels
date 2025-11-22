import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { captureRef } from "react-native-view-shot";

import ThemedButton from "@/components/ui/ThemedButton";
import Card from "@/components/ui/ThemedCard";
import Modal from "@/components/ui/ThemedModal";
import ThemedText from "@/components/ui/ThemedText";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { useMatchPuzzle } from "@/hooks/useMatchPuzzle";
import { useMultiplayerGameLogic } from "@/hooks/useMultiplayerGameLogic";
import { useSettings } from "@/hooks/useSettings";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Theme, useTheme } from "@/hooks/useTheme";
import {
    adjustRankingOnFinish,
    finishMatch,
    getMatchPlayers
} from "@/lib/matches";
import { dequeueForMatch } from "@/lib/matchmaking";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { AlertTriangle, ArrowLeft, Award, Clock, Frown, Handshake, Share2, Trophy, User, XCircle, Zap } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AdComponent from "../common/AdComponent";
import BackgroundImage from "../common/BackgroundImage";
import LoadingScreen from "../common/LoadingScreen";
import MultiplayerWheel from "../game/MultiplayerWheel";
import MultiplayerWheelGesture from "../game/MultiplayerWheelGesture";

interface MultiplayerGameScreenProps {
  onNavigate?: (screen: string) => void;
  matchId: string | null;
}

export default function MultiplayerGameScreen({
  onNavigate,
  matchId,
}: MultiplayerGameScreenProps) {
  useWindowDimensions(); // Keep for responsive capability
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Live match hooks
  const { session, loading: authLoading } = useSupabaseAuth();
  const playerId = session?.user?.id ?? null;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session?.user?.id) {
      router.replace("/multiplayer-hub");
    }
  }, [authLoading, session, router]);

  // Redirect if no matchId
  useEffect(() => {
    if (!authLoading && session?.user?.id && !matchId) {
      router.replace("/multiplayer-hub");
    }
  }, [authLoading, session, matchId, router]);

  const {
    letters: puzzleLetters,
    words: puzzleWords,
    ready: puzzleReady,
    timeLimit,
    startTime,
  } = useMatchPuzzle(matchId, playerId);
  
  const { timeLeft, gameActive, startGame, stopGame } =
    useMultiplayerGameLogic(timeLimit, startTime);

  const { settings } = useSettings();
  const useGestureWheel = settings.useGestureWheel ?? true;

  const {
    wordsFound,
    opponentWords,
    submitWord,
    rematchCreatedId,
    status,
    lastReason,
  } = useLiveMatch({ matchId, playerId });
  
  const [showWithdraw, setShowWithdraw] = useState(false as boolean);
  const [gameOver, setGameOver] = useState(false as boolean);
  const [resultText, setResultText] = useState<string>("");
  // withdrawing overlay no longer used; we navigate instantly on withdraw
  // const [withdrawing, setWithdrawing] = useState(false as boolean);
  const [rematchPending, setRematchPending] = useState(false as boolean);
  const [rematchDeclined, setRematchDeclined] = useState(false as boolean);
  const [initiatedWithdraw, setInitiatedWithdraw] = useState(false as boolean);
  const [endAck, setEndAck] = useState(false as boolean);
  const [wordFeedback, setWordFeedback] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({ show: false, message: '', type: 'success' });
  
  const gameOverModalRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  
  useEffect(() => {
    if (rematchCreatedId) {
      onNavigate?.(`multiplayer-game?match=${rematchCreatedId}`);
    }
  }, [rematchCreatedId, onNavigate]);

  // Intercept browser back button and reload to show withdraw confirmation
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (gameOver) return; // Don't intercept if game is already over

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      setShowWithdraw(true);
    };

    // Push a state to intercept back button
    window.history.pushState(null, '', window.location.href);
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [gameOver]);
  
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackScale = useRef(new Animated.Value(0.8)).current;

  // Animate feedback in/out
  useEffect(() => {
    if (wordFeedback.show) {
      Animated.parallel([
        Animated.timing(feedbackOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(feedbackScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(feedbackOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(feedbackScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [wordFeedback.show, feedbackOpacity, feedbackScale]);
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
    if (gameOver) {
      stopGame();
      setShowWithdraw(false); // Close withdraw modal when game ends
    }
  }, [gameOver, stopGame]);

  useEffect(() => {
    return () => {
      // Ensure intervals are cleared if the screen unmounts for any reason
      stopGame();
    };
  }, [stopGame]);

  // End game conditions: time up only (no word limit)
  useEffect(() => {
    if (gameOver || endAck) return;
    // Guard: don't evaluate completion until puzzle loaded
    if (!puzzleReady) return;
    
    // Game ends only when time runs out
    if (timeLeft <= 0) {
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
    
    // Check if word is valid
    if (!puzzleWords.includes(w)) {
      setWordFeedback({
        show: true,
        message: '❌ Invalid word',
        type: 'error'
      });
      setTimeout(() => setWordFeedback({ show: false, message: '', type: 'success' }), 2000);
      return;
    }
    
    // Check if already found by you
    if (wordsFound.includes(w)) {
      setWordFeedback({
        show: true,
        message: '⚠️ Already found by you',
        type: 'warning'
      });
      setTimeout(() => setWordFeedback({ show: false, message: '', type: 'success' }), 2000);
      return;
    }
    
    // Check if already found by opponent
    if (opponentWords.includes(w)) {
      setWordFeedback({
        show: true,
        message: '⚡ Opponent already found this',
        type: 'warning'
      });
      setTimeout(() => setWordFeedback({ show: false, message: '', type: 'success' }), 2000);
      return;
    }
    
    // Word is valid and new!
    setWordFeedback({
      show: true,
      message: `✅ ${w} +1`,
      type: 'success'
    });
    setTimeout(() => setWordFeedback({ show: false, message: '', type: 'success' }), 1500);
    
    await submitWord(w);
  };

  const handleShareResult = async () => {
    if (!gameOverModalRef.current) return;
    
    setIsSharing(true);
    try {
      const uri = await captureRef(gameOverModalRef, {
        format: 'png',
        quality: 1,
      });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your victory!',
        });
      } else {
        console.log('Sharing is not available on this platform');
      }
    } catch (error) {
      console.error('Error sharing result:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // While waiting for synchronized puzzle or the grace delay, show a loading screen
  // unless the match is already over — if gameOver is true we must render the
  // Game Over modal so the player sees win/lose/tie instead of the loading UI.
  // Show loading while checking auth or if no session
  if (authLoading || !session?.user?.id || !matchId) {
    return <LoadingScreen />;
  }

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
            alignSelf: "center",
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setShowWithdraw(true);
            }}
            style={styles.backButton}
          >
            <View style={styles.backButtonContent}>
              <ArrowLeft size={20} color={theme.colors.text} />
            </View>
          </TouchableOpacity>
          
          {/* Timer Card */}
          <Card variant="glassStrong" padding="md" style={styles.timerCard}>
            <Clock size={20} color={theme.colors.primary} />
            <ThemedText variant="h2" weight="bold" style={styles.timerText}>
              {formatTime(timeLeft)}
            </ThemedText>
          </Card>
        </View>

        {/* Players Info */}
        <View style={styles.playersContainer}>
          {/* Player 1 */}
          <Card variant="glassStrong" padding="md" style={styles.playerCard}>
            <View style={styles.playerGradient}>
              <View style={styles.playerHeader}>
                <User size={16} color={theme.colors.primary} />
                <ThemedText variant="body2" weight="semibold" numberOfLines={1}>
                  {leftName}
                </ThemedText>
              </View>
              <View style={styles.playerStats}>
                <Trophy size={14} color={theme.colors.warning} />
                <ThemedText variant="caption" color="textSecondary">
                  {wordsFound.length}/{puzzleWords.length}
                </ThemedText>
              </View>
            </View>
          </Card>

          {/* VS Divider */}
          <View style={styles.vsDivider}>
            <ThemedText variant="caption" weight="bold" style={{ color: theme.colors.primary }}>
              VS
            </ThemedText>
          </View>

          {/* Player 2 */}
          <Card variant="glassStrong" padding="md" style={styles.playerCard}>
            <View style={styles.playerGradient}>
              <View style={styles.playerHeader}>
                <User size={16} color={theme.colors.text} />
                <ThemedText variant="body2" weight="semibold" numberOfLines={1}>
                  {rightName}
                </ThemedText>
              </View>
              <View style={styles.playerStats}>
                <Trophy size={14} color={theme.colors.textSecondary} />
                <ThemedText variant="caption" color="textSecondary">
                  {opponentWords.length}/{puzzleWords.length}
                </ThemedText>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.wheelContainer}>
          {useGestureWheel ? (
            <MultiplayerWheelGesture
              letters={puzzleLetters}
              onWordComplete={onWordComplete}
              validWords={puzzleWords}
              foundWords={[...wordsFound, ...opponentWords]}
              onNavigate={onNavigate}
            />
          ) : (
            <MultiplayerWheel
              letters={puzzleLetters}
              onWordComplete={onWordComplete}
              validWords={puzzleWords}
              foundWords={[...wordsFound, ...opponentWords]}
              onNavigate={onNavigate}
            />
          )}
          
          {/* Word Feedback Animation */}
          {wordFeedback.show && (
            <Animated.View style={[
              styles.wordFeedback,
              {
                opacity: feedbackOpacity,
                transform: [{ scale: feedbackScale }],
                backgroundColor: wordFeedback.type === 'success' 
                  ? theme.colors.success + 'E0'
                  : wordFeedback.type === 'error'
                  ? theme.colors.error + 'E0'
                  : theme.colors.warning + 'E0',
              }
            ]}>
              <ThemedText variant="body1" weight="bold" style={{ color: '#FFFFFF' }}>
                {wordFeedback.message}
              </ThemedText>
            </Animated.View>
          )}
        </View>

        {/* Word lists */}
        <View style={styles.wordLists}>
          {/* Your Words */}
          <View style={styles.wordColumn}>
            <Card variant="glassStrong" padding="md" style={styles.wordListCard}>
              <View style={styles.wordListHeader}>
                <Zap size={16} color={theme.colors.primary} />
                <ThemedText variant="body2" weight="bold">
                  Your Words ({wordsFound.length})
                </ThemedText>
              </View>
              <View style={styles.wordListBox}>
                {wordsFound.map((w) => (
                  <View key={w} style={[styles.wordChip, { backgroundColor: theme.colors.primary + '30' }]}>
                    <ThemedText variant="caption">{w}</ThemedText>
                  </View>
                ))}
                {wordsFound.length === 0 && (
                  <ThemedText variant="caption" color="textSecondary" style={[styles.wordEmpty, { marginTop: 0, paddingTop: 0 }]}>
                    No words yet
                  </ThemedText>
                )}
              </View>
            </Card>
          </View>

          {/* Opponent Words */}
          <View style={styles.wordColumn}>
            <Card variant="glassStrong" padding="md" style={styles.wordListCard}>
              <View style={styles.wordListHeader}>
                <Zap size={16} color={theme.colors.textSecondary} />
                <ThemedText variant="body2" weight="bold">
                  Opponent ({opponentWords.length})
                </ThemedText>
              </View>
              <View style={styles.wordListBox}>
                {opponentWords.map((w) => (
                  <View key={w} style={[styles.wordChip, { backgroundColor: theme.colors.surface + '60' }]}>
                    <ThemedText variant="caption">{w}</ThemedText>
                  </View>
                ))}
                {opponentWords.length === 0 && (
                  <ThemedText variant="caption" color="textSecondary" style={[styles.wordEmpty, { marginTop: 0, paddingTop: 0 }]}>
                    No words yet
                  </ThemedText>
                )}
              </View>
            </Card>
          </View>
        </View>

        <AdComponent />
      </View>
      {/* Withdraw confirm */}
      <Modal
        isVisible={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        title="Withdraw from Match?"
        showCloseButton
        backdrop="blur"
        size="small"
      >
        <View style={styles.withdrawModalContent}>
          {/* Warning Icon */}
          <View style={styles.withdrawIconContainer}>
            <AlertTriangle size={48} color={theme.colors.error} strokeWidth={2} />
          </View>
          
          {/* Warning Messages */}
          <View style={styles.withdrawWarningContent}>
            <View style={styles.withdrawWarningRow}>
              <XCircle size={20} color={theme.colors.error} />
              <ThemedText variant="body2" style={styles.withdrawWarningText}>
                You will lose 10 ranking points
              </ThemedText>
            </View>
            <View style={styles.withdrawWarningRow}>
              <Trophy size={20} color={theme.colors.success} />
              <ThemedText variant="body2" style={styles.withdrawWarningText}>
                Your opponent gains 10 points
              </ThemedText>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.withdrawButtonsContainer}>
            <ThemedButton
              title="Confirm Withdraw"
              variant="ghost"
              size="lg"
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
              fullWidth
            />
            <ThemedButton
              title="Continue Playing"
              variant="primary"
              size="lg"
              onPress={() => setShowWithdraw(false)}
              fullWidth
            />
          </View>
        </View>
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
          onNavigate?.("multiplayer");
        }}
        title=""
        showCloseButton
        backdrop="blur"
        size="medium"
        scrollable={true}
      >
        <View ref={gameOverModalRef} collapsable={false} style={styles.gameOverContent}>
          {/* Gradient Background Overlay */}
          <View style={[
            styles.gameOverGradient,
            (resultText.toLowerCase().includes("win") || resultText.toLowerCase().includes("victory")) && styles.gameOverGradientWin,
            resultText.toLowerCase().includes("lose") && styles.gameOverGradientLoss,
            (resultText.toLowerCase().includes("tie") || resultText.toLowerCase().includes("draw")) && styles.gameOverGradientTie,
          ]} />
          
          {/* Content Container */}
          <View style={styles.gameOverInnerContent}>
            {/* Result Icon and Title */}
            <View style={styles.gameOverHeader}>
              {(resultText.toLowerCase().includes("win") || resultText.toLowerCase().includes("victory")) && (
                <>
                  <View style={[styles.gameOverIconContainer, styles.gameOverIconWin]}>
                    <Award size={80} color="#FFD700" strokeWidth={2.5} />
                  </View>
                  <ThemedText variant="title" weight="bold" style={styles.gameOverTitleWin}>
                    🎉 VICTORY! 🎉
                  </ThemedText>
                  <ThemedText variant="body1" style={styles.gameOverSubtitle}>
                    You dominated the match!
                  </ThemedText>
                </>
              )}
              {resultText.toLowerCase().includes("lose") && (
                <>
                  <View style={[styles.gameOverIconContainer, styles.gameOverIconLoss]}>
                    <Frown size={80} color="#EF4444" strokeWidth={2.5} />
                  </View>
                  <ThemedText variant="title" weight="bold" style={styles.gameOverTitleLoss}>
                    DEFEAT
                  </ThemedText>
                  <ThemedText variant="body1" style={styles.gameOverSubtitle}>
                    Better luck next time!
                  </ThemedText>
                </>
              )}
              {(resultText.toLowerCase().includes("tie") || resultText.toLowerCase().includes("draw")) && (
                <>
                  <View style={[styles.gameOverIconContainer, styles.gameOverIconTie]}>
                    <Handshake size={80} color="#F59E0B" strokeWidth={2.5} />
                  </View>
                  <ThemedText variant="title" weight="bold" style={styles.gameOverTitleTie}>
                    DRAW
                  </ThemedText>
                  <ThemedText variant="body1" style={styles.gameOverSubtitle}>
                    Evenly matched!
                  </ThemedText>
                </>
              )}
            </View>

            {/* Stats Card */}
            <View style={styles.gameOverStatsCard}>
              <View style={styles.gameOverStatsRow}>
                <View style={styles.gameOverPlayerCard}>
                  <View style={styles.gameOverPlayerIconContainer}>
                    <User size={24} color={theme.colors.primary} />
                  </View>
                  <ThemedText variant="caption" style={styles.gameOverPlayerLabel}>
                    YOU
                  </ThemedText>
                  <ThemedText variant="body1" weight="medium" style={styles.gameOverPlayerNameText} numberOfLines={1}>
                    {leftName}
                  </ThemedText>
                  <View style={styles.gameOverScoreBadge}>
                    <ThemedText variant="title" weight="bold" style={styles.gameOverScoreText}>
                      {wordsFound.length}
                    </ThemedText>
                    <ThemedText variant="caption" style={styles.gameOverScoreLabel}>
                      WORDS
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.gameOverVsDivider}>
                  <ThemedText variant="subtitle" weight="bold" style={styles.gameOverVsText}>
                    VS
                  </ThemedText>
                </View>

                <View style={styles.gameOverPlayerCard}>
                  <View style={styles.gameOverPlayerIconContainer}>
                    <User size={24} color={theme.colors.error} />
                  </View>
                  <ThemedText variant="caption" style={styles.gameOverPlayerLabel}>
                    OPPONENT
                  </ThemedText>
                  <ThemedText variant="body1" weight="medium" style={styles.gameOverPlayerNameText} numberOfLines={1}>
                    {rightName}
                  </ThemedText>
                  <View style={styles.gameOverScoreBadge}>
                    <ThemedText variant="title" weight="bold" style={styles.gameOverScoreText}>
                      {opponentWords.length}
                    </ThemedText>
                    <ThemedText variant="caption" style={styles.gameOverScoreLabel}>
                      WORDS
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Branding Footer */}
            <View style={styles.gameOverBranding}>
              <Zap size={20} color={theme.colors.primary} fill={theme.colors.primary} />
              <ThemedText variant="body1" weight="bold" style={styles.gameOverBrandText}>
                Wordscapes Multiplayer
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Action Buttons Container - outside captured area */}
        <View style={{ gap: 12, marginTop: 16 }}>
          {/* Share Button */}
          <ThemedButton
            title={isSharing ? "Sharing..." : "Share Result"}
            variant="primary"
            size="lg"
            onPress={handleShareResult}
            fullWidth
            leftIcon={<Share2 size={20} color="#FFFFFF" />}
            disabled={isSharing}
            isLoading={isSharing}
          />

          {/* Back Button */}
          <ThemedButton
            title="Back to Hub"
            variant="secondary"
            size="lg"
            onPress={async () => {
              setEndAck(true);
              setGameOver(false);
              if (playerId) await dequeueForMatch(playerId);
              stopGame();
              onNavigate?.("multiplayer");
            }}
            fullWidth
          />
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    backgroundColor: theme.colors.surface + '40',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  backButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  timerText: {
    fontSize: 28,
  },
  playersContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  playerCard: {
    flex: 1,
    overflow: "hidden",
  },
  playerGradient: {
    padding: 12,
    gap: 8,
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  playerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  vsDivider: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  wheelContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 12,
    position: 'relative',
  },
  wordFeedback: {
    position: 'absolute',
    top: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  wordLists: {
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  wordColumn: {
    flex: 1,
  },
  wordListCard: {
    height: 80,
  },
  wordListHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  wordListBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  wordChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  wordEmpty: {
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  withdrawModalContent: {
    gap: 20,
    paddingVertical: 8,
  },
  withdrawIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  withdrawWarningContent: {
    gap: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  withdrawWarningRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  withdrawWarningText: {
    fontSize: 14,
    textAlign: "center",
  },
  withdrawButtonsContainer: {
    gap: 12,
    paddingTop: 8,
  },
  gameOverContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  gameOverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  gameOverGradientWin: {
    backgroundColor: '#FFD700',
  },
  gameOverGradientLoss: {
    backgroundColor: '#EF4444',
  },
  gameOverGradientTie: {
    backgroundColor: '#F59E0B',
  },
  gameOverInnerContent: {
    padding: 24,
    gap: 24,
    position: 'relative',
    zIndex: 1,
  },
  gameOverHeader: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    width: "100%",
  },
  gameOverIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gameOverIconWin: {
    backgroundColor: '#FFD70030',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  gameOverIconLoss: {
    backgroundColor: '#EF444430',
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  gameOverIconTie: {
    backgroundColor: '#F59E0B30',
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  gameOverTitleWin: {
    fontSize: 36,
    textAlign: "center",
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gameOverTitleLoss: {
    fontSize: 36,
    textAlign: "center",
    color: '#EF4444',
  },
  gameOverTitleTie: {
    fontSize: 36,
    textAlign: "center",
    color: '#F59E0B',
  },
  gameOverSubtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
    marginTop: -4,
  },
  gameOverStatsCard: {
    backgroundColor: theme.colors.surfaceVariant + '60',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline + '20',
  },
  gameOverStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  gameOverPlayerCard: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.outline + '30',
  },
  gameOverPlayerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  gameOverPlayerLabel: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    opacity: 0.6,
    textTransform: "uppercase",
  },
  gameOverPlayerNameText: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 100,
  },
  gameOverScoreBadge: {
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
  },
  gameOverScoreText: {
    fontSize: 40,
    color: theme.colors.primary,
    lineHeight: 40,
  },
  gameOverScoreLabel: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  gameOverVsDivider: {
    paddingHorizontal: 8,
  },
  gameOverVsText: {
    fontSize: 20,
    opacity: 0.4,
  },
  gameOverBranding: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline + '20',
  },
  gameOverBrandText: {
    fontSize: 14,
    opacity: 0.7,
  },
  gameOverTitle: {
    fontSize: 32,
    textAlign: "center",
    width: "100%",
  },
  gameOverPlayersContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  gameOverPlayerInfo: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.surfaceVariant + '40',
    padding: 16,
    borderRadius: theme.borderRadius.lg,
  },
  gameOverPlayerName: {
    fontSize: 14,
    textAlign: "center",
  },
  gameOverPlayerScore: {
    fontSize: 28,
    textAlign: "center",
  },
  gameOverScoreContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surfaceVariant + '40',
    borderRadius: theme.borderRadius.xl,
  },
  gameOverScoreSection: {
    alignItems: "center",
    gap: 8,
  },
  gameOverScore: {
    fontSize: 48,
  },
  gameOverVS: {
    paddingHorizontal: 16,
  },
});
