import { useEffect, useState } from "react";

export const useMultiplayerGameLogic = (
  initialTime: number = 120,
  gameStartTime?: string | null
) => {
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

  // Calculate time left based on server start time
  useEffect(() => {
    if (!gameActive || !gameStartTime) return;

    const calculateTimeLeft = () => {
      const startMs = new Date(gameStartTime).getTime();
      const nowMs = Date.now();
      const elapsedSeconds = Math.floor((nowMs - startMs) / 1000);
      const remaining = Math.max(0, initialTime - elapsedSeconds);
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        setGameActive(false);
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [gameActive, gameStartTime, initialTime]);

  const startGame = () => {
    // Don't reset timeLeft here if we have a server start time
    // Time will be calculated from gameStartTime
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
