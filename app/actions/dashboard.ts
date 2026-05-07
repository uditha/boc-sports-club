"use server";

import { getDb } from "@/db";
import { results, events, players } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";
import { getRankings, type RankingRow } from "./rankings";

export type DashboardStats = {
  activePlayers: number;
  totalPlayers: number;
  totalEvents: number;
  totalResults: number;
  totalMarks: number;
  topMalePlayers: RankingRow[];
  topFemalePlayers: RankingRow[];
  recentEvents: { id: string; name: string; type: string; eventDate: string; resultCount: number }[];
  sportBreakdown: { sport: string; count: number }[];
  genderBreakdown: { male: number; female: number };
};

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireUser();
  const db = getDb();

  const [allPlayers, eventsCountResult, allResultsRaw, recentEventsRaw, topMalePlayers, topFemalePlayers] = await Promise.all([
    db.select({ id: players.id, active: players.active, sport: players.sport, gender: players.gender }).from(players),
    db.select({ cnt: count() }).from(events),
    db.select({ marks: results.marksAwarded }).from(results),
    db.select({ id: events.id, name: events.name, type: events.type, eventDate: events.eventDate })
      .from(events).orderBy(desc(events.eventDate)).limit(5),
    getRankings({ period: "all_time", activeOnly: false, topN: 5, gender: "M" }),
    getRankings({ period: "all_time", activeOnly: false, topN: 5, gender: "F" }),
  ]);

  const recentEvents = await Promise.all(
    recentEventsRaw.map(async (e) => {
      const [row] = await db.select({ cnt: count() }).from(results).where(eq(results.eventId, e.id));
      return { ...e, resultCount: row?.cnt ?? 0 };
    })
  );

  const activePlayers = allPlayers.filter(p => p.active).length;
  const totalMarks = allResultsRaw.reduce((acc, r) => acc + (r.marks ?? 0), 0);

  const sportCounts = new Map<string, number>();
  for (const p of allPlayers.filter(p => p.active)) {
    for (const sport of p.sport.split(",").map(s => s.trim()).filter(Boolean)) {
      sportCounts.set(sport, (sportCounts.get(sport) ?? 0) + 1);
    }
  }

  return {
    activePlayers,
    totalPlayers: allPlayers.length,
    totalEvents: eventsCountResult[0]?.cnt ?? 0,
    totalResults: allResultsRaw.length,
    totalMarks,
    topMalePlayers,
    topFemalePlayers,
    recentEvents,
    sportBreakdown: Array.from(sportCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([sport, cnt]) => ({ sport, count: cnt })),
    genderBreakdown: {
      male: allPlayers.filter(p => p.active && p.gender === "M").length,
      female: allPlayers.filter(p => p.active && p.gender === "F").length,
    },
  };
}
