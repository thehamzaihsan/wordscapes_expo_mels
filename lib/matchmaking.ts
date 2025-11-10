import { supabase } from "@/lib/supabase";

// Client-side helpers that expect corresponding SQL RPC functions to exist.
// If RPC is missing they fail gracefully.

export async function enqueueForMatch(
  userId: string,
  ranking: number,
  level: number
): Promise<{ ok: boolean; message?: string }> {
  try {
    const { error } = await supabase.from("matchmaking_queue").upsert(
      {
        user_id: userId,
        ranking_points: ranking,
        level,
      },
      { onConflict: "user_id" }
    );
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message || "Unknown error" };
  }
}

export async function dequeueForMatch(userId: string) {
  try {
    await supabase.from("matchmaking_queue").delete().eq("user_id", userId);
  } catch {}
}

// Poll server-side attempt_match RPC (to avoid race conditions). Returns match_id if found.
export async function attemptMatch(
  userId: string
): Promise<{ matchId: string | null; message?: string }> {
  try {
    const { data, error } = await supabase.rpc("attempt_match", {
      p_user_id: userId,
    });
    if (error) return { matchId: null, message: error.message };
    return { matchId: data?.match_id || null };
  } catch (e: any) {
    return { matchId: null, message: e?.message || "Unknown error" };
  }
}
