"use server";

import { getDb } from "@/db";
import { results, events, players, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireEditor, requireAdmin, isSuperAdmin, getSessionUser } from "@/lib/auth-helpers";
import { calculateMarks, type EventType, type Place } from "@/lib/marks";
import { z } from "zod";

const resultSchema = z.object({
  playerId: z.string().min(1, "Player is required"),
  sport: z.string().min(1, "Sport is required"),
  discipline: z.string().optional(),
  gender: z.enum(["M", "F"]),
  ageCategory: z.string().optional(),
  performance: z.string().optional(),
  performanceValue: z.number().optional(),
  place: z.enum(["1", "2", "3", "participated"]),
  bestAthlete: z.boolean().default(false),
  meetRecord: z.boolean().default(false),
  notes: z.string().optional(),
});

export type ResultFormData = z.infer<typeof resultSchema>;

export async function createResult(eventId: string, data: ResultFormData) {
  const session = await requireEditor();
  const parsed = resultSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const db = getDb();
  const user = getSessionUser(session);
  const role = user?.role ?? "";

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return { error: "Event not found" };
  if (event.locked) return { error: "Event is locked — no further results can be added" };

  const marks = calculateMarks(
    event.type as EventType,
    parsed.data.place as Place,
    parsed.data.bestAthlete,
    parsed.data.meetRecord
  );

  // Super admins auto-approve; sport_admin/editor results go pending
  const status = isSuperAdmin(role) ? "approved" : "pending";
  const id = randomUUID();

  await db.insert(results).values({
    id,
    playerId: parsed.data.playerId,
    eventId,
    sport: parsed.data.sport,
    discipline: parsed.data.discipline || null,
    gender: parsed.data.gender,
    ageCategory: parsed.data.ageCategory || null,
    performance: parsed.data.performance || null,
    performanceValue: parsed.data.performanceValue ?? null,
    place: parsed.data.place,
    bestAthlete: parsed.data.bestAthlete,
    meetRecord: parsed.data.meetRecord,
    marksAwarded: marks,
    notes: parsed.data.notes || null,
    enteredBy: user?.id ?? null,
    status,
  });

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: user?.id ?? null,
    action: "create",
    entity: "result",
    entityId: id,
    after: JSON.stringify({ ...parsed.data, eventId, marksAwarded: marks, status }),
  });

  revalidatePath(`/events/${eventId}`);
  return { success: true, pending: status === "pending" };
}

export async function updateResult(resultId: string, eventId: string, data: ResultFormData) {
  const session = await requireEditor();
  const parsed = resultSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const db = getDb();
  const user = getSessionUser(session);
  const role = user?.role ?? "";

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return { error: "Event not found" };
  if (event.locked) return { error: "Event is locked" };

  const [before] = await db.select().from(results).where(eq(results.id, resultId)).limit(1);
  if (!before) return { error: "Result not found" };

  const marks = calculateMarks(
    event.type as EventType,
    parsed.data.place as Place,
    parsed.data.bestAthlete,
    parsed.data.meetRecord
  );

  // Edits by sport_admin revert an approved result back to pending
  const status = isSuperAdmin(role) ? "approved" : "pending";

  await db.update(results).set({
    sport: parsed.data.sport,
    discipline: parsed.data.discipline || null,
    gender: parsed.data.gender,
    ageCategory: parsed.data.ageCategory || null,
    performance: parsed.data.performance || null,
    performanceValue: parsed.data.performanceValue ?? null,
    place: parsed.data.place,
    bestAthlete: parsed.data.bestAthlete,
    meetRecord: parsed.data.meetRecord,
    marksAwarded: marks,
    notes: parsed.data.notes || null,
    status,
    // Clear review when re-submitted
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    updatedAt: new Date().toISOString(),
  }).where(eq(results.id, resultId));

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: user?.id ?? null,
    action: "update",
    entity: "result",
    entityId: resultId,
    before: JSON.stringify(before),
    after: JSON.stringify({ ...parsed.data, marksAwarded: marks, status }),
  });

  revalidatePath(`/events/${eventId}`);
  return { success: true, pending: status === "pending" };
}

export async function deleteResult(resultId: string, eventId: string) {
  const session = await requireEditor();
  const db = getDb();
  const user = getSessionUser(session);

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (event?.locked) return { error: "Event is locked" };

  const [before] = await db.select().from(results).where(eq(results.id, resultId)).limit(1);
  if (!before) return { error: "Result not found" };

  await db.delete(results).where(eq(results.id, resultId));

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: user?.id ?? null,
    action: "delete",
    entity: "result",
    entityId: resultId,
    before: JSON.stringify(before),
  });

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function approveResult(resultId: string) {
  const session = await requireAdmin();
  const db = getDb();
  const user = getSessionUser(session);

  const [result] = await db.select().from(results).where(eq(results.id, resultId)).limit(1);
  if (!result) return { error: "Result not found" };
  if (result.status !== "pending") return { error: "Result is not pending" };

  await db.update(results).set({
    status: "approved",
    reviewedBy: user?.id ?? null,
    reviewedAt: new Date().toISOString(),
    reviewNotes: null,
    updatedAt: new Date().toISOString(),
  }).where(eq(results.id, resultId));

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: user?.id ?? null,
    action: "approve",
    entity: "result",
    entityId: resultId,
  });

  revalidatePath("/approvals");
  revalidatePath(`/events/${result.eventId}`);
  return { success: true };
}

export async function rejectResult(resultId: string, reviewNotes: string) {
  const session = await requireAdmin();
  const db = getDb();
  const user = getSessionUser(session);

  const [result] = await db.select().from(results).where(eq(results.id, resultId)).limit(1);
  if (!result) return { error: "Result not found" };

  await db.update(results).set({
    status: "rejected",
    reviewedBy: user?.id ?? null,
    reviewedAt: new Date().toISOString(),
    reviewNotes: reviewNotes || null,
    updatedAt: new Date().toISOString(),
  }).where(eq(results.id, resultId));

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: user?.id ?? null,
    action: "reject",
    entity: "result",
    entityId: resultId,
    after: JSON.stringify({ reviewNotes }),
  });

  revalidatePath("/approvals");
  revalidatePath(`/events/${result.eventId}`);
  return { success: true };
}

export type BulkEntry = {
  playerId: string;
  place: "1" | "2" | "3" | "participated";
  bestAthlete: boolean;
  meetRecord: boolean;
};

export async function createBulkResults(
  eventId: string,
  sport: string,
  discipline: string | null,
  gender: "M" | "F",
  ageCategory: string | null,
  entries: BulkEntry[]
) {
  const session = await requireEditor();
  if (!entries.length) return { error: "No entries provided" };

  const db = getDb();
  const user = getSessionUser(session);
  const role = user?.role ?? "";
  const status = isSuperAdmin(role) ? "approved" : "pending";

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return { error: "Event not found" };
  if (event.locked) return { error: "Event is locked" };

  const existing = await db
    .select({ playerId: results.playerId, discipline: results.discipline, gender: results.gender, ageCategory: results.ageCategory })
    .from(results)
    .where(eq(results.eventId, eventId));
  const existingKeys = new Set(
    existing.map((r) => `${r.playerId}|${r.discipline ?? ""}|${r.gender ?? ""}|${r.ageCategory ?? ""}`)
  );

  const skipped: string[] = [];
  let inserted = 0;

  for (const entry of entries) {
    const key = `${entry.playerId}|${discipline ?? ""}|${gender}|${ageCategory ?? ""}`;
    if (existingKeys.has(key)) { skipped.push(entry.playerId); continue; }

    const marks = calculateMarks(event.type as EventType, entry.place as Place, entry.bestAthlete, entry.meetRecord);
    const id = randomUUID();

    await db.insert(results).values({
      id,
      playerId: entry.playerId,
      eventId,
      sport,
      discipline: discipline || null,
      gender,
      ageCategory: ageCategory || null,
      place: entry.place,
      bestAthlete: entry.bestAthlete,
      meetRecord: entry.meetRecord,
      marksAwarded: marks,
      enteredBy: user?.id ?? null,
      status,
    });

    await db.insert(auditLog).values({
      id: randomUUID(),
      userId: user?.id ?? null,
      action: "create",
      entity: "result",
      entityId: id,
      after: JSON.stringify({ playerId: entry.playerId, eventId, sport, discipline, ageCategory, place: entry.place, marksAwarded: marks, status }),
    });

    inserted++;
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/bulk`);

  if (skipped.length > 0 && inserted === 0) return { error: "All selected players already have results for this event" };
  return { success: true, inserted, skipped: skipped.length, pending: status === "pending" };
}

export async function getResultsForEvent(eventId: string) {
  const db = getDb();
  return db
    .select({
      id: results.id,
      sport: results.sport,
      discipline: results.discipline,
      gender: results.gender,
      ageCategory: results.ageCategory,
      performance: results.performance,
      performanceValue: results.performanceValue,
      place: results.place,
      bestAthlete: results.bestAthlete,
      meetRecord: results.meetRecord,
      marksAwarded: results.marksAwarded,
      notes: results.notes,
      status: results.status,
      playerId: results.playerId,
      playerName: players.fullName,
      playerEmployeeId: players.employeeId,
      playerBranch: players.branch,
      playerSport: players.sport,
      playerGender: players.gender,
    })
    .from(results)
    .innerJoin(players, eq(results.playerId, players.id))
    .where(eq(results.eventId, eventId))
    .orderBy(results.place);
}
