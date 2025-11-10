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
  // Simple +/- logic per requirements
  const delta = {
    p1: { [p1]: +25, [p2]: -25 },
    p2: { [p1]: -25, [p2]: +25 },
    tie: { [p1]: +10, [p2]: +10 },
    withdraw_p1: { [p1]: -10, [p2]: +10 },
    withdraw_p2: { [p1]: +10, [p2]: -10 },
  }[outcome];

  for (const [uid, d] of Object.entries(delta)) {
    await supabase.rpc("apply_ranking_delta", { p_user_id: uid, p_delta: d });
  }
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
