import { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";

import WordSpringsText from "@/components/common/WordSpringsText";
import { useMultiplayerGameLogic } from "@/hooks/useMultiplayerGameLogic";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AdComponent from "../common/AdComponent";
import BackgroundImage from "../common/BackgroundImage";
import LoadingScreen from "../common/LoadingScreen";
import LetterWheel from "../game/inputWheel";

interface MultiplayerGameScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function MultiplayerGameScreen({
  onNavigate,
}: MultiplayerGameScreenProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isBigScreen = width >= 768;

  const {
    timeLeft,
    player1Score,
    player2Score,
    player1Words,
    player2Words,
    letters,
    allValidWords,
    gameActive,
    startGame,
    handleWordSubmit,
  } = useMultiplayerGameLogic();

  useEffect(() => {
    startGame();
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // For now, we'll assume player 1 is submitting words.
  // In a real scenario, you'd have a way to distinguish players.
  const onWordComplete = (word: string) => {
    handleWordSubmit(word, 1);
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
          <View style={styles.playerInfo}>
            <WordSpringsText style={styles.playerName}>Player 1</WordSpringsText>
            <WordSpringsText style={styles.playerScore}>Words: {player1Words.length}/{allValidWords.length}</WordSpringsText>
          </View>
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
          <View style={styles.playerInfo}>
            <WordSpringsText style={styles.playerName}>Player 2</WordSpringsText>
            <WordSpringsText style={styles.playerScore}>Words: {player2Words.length}/{allValidWords.length}</WordSpringsText>
          </View>
        </View>

        <View style={styles.wheelContainer}>
          {letters.length ? (
            <LetterWheel
              letters={letters}
              onWordComplete={onWordComplete}
              validWords={allValidWords}
              foundWords={[...player1Words, ...player2Words]}
              onNavigate={onNavigate}
            />
          ) : (
            <Text style={styles.infoText}>No letters</Text>
          )}
        </View>

        <AdComponent />
      </View>
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
    width: '100%',
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
    alignItems: 'center',
  },
  playerName: {
    fontSize: 30,
   
    color: 'white',
  },
  playerScore: {
    fontSize: 22,
    color: 'white',
  },
  timer: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  infoText: { color: "#6B7280" },
  wheelContainer: {
    flex: 2,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 110
  },
});
