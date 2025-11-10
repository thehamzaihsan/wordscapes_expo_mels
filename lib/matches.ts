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

  // Ranking and W/L/D deltas per outcome
  const perUserAdjustments: Record<
    string,
    { ranking: number; wins: number; losses: number; draws: number }
  > = {
    [p1]: { ranking: 0, wins: 0, losses: 0, draws: 0 },
    [p2]: { ranking: 0, wins: 0, losses: 0, draws: 0 },
  };

  // Apply ranking deltas
  const rankingDelta = {
    p1: { [p1]: +25, [p2]: -25 },
    p2: { [p1]: -25, [p2]: +25 },
    tie: { [p1]: +10, [p2]: +10 },
    withdraw_p1: { [p1]: -10, [p2]: +10 },
    withdraw_p2: { [p1]: +10, [p2]: -10 },
  }[outcome];
  Object.entries(rankingDelta).forEach(([uid, d]) => {
    perUserAdjustments[uid].ranking += d as number;
  });

  // Apply W/L/D counters
  switch (outcome) {
    case "p1":
      perUserAdjustments[p1].wins += 1;
      perUserAdjustments[p2].losses += 1;
      break;
    case "p2":
      perUserAdjustments[p2].wins += 1;
      perUserAdjustments[p1].losses += 1;
      break;
    case "tie":
      perUserAdjustments[p1].draws += 1;
      perUserAdjustments[p2].draws += 1;
      break;
    case "withdraw_p1":
      perUserAdjustments[p1].losses += 1;
      perUserAdjustments[p2].wins += 1;
      break;
    case "withdraw_p2":
      perUserAdjustments[p2].losses += 1;
      perUserAdjustments[p1].wins += 1;
      break;
  }

  const applyUserAdjustments = async (
    userId: string,
    adj: { ranking: number; wins: number; losses: number; draws: number }
  ) => {
    // Try server-side RPC first (optional) — ignore silently if missing
    try {
      const { error } = await supabase.rpc("apply_match_result", {
        p_user_id: userId,
        p_ranking_delta: adj.ranking,
        p_wins_delta: adj.wins,
        p_losses_delta: adj.losses,
        p_draws_delta: adj.draws,
      });
      if (!error) return;
    } catch {}

    // Fallback: client-side read-modify-write
    let curRank = 200;
    let curWins = 0;
    let curLosses = 0;
    let curDraws = 0;
    try {
      const { data: row } = await supabase
        .from("user_stats")
        .select("ranking_points, wins, losses, draws")
        .eq("user_id", userId)
        .maybeSingle();
      if (row) {
        const r: any = row as any;
        curRank = typeof r.ranking_points === "number" ? r.ranking_points : 200;
        curWins = typeof r.wins === "number" ? r.wins : 0;
        curLosses = typeof r.losses === "number" ? r.losses : 0;
        curDraws = typeof r.draws === "number" ? r.draws : 0;
      }
    } catch {}

    const next = {
      ranking_points: curRank + adj.ranking,
      wins: curWins + adj.wins,
      losses: curLosses + adj.losses,
      draws: curDraws + adj.draws,
    };

    try {
      const { error: upErr } = await supabase
        .from("user_stats")
        .upsert({ user_id: userId, ...next }, { onConflict: "user_id" });
      if (upErr) {
        await supabase.from("user_stats").update(next).eq("user_id", userId);
      }
    } catch {}
  };

  for (const [uid, adj] of Object.entries(perUserAdjustments)) {
    await applyUserAdjustments(uid, adj);
  }

  // Record applied event so we don't double-apply next time
  try {
    await supabase.from("match_events").insert({
      match_id: matchId,
      sender: p1, // arbitrary; not used
      event_type: "ranking_applied",
      payload: { outcome, adjustments: perUserAdjustments },
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
