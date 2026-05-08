"use server";

import { getDb } from "@/db";
import { results, events, players } from "@/db/schema";
import { eq, desc, count, sum, sql, and } from "drizzle-orm";
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
  monthlyMarks: { month: string; marks: number }[];
  eventTypeBreakdown: { type: string; count: number }[];
  recentResults: { playerId: string; playerName: string; eventId: string; eventName: string; eventDate: string; place: string; marks: number }[];
  topPerformer: { playerId: string; playerName: string; totalMarks: number } | null;
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function sportMatches(playerSport: string, allowedSports: string[]): boolean {
  if (allowedSports.length === 0) return false;
  return playerSport.split(",").map(s => s.trim()).some(s => allowedSports.includes(s));
}

export async function getDashboardStats(allowedSports?: string[]): Promise<DashboardStats> {
  await requireUser();
  const db = getDb();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-based

  const [
    allPlayers,
    eventsCountResult,
    allResultsRaw,
    recentEventsRaw,
    topMalePlayers,
    topFemalePlayers,
    monthlyRaw,
    eventTypeRaw,
    recentResultsRaw,
    topPerformerRaw,
  ] = await Promise.all([
    db.select({ id: players.id, active: players.active, sport: players.sport, gender: players.gender }).from(players),
    db.select({ cnt: count() }).from(events),
    db.select({ marks: results.marksAwarded }).from(results).where(eq(results.status, "approved")),
    db.select({ id: events.id, name: events.name, type: events.type, eventDate: events.eventDate })
      .from(events).orderBy(desc(events.eventDate)).limit(5),
    getRankings({ period: "all_time", activeOnly: false, topN: 5, gender: "M", allowedSports }),
    getRankings({ period: "all_time", activeOnly: false, topN: 5, gender: "F", allowedSports }),
    // Monthly marks for current year
    db.select({
      month: sql<string>`strftime('%m', ${events.eventDate})`,
      marks: sum(results.marksAwarded),
    })
      .from(results)
      .innerJoin(events, eq(results.eventId, events.id))
      .where(and(eq(events.year, currentYear), eq(results.status, "approved")))
      .groupBy(sql`strftime('%m', ${events.eventDate})`),
    // Event type breakdown
    db.select({ type: events.type, cnt: count() }).from(events).groupBy(events.type),
    // Recent results feed — include playerSport for sport filter
    db.select({
      playerId: results.playerId,
      playerName: players.fullName,
      playerSport: players.sport,
      eventId: results.eventId,
      eventName: events.name,
      eventDate: events.eventDate,
      place: results.place,
      marks: results.marksAwarded,
    })
      .from(results)
      .innerJoin(players, eq(results.playerId, players.id))
      .innerJoin(events, eq(results.eventId, events.id))
      .where(eq(results.status, "approved"))
      .orderBy(desc(events.eventDate), desc(results.createdAt))
      .limit(allowedSports?.length ? 50 : 8), // fetch more to compensate for JS filtering
    // Top performer — include playerSport for sport filter
    db.select({
      playerId: results.playerId,
      playerName: players.fullName,
      playerSport: players.sport,
      totalMarks: sum(results.marksAwarded),
    })
      .from(results)
      .innerJoin(players, eq(results.playerId, players.id))
      .where(eq(results.status, "approved"))
      .groupBy(results.playerId, players.fullName, players.sport)
      .orderBy(desc(sum(results.marksAwarded)))
      .limit(allowedSports?.length ? 20 : 1),
  ]);

  const recentEvents = await Promise.all(
    recentEventsRaw.map(async (e) => {
      const [row] = await db.select({ cnt: count() }).from(results).where(and(eq(results.eventId, e.id), eq(results.status, "approved")));
      return { ...e, resultCount: row?.cnt ?? 0 };
    })
  );

  // allowedSports defined → sport_admin scope (empty = no sports assigned = nothing)
  const filteredPlayers = allowedSports !== undefined
    ? allPlayers.filter(p => sportMatches(p.sport, allowedSports))
    : allPlayers;

  const activePlayers = filteredPlayers.filter(p => p.active).length;
  const totalMarks = allResultsRaw.reduce((acc, r) => acc + (r.marks ?? 0), 0);

  const sportCounts = new Map<string, number>();
  for (const p of filteredPlayers.filter(p => p.active)) {
    for (const sport of p.sport.split(",").map(s => s.trim()).filter(Boolean)) {
      if (!allowedSports?.length || allowedSports.includes(sport)) {
        sportCounts.set(sport, (sportCounts.get(sport) ?? 0) + 1);
      }
    }
  }

  // Build full month array up to current month
  const marksMap = new Map(monthlyRaw.map(r => [r.month, Number(r.marks ?? 0)]));
  const monthlyMarks = MONTH_LABELS.slice(0, currentMonth + 1).map((label, i) => ({
    month: label,
    marks: marksMap.get(String(i + 1).padStart(2, "0")) ?? 0,
  }));

  // Filter recent results by allowed sports and take first 8
  const filteredRecentResults = recentResultsRaw
    .filter(r => allowedSports !== undefined ? sportMatches(r.playerSport, allowedSports) : true)
    .slice(0, 8)
    .map(({ playerSport: _ps, ...r }) => r);

  // Find top performer filtered by allowed sports
  const topPerformerFiltered = allowedSports !== undefined
    ? topPerformerRaw.find(r => sportMatches(r.playerSport, allowedSports))
    : topPerformerRaw[0];

  const topPerformer = topPerformerFiltered
    ? { playerId: topPerformerFiltered.playerId, playerName: topPerformerFiltered.playerName, totalMarks: Number(topPerformerFiltered.totalMarks ?? 0) }
    : null;

  return {
    activePlayers,
    totalPlayers: filteredPlayers.length,
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
      male: filteredPlayers.filter(p => p.active && p.gender === "M").length,
      female: filteredPlayers.filter(p => p.active && p.gender === "F").length,
    },
    monthlyMarks,
    eventTypeBreakdown: eventTypeRaw.map(r => ({ type: r.type, count: r.cnt })),
    recentResults: filteredRecentResults,
    topPerformer,
  };
}
