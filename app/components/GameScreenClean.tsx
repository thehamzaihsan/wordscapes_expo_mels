import LetterWheel from "./inputWheel";
import { Difficulty } from "@/constants/difficulty";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useGameLogic } from "./useGameLogic";
import { useSoundSettings } from "./useSoundSettings";
import { useSoundManager } from "./GameSoundManager";
import GameHeader from "./GameHeader";
import GameGrid from "./GameGrid";
import GameCompletionModal from "./GameCompletionModal";
import LetterAnimations from "./LetterAnimations";

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
  // Custom hooks for separated concerns
  const gameLogic = useGameLogic({
    difficulty,
    baseWord,
    levelData,
    categoryName,
    onNavigate,
  });

  const { sound, handleSoundToggle } = useSoundSettings();
  const { playSound } = useSoundManager({ soundEnabled: sound });

  // Handle navigation back
  const handleBack = () => {
    if (onNavigate) {
      onNavigate("levels");
    }
  };

  // Handle word submission with sound effects
  const handleWordSubmit = async (word: string) => {
    const result = await gameLogic.handleWordSubmit(word);
    
    if (result.success) {
      if (result.type === 'crossword') {
        await playSound('rightWordSound');
      } else if (result.type === 'bonus') {
        await playSound('bonusWordSound');
      }
      
      if (gameLogic.gameComplete) {
        await playSound('levelCompleteSound');
      }
    } else if (result.type === 'invalid') {
      await playSound('wrongWordSound');
    }
    
    return result;
  };

  // Loading state
  if (gameLogic.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  // Error state
  if (gameLogic.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{gameLogic.error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} ref={gameLogic.containerRef}>
      <GameHeader
        levelTitle={levelTitle}
        categoryName={categoryName}
        score={gameLogic.score}
        scoreScaleAnim={gameLogic.scoreScaleAnim}
        sound={sound}
        onSoundToggle={handleSoundToggle}
        onBack={handleBack}
      />

      <GameGrid
        gameGrid={gameLogic.gameGrid}
        cellSize={gameLogic.cellSize}
        hintAnim={gameLogic.hintAnim}
        gridCellRefs={gameLogic.gridCellRefs}
      />

      <View style={styles.wheelSection}>
        <LetterWheel
          ref={gameLogic.letterWheelRef}
          letters={gameLogic.letters}
          onWordSubmit={handleWordSubmit}
          onWordHint={gameLogic.handleWordHint}
          foundCrosswordWords={gameLogic.foundCrosswordWords}
          foundBonusWords={gameLogic.foundBonusWords}
          allValidWords={gameLogic.allValidWords}
          crosswordWords={gameLogic.crosswordWords}
          hintsLeft={gameLogic.hintsLeft}
          gridCellRefs={gameLogic.gridCellRefs}
          onLetterAnimation={(animatingLetters) => {
            gameLogic.setAnimatingLetters(animatingLetters);
          }}
        />
      </View>

      <LetterAnimations animatingLetters={gameLogic.animatingLetters} />

      <GameCompletionModal
        visible={gameLogic.gameComplete}
        score={gameLogic.score}
        onNextLevel={gameLogic.handleNextLevel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    position: "relative",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  loadingText: {
    marginTop: 10,
    color: "#AAA",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginVertical: 10,
    textAlign: "center",
  },
  wheelSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    minHeight: 200,
  },
});