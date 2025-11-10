import { getUserMatchRecord, MatchRecord } from "@/lib/stats";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

/**
 * React hook to get a user's match record (wins/losses/draws/ranking) and keep it
 * updated in real-time when user_stats changes.
 */
export function useMatchRecord(userId: string | null) {
  const [record, setRecord] = useState<MatchRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(!!userId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setRecord(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const r = await getUserMatchRecord(userId);
        if (!cancelled) setRecord(r);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load record");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    // Subscribe to changes on the user_stats row to update reactively
    const channel = supabase
      .channel(`user_stats_record_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_stats",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          try {
            const r = await getUserMatchRecord(userId);
            setRecord(r);
          } catch {}
        }
      )
      .subscribe();
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [userId]);

  return { record, loading, error };
}
