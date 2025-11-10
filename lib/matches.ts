import { supabase } from "@/lib/supabase";

export async function createMatch(
  p1: string,
  p2: string,
  level: number,
  p1Rank: number,
  p2Rank: number
) {
  const { data, error } = await supabase
    .from("matches")
    .insert({
      player1: p1,
      player2: p2,
      status: "active",
      level,
      player1_ranking_start: p1Rank,
      player2_ranking_start: p2Rank,
    })
    .select("id")
    .maybeSingle();
  if (error) return null;
  return data?.id ?? null;
}

export async function finishMatch(
  matchId: string,
  winnerId: string | null,
  reason: "win" | "tie" | "withdraw" | "timeout" | "completed"
) {
  // Update match status and push a match_end event
  await supabase
    .from("matches")
    .update({ status: "completed" })
    .eq("id", matchId);
  await supabase.from("match_events").insert({
    match_id: matchId,
    sender: winnerId,
    event_type: reason === "withdraw" ? "withdraw" : "match_end",
    payload: { reason, winner: winnerId },
  });
}

export async function adjustRankingOnFinish(
  matchId: string,
  p1: string,
  p2: string,
  outcome: "p1" | "p2" | "tie" | "withdraw_p1" | "withdraw_p2"
) {
  // Prevent duplicate application by recording an event (best-effort)
  try {
    const { data: existing } = await supabase
      .from("match_events")
      .select("id")
      .eq("match_id", matchId)
      .eq("event_type", "ranking_applied");
    if (existing && existing.length > 0) return; // already applied
  } catch {}

  // Simple +/- logic per requirements
  const delta = {
    p1: { [p1]: +25, [p2]: -25 },
    p2: { [p1]: -25, [p2]: +25 },
    tie: { [p1]: +10, [p2]: +10 },
    withdraw_p1: { [p1]: -10, [p2]: +10 },
    withdraw_p2: { [p1]: +10, [p2]: -10 },
  }[outcome];

  const applyDelta = async (userId: string, d: number) => {
    // Try server-side RPC first (if available)
    try {
      const { error } = await supabase.rpc("apply_ranking_delta", {
        p_user_id: userId,
        p_delta: d,
      });
      if (!error) return;
    } catch {}
    // Fallback: client-side read-modify-write with default 200
    let cur = 200;
    try {
      const { data: row } = await supabase
        .from("user_stats")
        .select("ranking_points")
        .eq("user_id", userId)
        .maybeSingle();
      if (row && typeof (row as any).ranking_points === "number") {
        cur = (row as any).ranking_points as number;
      }
    } catch {}
    const next = cur + d;
    try {
      const { error: upErr } = await supabase
        .from("user_stats")
        .upsert(
          { user_id: userId, ranking_points: next },
          { onConflict: "user_id" }
        );
      if (upErr) {
        // last resort: attempt update
        await supabase
          .from("user_stats")
          .update({ ranking_points: next })
          .eq("user_id", userId);
      }
    } catch {}
  };

  for (const [uid, d] of Object.entries(delta)) {
    await applyDelta(uid, d as number);
  }

  // Record applied event so we don't double-apply next time
  try {
    await supabase.from("match_events").insert({
      match_id: matchId,
      sender: p1, // arbitrary; not used
      event_type: "ranking_applied",
      payload: { outcome, delta },
    });
  } catch {}
}

export async function getMatchPlayers(
  matchId: string
): Promise<{ p1: string; p2: string } | null> {
  const { data, error } = await supabase
    .from("matches")
    .select("player1,player2")
    .eq("id", matchId)
    .maybeSingle();
  if (error || !data) return null;
  return { p1: data.player1 as string, p2: data.player2 as string };
}
