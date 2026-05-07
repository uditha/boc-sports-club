"use server";

import { getDb } from "@/db";
import { events, auditLog } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireEditor, requireAdmin, requireUser } from "@/lib/auth-helpers";
import { z } from "zod";

const eventSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["inter_province", "nationalized", "coaching_camp", "local", "international"]),
  eventDate: z.string().min(1, "Date is required"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export type EventFormData = z.infer<typeof eventSchema>;

export async function createEvent(data: EventFormData) {
  const session = await requireEditor();
  const parsed = eventSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const db = getDb();
  const id = randomUUID();
  const year = new Date(parsed.data.eventDate).getFullYear();

  await db.insert(events).values({
    id,
    name: parsed.data.name,
    type: parsed.data.type,
    eventDate: parsed.data.eventDate,
    year,
    location: parsed.data.location || null,
    notes: parsed.data.notes || null,
    locked: false,
  });

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: (session.user as { id?: string }).id ?? null,
    action: "create",
    entity: "event",
    entityId: id,
    after: JSON.stringify(parsed.data),
  });

  revalidatePath("/events");
  return { success: true, id };
}

export async function updateEvent(id: string, data: EventFormData) {
  const session = await requireEditor();
  const parsed = eventSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const db = getDb();
  const [before] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!before) return { error: "Event not found" };
  if (before.locked) return { error: "Event is locked" };

  const year = new Date(parsed.data.eventDate).getFullYear();

  await db.update(events).set({
    name: parsed.data.name,
    type: parsed.data.type,
    eventDate: parsed.data.eventDate,
    year,
    location: parsed.data.location || null,
    notes: parsed.data.notes || null,
    updatedAt: new Date().toISOString(),
  }).where(eq(events.id, id));

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: (session.user as { id?: string }).id ?? null,
    action: "update",
    entity: "event",
    entityId: id,
    before: JSON.stringify(before),
    after: JSON.stringify(parsed.data),
  });

  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  return { success: true };
}

export async function toggleLockEvent(id: string) {
  const session = await requireAdmin();
  const db = getDb();

  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) return { error: "Event not found" };

  await db.update(events).set({
    locked: !event.locked,
    updatedAt: new Date().toISOString(),
  }).where(eq(events.id, id));

  revalidatePath(`/events/${id}`);
  return { success: true };
}

export async function getEvents(opts?: { year?: number }) {
  await requireUser();
  const db = getDb();

  const all = await db
    .select()
    .from(events)
    .orderBy(desc(events.eventDate));

  if (opts?.year) return all.filter((e) => e.year === opts.year);
  return all;
}

export async function getEventById(id: string) {
  await requireUser();
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return event ?? null;
}
