import { useEffect, useState } from "react";

export const useMultiplayerGameLogic = (initialTime: number = 120) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [player1Words, setPlayer1Words] = useState<string[]>([]);
  const [player2Words, setPlayer2Words] = useState<string[]>([]);
  // Legacy placeholders retained for backward compatibility with screens that may still reference these.
  // We no longer modify them locally, so we drop the unused setters to silence lint errors.
  const [letters] = useState<string[]>(["p", "l", "a", "n", "e", "t"]); // Example letters (superseded by useMatchPuzzle in new flow)
  const [allValidWords] = useState<string[]>([
    "planet",
    "plan",
    "net",
    "ten",
    "pen",
    "eat",
    "tea",
    "ant",
  ]); // Example words
  const [gameActive, setGameActive] = useState(false);

  useEffect(() => {
    if (!gameActive) return;

    if (timeLeft === 0) {
      setGameActive(false);
      // Handle game over logic
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameActive]);

  const startGame = () => {
    setTimeLeft(initialTime);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setPlayer1Words([]);
    setPlayer2Words([]);
    setGameActive(true);
  };

  const stopGame = () => {
    setGameActive(false);
  };

  const handleWordSubmit = (word: string, player: 1 | 2) => {
    if (allValidWords.includes(word)) {
      if (player === 1) {
        if (!player1Words.includes(word) && !player2Words.includes(word)) {
          setPlayer1Words((prev) => [...prev, word]);
          setPlayer1Score((prev) => prev + word.length);
          return { success: true };
        }
      } else {
        // player === 2
        if (!player1Words.includes(word) && !player2Words.includes(word)) {
          setPlayer2Words((prev) => [...prev, word]);
          setPlayer2Score((prev) => prev + word.length);
          return { success: true };
        }
      }
    }
    return { success: false };
  };

  return {
    timeLeft,
    player1Score,
    player2Score,
    player1Words,
    player2Words,
    letters,
    allValidWords,
    gameActive,
    startGame,
    stopGame,
    handleWordSubmit,
  };
};
