import levels from "@/constants/levels.json";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";

type Puzzle = {
  letters: string[];
  words: string[];
  category?: string;
  level?: number;
  baseWord?: string;
};

function pickRandomPuzzle(): Puzzle {
  // levels is an object: { Category: [ { level, letters, crosswordWords, baseWord }, ... ] }
  const categories = Object.keys(levels as any);
  const cat = categories[Math.floor(Math.random() * categories.length)];
  const arr = (levels as any)[cat] as any[];
  const entry = arr[Math.floor(Math.random() * arr.length)];
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
    category: cat,
    level: entry.level,
    baseWord: (entry.baseWord || "").toUpperCase(),
  };
}

export function useMatchPuzzle(
  matchId: string | null,
  playerId: string | null
) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [ready, setReady] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    const load = async () => {
      // 1) Check for an existing puzzle_seed event
      const { data: ev } = await supabase
        .from("match_events")
        .select("payload")
        .eq("match_id", matchId)
        .eq("event_type", "puzzle_seed")
        .order("created_at", { ascending: true });
      const latest = ev && ev.length ? ev[ev.length - 1] : null;
      if (latest?.payload?.letters && latest?.payload?.words) {
        if (!cancelled) setPuzzle(latest.payload as Puzzle);
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
            const seed = pickRandomPuzzle();
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
  };
}
