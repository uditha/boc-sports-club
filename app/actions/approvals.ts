"use server";

import { getDb } from "@/db";
import { results, events, players, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { approveResult, rejectResult } from "./results";

export type PendingResult = {
  id: string;
  place: string;
  bestAthlete: boolean;
  meetRecord: boolean;
  marksAwarded: number;
  sport: string | null;
  discipline: string | null;
  gender: string | null;
  ageCategory: string | null;
  performance: string | null;
  status: string;
  createdAt: string;
  playerId: string;
  playerName: string;
  playerBranch: string;
  eventId: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  submittedBy: string | null;
};

export async function getPendingResults(): Promise<PendingResult[]> {
  await requireAdmin();
  const db = getDb();

  return db
    .select({
      id: results.id,
      place: results.place,
      bestAthlete: results.bestAthlete,
      meetRecord: results.meetRecord,
      marksAwarded: results.marksAwarded,
      sport: results.sport,
      discipline: results.discipline,
      gender: results.gender,
      ageCategory: results.ageCategory,
      performance: results.performance,
      status: results.status,
      createdAt: results.createdAt,
      playerId: results.playerId,
      playerName: players.fullName,
      playerBranch: players.branch,
      eventId: results.eventId,
      eventName: events.name,
      eventType: events.type,
      eventDate: events.eventDate,
      submittedBy: users.fullName,
    })
    .from(results)
    .innerJoin(players, eq(results.playerId, players.id))
    .innerJoin(events, eq(results.eventId, events.id))
    .leftJoin(users, eq(results.enteredBy, users.id))
    .where(eq(results.status, "pending"))
    .orderBy(desc(results.createdAt));
}

export async function getRecentlyReviewedResults(limit = 20) {
  await requireAdmin();
  const db = getDb();

  return db
    .select({
      id: results.id,
      place: results.place,
      marksAwarded: results.marksAwarded,
      sport: results.sport,
      discipline: results.discipline,
      status: results.status,
      reviewNotes: results.reviewNotes,
      reviewedAt: results.reviewedAt,
      playerId: results.playerId,
      playerName: players.fullName,
      eventId: results.eventId,
      eventName: events.name,
      eventDate: events.eventDate,
      submittedBy: users.fullName,
    })
    .from(results)
    .innerJoin(players, eq(results.playerId, players.id))
    .innerJoin(events, eq(results.eventId, events.id))
    .leftJoin(users, eq(results.enteredBy, users.id))
    .where(and(eq(results.status, "approved"), eq(results.reviewedAt, results.reviewedAt)))
    .orderBy(desc(results.reviewedAt))
    .limit(limit);
}

export async function approveAllResults(resultIds: string[]) {
  await requireAdmin();
  if (!resultIds.length) return { success: true };
  const db = getDb();
  const now = new Date().toISOString();
  // Update all at once — no need for per-row audit here (bulk action is visible in approvals log)
  for (const id of resultIds) {
    await db
      .update(results)
      .set({ status: "approved", reviewedAt: now })
      .where(and(eq(results.id, id), eq(results.status, "pending")));
  }
  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/rankings");
  return { success: true };
}

export { approveResult, rejectResult };
