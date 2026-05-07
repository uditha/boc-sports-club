"use server";

import { getDb } from "@/db";
import { results, events, players } from "@/db/schema";
import { eq, and, gte, lte, sum, count } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";

export type Period =
  | "this_year"
  | "last_year"
  | "last_2_years"
  | "last_3_years"
  | "all_time";

function getDateRange(period: Period): { from?: string; to?: string } {
  const now = new Date();
  const year = now.getFullYear();
  if (period === "this_year") return { from: `${year}-01-01`, to: `${year}-12-31` };
  if (period === "last_year") return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
  if (period === "last_2_years") return { from: `${year - 1}-01-01`, to: `${year}-12-31` };
  if (period === "last_3_years") return { from: `${year - 2}-01-01`, to: `${year}-12-31` };
  return {};
}

function getPreviousPeriodRange(period: Period): { from?: string; to?: string } {
  const now = new Date();
  const year = now.getFullYear();
  if (period === "this_year") return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
  if (period === "last_year") return { from: `${year - 2}-01-01`, to: `${year - 2}-12-31` };
  if (period === "last_2_years") return { from: `${year - 3}-01-01`, to: `${year - 2}-12-31` };
  if (period === "last_3_years") return { from: `${year - 5}-01-01`, to: `${year - 3}-12-31` };
  return {};
}

async function getMarksByPlayer(range: { from?: string; to?: string }, onlyActive: boolean, sport?: string, gender?: string) {
  const db = getDb();

  const allResults = await db
    .select({
      playerId: results.playerId,
      marks: results.marksAwarded,
      eventDate: events.eventDate,
      playerName: players.fullName,
      branch: players.branch,
      sport: players.sport,
      playerGender: players.gender,
      resultGender: results.gender,
      active: players.active,
    })
    .from(results)
    .innerJoin(events, eq(results.eventId, events.id))
    .innerJoin(players, eq(results.playerId, players.id));

  return allResults.filter((r) => {
    if (onlyActive && !r.active) return false;
    // Filter by result gender category (falls back to player gender for older records without it)
    if (gender) {
      const effectiveGender = r.resultGender ?? r.playerGender;
      if (effectiveGender !== gender) return false;
    }
    if (sport && !r.sport.includes(sport)) return false;
    if (range.from && r.eventDate < range.from) return false;
    if (range.to && r.eventDate > range.to) return false;
    return true;
  });
}

export type RankingRow = {
  rank: number;
  playerId: string;
  playerName: string;
  branch: string;
  sport: string;
  gender: string;
  eventCount: number;
  totalMarks: number;
  trend: "up" | "down" | "flat";
};

export async function getRankings(opts: {
  period: Period;
  sport?: string;
  gender?: string;
  activeOnly: boolean;
  topN?: number;
}): Promise<RankingRow[]> {
  await requireUser();

  const range = getDateRange(opts.period);
  const prevRange = getPreviousPeriodRange(opts.period);

  const [currentRows, prevRows] = await Promise.all([
    getMarksByPlayer(range, opts.activeOnly, opts.sport, opts.gender),
    getMarksByPlayer(prevRange, opts.activeOnly, opts.sport, opts.gender),
  ]);

  // Aggregate current period
  const current = new Map<string, { name: string; branch: string; sport: string; gender: string; marks: number; events: number }>();
  for (const r of currentRows) {
    const existing = current.get(r.playerId);
    if (existing) {
      existing.marks += r.marks;
      existing.events += 1;
    } else {
      current.set(r.playerId, { name: r.playerName, branch: r.branch, sport: r.sport, gender: r.playerGender, marks: r.marks, events: 1 });
    }
  }

  // Aggregate previous period
  const prev = new Map<string, number>();
  for (const r of prevRows) {
    prev.set(r.playerId, (prev.get(r.playerId) ?? 0) + r.marks);
  }

  // Sort by marks desc
  const sorted = Array.from(current.entries())
    .sort((a, b) => b[1].marks - a[1].marks);

  const limited = opts.topN ? sorted.slice(0, opts.topN) : sorted;

  return limited.map(([playerId, data], i) => {
    const prevMarks = prev.get(playerId) ?? 0;
    const trend: "up" | "down" | "flat" =
      data.marks > prevMarks ? "up" :
      data.marks < prevMarks ? "down" : "flat";

    return {
      rank: i + 1,
      playerId,
      playerName: data.name,
      branch: data.branch,
      sport: data.sport,
      gender: data.gender,
      eventCount: data.events,
      totalMarks: data.marks,
      trend,
    };
  });
}
