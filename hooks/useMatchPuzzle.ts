import levels from "@/constants/levels.json";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";

type Puzzle = {
  letters: string[];
  words: string[];
  category?: string;
  level?: number;
  baseWord?: string;
  timeLimit?: number; // in seconds
  startTime?: string; // ISO timestamp when puzzle was created
};

// Calculate difficulty level based on average player ranking
function getDifficultyFromRanking(avgRanking: number): {
  minLevel: number;
  maxLevel: number;
  timeLimit: number;
} {
  // Ranking ranges and corresponding difficulty
  // 0-499: Beginner (levels 1-20, 180s)
  // 500-999: Intermediate (levels 21-40, 150s)
  // 1000-1499: Advanced (levels 41-60, 120s)
  // 1500-1999: Expert (levels 61-80, 90s)
  // 2000+: Master (levels 81-100, 75s)
  
  if (avgRanking < 500) {
    return { minLevel: 1, maxLevel: 20, timeLimit: 180 };
  } else if (avgRanking < 1000) {
    return { minLevel: 21, maxLevel: 40, timeLimit: 150 };
  } else if (avgRanking < 1500) {
    return { minLevel: 41, maxLevel: 60, timeLimit: 120 };
  } else if (avgRanking < 2000) {
    return { minLevel: 61, maxLevel: 80, timeLimit: 90 };
  } else {
    return { minLevel: 81, maxLevel: 100, timeLimit: 75 };
  }
}

function pickPuzzleByRanking(avgRanking: number): Puzzle {
  const { minLevel, maxLevel, timeLimit } = getDifficultyFromRanking(avgRanking);
  
  // levels is an object: { Category: [ { level, letters, crosswordWords, baseWord }, ... ] }
  const categories = Object.keys(levels as any);
  const validPuzzles: any[] = [];
  
  // Collect all puzzles within the level range with sufficient letters and words for multiplayer
  categories.forEach((cat) => {
    const arr = (levels as any)[cat] as any[];
    arr.forEach((entry) => {
      const letterCount = (entry.letters || []).length;
      const wordCount = (entry.crosswordWords || []).length;
      
      // For multiplayer: require at least 6 letters and more than 20 words for competitive gameplay
      if (entry.level >= minLevel && entry.level <= maxLevel && 
          letterCount >= 6 && wordCount > 20) {
        validPuzzles.push({ ...entry, category: cat });
      }
    });
  });
  
  // Pick random from valid puzzles
  const entry = validPuzzles.length > 0
    ? validPuzzles[Math.floor(Math.random() * validPuzzles.length)]
    : pickRandomPuzzle(); // fallback to old method if no valid puzzles
  
  const letters: string[] = (entry.letters || []).map((c: string) =>
    (c || "").toUpperCase()
  );
  const words: string[] = (entry.crosswordWords || [])
    .filter((w: string) => typeof w === "string")
    .map((w: string) => w.toUpperCase());
  
  // Ensure uniqueness
  const uniqWords = Array.from(new Set(words));
  
  // Shuffle letters to prevent pattern memorization from previous runs of same level
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  
  return {
    letters,
    words: uniqWords,
    category: entry.category,
    level: entry.level,
    baseWord: (entry.baseWord || "").toUpperCase(),
    timeLimit,
  };
}

function pickRandomPuzzle(): Puzzle {
  // levels is an object: { Category: [ { level, letters, crosswordWords, baseWord }, ... ] }
  const categories = Object.keys(levels as any);
  const validPuzzles: any[] = [];
  
  // Collect all puzzles with at least 6 letters and more than 20 words
  categories.forEach((cat) => {
    const arr = (levels as any)[cat] as any[];
    arr.forEach((entry) => {
      const letterCount = (entry.letters || []).length;
      const wordCount = (entry.crosswordWords || []).length;
      
      if (letterCount >= 6 && wordCount > 20) {
        validPuzzles.push({ ...entry, category: cat });
      }
    });
  });
  
  // Pick random from valid puzzles, or fall back to any puzzle if none meet criteria
  const entry = validPuzzles.length > 0
    ? validPuzzles[Math.floor(Math.random() * validPuzzles.length)]
    : (() => {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const arr = (levels as any)[cat] as any[];
        return { ...arr[Math.floor(Math.random() * arr.length)], category: cat };
      })();
  
  const letters: string[] = (entry.letters || []).map((c: string) =>
    (c || "").toUpperCase()
  );
  const words: string[] = (entry.crosswordWords || [])
    .filter((w: string) => typeof w === "string")
    .map((w: string) => w.toUpperCase());
  // Ensure uniqueness
  const uniqWords = Array.from(new Set(words));
  return {
    letters,
    words: uniqWords,
    category: entry.category,
    level: entry.level,
    baseWord: (entry.baseWord || "").toUpperCase(),
    timeLimit: 120, // default 2 minutes
  };
}

export function useMatchPuzzle(
  matchId: string | null,
  playerId: string | null
) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [ready, setReady] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    const load = async () => {
      // 1) Check for an existing puzzle_seed event
      const { data: ev } = await supabase
        .from("match_events")
        .select("payload,created_at")
        .eq("match_id", matchId)
        .eq("event_type", "puzzle_seed")
        .order("created_at", { ascending: true });
      const latest = ev && ev.length ? ev[ev.length - 1] : null;
      if (latest?.payload?.letters && latest?.payload?.words) {
        if (!cancelled) setPuzzle(latest.payload as Puzzle);
        if (!cancelled) setStartTime(latest.created_at);
        if (!cancelled) setReady(true);
      } else {
        // 2) If no puzzle yet, only one side should create it (smallest user id)
        try {
          const { data: m } = await supabase
            .from("matches")
            .select("player1,player2")
            .eq("id", matchId)
            .maybeSingle();
          const p1 = m?.player1 as string | undefined;
          const p2 = m?.player2 as string | undefined;
          const creator = [p1, p2].filter(Boolean).sort()[0];
          if (creator && playerId && creator === playerId) {
            // Fetch player rankings to determine difficulty
            const { data: stats } = await supabase
              .from("user_stats")
              .select("user_id,ranking_points")
              .in("user_id", [p1, p2].filter(Boolean));
            
            let avgRanking = 200; // default starting ranking
            if (stats && stats.length > 0) {
              const totalRanking = stats.reduce(
                (sum, s) => sum + (s.ranking_points || 200),
                0
              );
              avgRanking = Math.floor(totalRanking / stats.length);
            }
            
            // Generate puzzle based on ranking
            const seed = pickPuzzleByRanking(avgRanking);
            await supabase.from("match_events").insert({
              match_id: matchId,
              sender: playerId,
              event_type: "puzzle_seed",
              payload: seed,
            });
            setPuzzle(seed);
          }
        } catch {}
      }
      if (!cancelled) setReady(true);
    };
    load();

    const ch = supabase
      .channel(`puzzle-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_events",
          filter: `match_id=eq.${matchId}`,
        },
        (payload: any) => {
          const e = payload.new;
          if (
            e?.event_type === "puzzle_seed" &&
            e?.payload?.letters &&
            e?.payload?.words
          ) {
            setPuzzle(e.payload as Puzzle);
            setStartTime(e.created_at);
          }
        }
      )
      .subscribe();
    channelRef.current = ch;
    return () => {
      try {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
      } catch {}
      cancelled = true;
    };
  }, [matchId, playerId]);

  return {
    letters: puzzle?.letters ?? [],
    words: puzzle?.words ?? [],
    ready,
    timeLimit: puzzle?.timeLimit ?? 120, // return time limit
    startTime, // return when the game started
  };
}
