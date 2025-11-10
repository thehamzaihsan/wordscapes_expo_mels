import { supabase } from "@/lib/supabase";

export interface MatchRecord {
  userId: string;
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number; // 0-100
  rankingPoints: number;
}

/**
 * Fetch wins/losses/draws for a user from user_stats and compute win rate.
 * Falls back to sensible defaults when no row exists yet.
 */
export async function getUserMatchRecord(userId: string): Promise<MatchRecord> {
  const { data } = await supabase
    .from("user_stats")
    .select("ranking_points,wins,losses,draws")
    .eq("user_id", userId)
    .maybeSingle();

  const wins = (data as any)?.wins ?? 0;
  const losses = (data as any)?.losses ?? 0;
  const draws = (data as any)?.draws ?? 0;
  const total = wins + losses + draws;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const rankingPoints = (data as any)?.ranking_points ?? 200;

  return { userId, wins, losses, draws, total, winRate, rankingPoints };
}
