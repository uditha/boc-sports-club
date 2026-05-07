"use server";

import { getDb } from "@/db";
import { results, events, players } from "@/db/schema";
import { eq, desc, count, sum, sql } from "drizzle-orm";
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

export async function getDashboardStats(): Promise<DashboardStats> {
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
    db.select({ marks: results.marksAwarded }).from(results),
    db.select({ id: events.id, name: events.name, type: events.type, eventDate: events.eventDate })
      .from(events).orderBy(desc(events.eventDate)).limit(5),
    getRankings({ period: "all_time", activeOnly: false, topN: 5, gender: "M" }),
    getRankings({ period: "all_time", activeOnly: false, topN: 5, gender: "F" }),
    // Monthly marks for current year
    db.select({
      month: sql<string>`strftime('%m', ${events.eventDate})`,
      marks: sum(results.marksAwarded),
    })
      .from(results)
      .innerJoin(events, eq(results.eventId, events.id))
      .where(eq(events.year, currentYear))
      .groupBy(sql`strftime('%m', ${events.eventDate})`),
    // Event type breakdown
    db.select({ type: events.type, cnt: count() }).from(events).groupBy(events.type),
    // Recent results feed
    db.select({
      playerId: results.playerId,
      playerName: players.fullName,
      eventId: results.eventId,
      eventName: events.name,
      eventDate: events.eventDate,
      place: results.place,
      marks: results.marksAwarded,
    })
      .from(results)
      .innerJoin(players, eq(results.playerId, players.id))
      .innerJoin(events, eq(results.eventId, events.id))
      .orderBy(desc(results.createdAt))
      .limit(8),
    // Top performer all time
    db.select({
      playerId: results.playerId,
      playerName: players.fullName,
      totalMarks: sum(results.marksAwarded),
    })
      .from(results)
      .innerJoin(players, eq(results.playerId, players.id))
      .groupBy(results.playerId, players.fullName)
      .orderBy(desc(sum(results.marksAwarded)))
      .limit(1),
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

  // Build full month array up to current month
  const marksMap = new Map(monthlyRaw.map(r => [r.month, Number(r.marks ?? 0)]));
  const monthlyMarks = MONTH_LABELS.slice(0, currentMonth + 1).map((label, i) => ({
    month: label,
    marks: marksMap.get(String(i + 1).padStart(2, "0")) ?? 0,
  }));

  const topP = topPerformerRaw[0];
  const topPerformer = topP
    ? { playerId: topP.playerId, playerName: topP.playerName, totalMarks: Number(topP.totalMarks ?? 0) }
    : null;

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
    monthlyMarks,
    eventTypeBreakdown: eventTypeRaw.map(r => ({ type: r.type, count: r.cnt })),
    recentResults: recentResultsRaw,
    topPerformer,
  };
}
