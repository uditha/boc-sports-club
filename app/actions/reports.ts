"use server";

import { getDb } from "@/db";
import { results, events, players } from "@/db/schema";
import { eq, and, count, sum, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";
import { getRankings, type RankingRow } from "./rankings";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/marks";

export type AnnualReportData = {
  year: number;
  totalEvents: number;
  totalResults: number;
  totalMarks: number;
  uniquePlayers: number;
  topLifetime: RankingRow[];
  topThisYear: RankingRow[];
  yearEvents: {
    id: string;
    name: string;
    type: string;
    typeLabel: string;
    eventDate: string;
    location: string | null;
    resultCount: number;
  }[];
  achievements: {
    playerName: string;
    playerId: string;
    branch: string;
    eventName: string;
    eventId: string;
    type: "best_athlete" | "meet_record" | "both";
    eventDate: string;
  }[];
};

export async function getAnnualReportData(year: number): Promise<AnnualReportData> {
  await requireUser();
  const db = getDb();

  const [yearEventsRaw, topLifetime, topThisYear, achievementsRaw, yearResultsRaw] = await Promise.all([
    db.select({ id: events.id, name: events.name, type: events.type, eventDate: events.eventDate, location: events.location })
      .from(events)
      .where(eq(events.year, year))
      .orderBy(events.eventDate),
    getRankings({ period: "all_time", activeOnly: false, topN: 10 }),
    getRankings({ period: "this_year", activeOnly: false, topN: 10 }),
    // Best athlete & meet record achievements for the year
    db.select({
      playerId: results.playerId,
      playerName: players.fullName,
      branch: players.branch,
      eventId: results.eventId,
      eventName: events.name,
      eventDate: events.eventDate,
      bestAthlete: results.bestAthlete,
      meetRecord: results.meetRecord,
    })
      .from(results)
      .innerJoin(players, eq(results.playerId, players.id))
      .innerJoin(events, eq(results.eventId, events.id))
      .where(and(eq(events.year, year)))
      .orderBy(events.eventDate),
    // Summary counts for the year
    db.select({
      cnt: count(),
      totalMarks: sum(results.marksAwarded),
    })
      .from(results)
      .innerJoin(events, eq(results.eventId, events.id))
      .where(eq(events.year, year)),
  ]);

  // Result counts per event
  const yearEvents = await Promise.all(
    yearEventsRaw.map(async (e) => {
      const [row] = await db.select({ cnt: count() }).from(results).where(eq(results.eventId, e.id));
      return {
        ...e,
        typeLabel: EVENT_TYPE_LABELS[e.type as EventType] ?? e.type,
        resultCount: row?.cnt ?? 0,
      };
    })
  );

  // Build achievements list (only rows with best_athlete or meet_record)
  const achievements = achievementsRaw
    .filter(r => r.bestAthlete || r.meetRecord)
    .map(r => ({
      playerName: r.playerName,
      playerId: r.playerId,
      branch: r.branch,
      eventName: r.eventName,
      eventId: r.eventId,
      eventDate: r.eventDate,
      type: (r.bestAthlete && r.meetRecord ? "both" : r.bestAthlete ? "best_athlete" : "meet_record") as "best_athlete" | "meet_record" | "both",
    }));

  // Unique players who participated this year
  const uniquePlayerIds = new Set(achievementsRaw.map(r => r.playerId));
  // Also count from all year results (achievementsRaw only has special ones)
  const allYearPlayerIds = await db
    .selectDistinct({ playerId: results.playerId })
    .from(results)
    .innerJoin(events, eq(results.eventId, events.id))
    .where(eq(events.year, year));

  const yearSummary = yearResultsRaw[0];

  return {
    year,
    totalEvents: yearEventsRaw.length,
    totalResults: yearSummary?.cnt ?? 0,
    totalMarks: Number(yearSummary?.totalMarks ?? 0),
    uniquePlayers: allYearPlayerIds.length,
    topLifetime,
    topThisYear,
    yearEvents,
    achievements,
  };
}
