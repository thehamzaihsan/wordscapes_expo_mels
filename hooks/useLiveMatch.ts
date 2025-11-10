import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";

interface UseLiveMatchOptions {
  matchId: string | null;
  playerId: string | null;
}

interface MatchEvent {
  id: string;
  match_id: string;
  sender: string;
  event_type: string;
  payload: any;
  created_at: string;
}

export function useLiveMatch({ matchId, playerId }: UseLiveMatchOptions) {
  const [wordsFound, setWordsFound] = useState<string[]>([]);
  const [opponentWords, setOpponentWords] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("active");
  const [winner, setWinner] = useState<string | null>(null);
  const [rematchCreatedId, setRematchCreatedId] = useState<string | null>(null);
  const [lastReason, setLastReason] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!matchId) return;

    // Load existing events
    const load = async () => {
      const { data } = await supabase
        .from("match_events")
        .select("sender,event_type,payload,created_at,match_id")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      const self: string[] = [];
      const opp: string[] = [];
      data?.forEach((e: any) => {
        if (e.event_type === "word_found") {
          if (e.sender === playerId) self.push(e.payload.word);
          else opp.push(e.payload.word);
        }
        if (e.event_type === "match_end") {
          setStatus("completed");
          setWinner(e.payload?.winner ?? null);
          setLastReason(e.payload?.reason ?? "completed");
        }
      });
      setWordsFound(self);
      setOpponentWords(opp);
    };
    load();

    // Subscribe to realtime insert events
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_events",
          filter: `match_id=eq.${matchId}`,
        },
        (payload: any) => {
          const e: MatchEvent = payload.new as MatchEvent;
          if (e.event_type === "word_found") {
            if (e.sender === playerId) {
              setWordsFound((prev) =>
                prev.includes(e.payload.word) ? prev : [...prev, e.payload.word]
              );
            } else {
              setOpponentWords((prev) =>
                prev.includes(e.payload.word) ? prev : [...prev, e.payload.word]
              );
            }
          } else if (e.event_type === "match_end") {
            setStatus("completed");
            setWinner(e.payload?.winner ?? null);
            setLastReason(e.payload?.reason ?? "completed");
          } else if (e.event_type === "withdraw") {
            setStatus("completed");
            setWinner(e.payload?.winner ?? null);
            setLastReason("withdraw");
          } else if (e.event_type === "rematch_created") {
            setRematchCreatedId(e.payload?.match_id ?? null);
          }
        }
      )
      .subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [matchId, playerId]);

  const submitWord = async (word: string) => {
    if (!matchId || !playerId) return false;
    // Insert word_found event; rely on client-side validation for now
    const { error } = await supabase.from("match_events").insert({
      match_id: matchId,
      sender: playerId,
      event_type: "word_found",
      payload: { word },
    });
    return !error;
  };

  return {
    wordsFound,
    opponentWords,
    status,
    winner,
    submitWord,
    rematchCreatedId,
    lastReason,
  };
}
