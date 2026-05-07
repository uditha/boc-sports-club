"use server";

import { getDb } from "@/db";
import { results, events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";

export async function getPlayerHistory(playerId: string, year?: number) {
  await requireUser();
  const db = getDb();

  const rows = await db
    .select({
      resultId: results.id,
      place: results.place,
      bestAthlete: results.bestAthlete,
      meetRecord: results.meetRecord,
      marksAwarded: results.marksAwarded,
      resultNotes: results.notes,
      eventId: events.id,
      eventName: events.name,
      eventType: events.type,
      eventDate: events.eventDate,
      eventYear: events.year,
      eventLocation: events.location,
    })
    .from(results)
    .innerJoin(events, eq(results.eventId, events.id))
    .where(eq(results.playerId, playerId))
    .orderBy(desc(events.eventDate));

  if (year) return rows.filter((r) => r.eventYear === year);
  return rows;
}

export type PlayerHistoryRow = Awaited<ReturnType<typeof getPlayerHistory>>[number];

export async function getPlayerStats(playerId: string) {
  await requireUser();
  const allHistory = await getPlayerHistory(playerId);
  const currentYear = new Date().getFullYear();

  const totalEvents = allHistory.length;
  const totalMarks = allHistory.reduce((s, r) => s + r.marksAwarded, 0);
  const marksThisYear = allHistory
    .filter((r) => r.eventYear === currentYear)
    .reduce((s, r) => s + r.marksAwarded, 0);

  const firstPlaces = allHistory.filter((r) => r.place === "1").length;
  const secondPlaces = allHistory.filter((r) => r.place === "2").length;
  const thirdPlaces = allHistory.filter((r) => r.place === "3").length;
  const bestAthleteCount = allHistory.filter((r) => r.bestAthlete).length;
  const meetRecordCount = allHistory.filter((r) => r.meetRecord).length;

  // Marks per year for bar chart
  const byYear: Record<number, number> = {};
  for (const r of allHistory) {
    byYear[r.eventYear] = (byYear[r.eventYear] ?? 0) + r.marksAwarded;
  }
  const marksPerYear = Object.entries(byYear)
    .map(([year, marks]) => ({ year: parseInt(year), marks }))
    .sort((a, b) => a.year - b.year);

  return {
    totalEvents,
    totalMarks,
    marksThisYear,
    firstPlaces,
    secondPlaces,
    thirdPlaces,
    bestAthleteCount,
    meetRecordCount,
    marksPerYear,
  };
}

export type PlayerStats = Awaited<ReturnType<typeof getPlayerStats>>;
