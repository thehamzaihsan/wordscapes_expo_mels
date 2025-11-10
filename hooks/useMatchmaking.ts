import {
  attemptMatch,
  dequeueForMatch,
  enqueueForMatch,
} from "@/lib/matchmaking";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";

interface UseMatchmakingOptions {
  userId: string | null;
  maxWaitMs?: number; // default 120000 (2 min)
  baseRange?: number; // default 50
}

export function useMatchmaking({
  userId,
  maxWaitMs = 120000,
  baseRange = 50,
}: UseMatchmakingOptions) {
  const [waiting, setWaiting] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugCount, setDebugCount] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Estimated dynamic range widening logic for UI only.
  const range = baseRange + Math.floor(elapsedMs / 15000) * 10; // +10 every 15s

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const start = async () => {
      setWaiting(true);
      setElapsedMs(0);
      setError(null);
      // Fetch current ranking; fallback 200
      let ranking = 200;
      try {
        const { data } = await supabase
          .from("user_stats")
          .select("ranking_points")
          .eq("user_id", userId)
          .maybeSingle();
        if (data?.ranking_points != null) ranking = data.ranking_points;
      } catch {}
      // Fetch user level if available
      let level = 1;
      try {
        const { data: lvl } = await supabase
          .from("user_stats")
          .select("current_level, level")
          .eq("user_id", userId)
          .maybeSingle();
        if (lvl) {
          level = (lvl.current_level ?? lvl.level ?? 1) as number;
        }
      } catch {}

      const res = await enqueueForMatch(userId, ranking, level);
      if (!res.ok) {
        setError(res.message || "Failed to enter queue");
        setWaiting(false);
        return;
      }

      const startedAt = Date.now();
      intervalRef.current = setInterval(async () => {
        if (cancelled) return;
        const now = Date.now();
        setElapsedMs(now - startedAt);
        if (now - startedAt > maxWaitMs) {
          // Timeout
          await dequeueForMatch(userId);
          setWaiting(false);
          setError("No match found (timeout)");
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
        const found = await attemptMatch(userId);
        if (found.matchId) {
          setMatchId(found.matchId);
          setWaiting(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          // Fallback: check if a match was already created for me by the other player's attempt
          try {
            const { data: m } = await supabase
              .from("matches")
              .select("id,status")
              .or(`player1.eq.${userId},player2.eq.${userId}`)
              .in("status", ["active", "pending"])
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (m?.id) {
              setMatchId(m.id);
              setWaiting(false);
              if (intervalRef.current) clearInterval(intervalRef.current);
              return;
            }
          } catch {}
          if (found.message) {
            setError(found.message);
          }
        }

        // Debug: how many other users are in queue within current range?
        try {
          const { data: me } = await supabase
            .from("matchmaking_queue")
            .select("ranking_points")
            .eq("user_id", userId)
            .maybeSingle();
          if (me?.ranking_points != null) {
            const low = me.ranking_points - range;
            const high = me.ranking_points + range;
            const { count } = await supabase
              .from("matchmaking_queue")
              .select("user_id", { count: "exact", head: true })
              .neq("user_id", userId)
              .gte("ranking_points", low)
              .lte("ranking_points", high);
            setDebugCount(typeof count === "number" ? count : null);
          }
        } catch {}
      }, 3000);
    };

    start();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (waiting && userId) dequeueForMatch(userId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { waiting, elapsedMs, range, matchId, error, debugCount };
}
