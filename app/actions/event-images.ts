"use server";

import { getDb } from "@/db";
import { eventImages, events, auditLog } from "@/db/schema";
import { eq, asc, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireEditor, requireUser } from "@/lib/auth-helpers";

// ~2MB of base64 — images are compressed client-side before upload
const MAX_DATA_URL_LENGTH = 2_800_000;
const MAX_IMAGES_PER_EVENT = 20;

export async function getEventImages(eventId: string) {
  await requireUser();
  const db = getDb();
  return db
    .select({
      id: eventImages.id,
      url: eventImages.url,
      caption: eventImages.caption,
      sortOrder: eventImages.sortOrder,
    })
    .from(eventImages)
    .where(eq(eventImages.eventId, eventId))
    .orderBy(asc(eventImages.sortOrder), asc(eventImages.createdAt));
}

export async function addEventImage(eventId: string, dataUrl: string, caption?: string) {
  const session = await requireEditor();
  const db = getDb();

  if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)) {
    return { error: "Invalid image format" };
  }
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    return { error: "Image is too large after compression — try a smaller photo" };
  }

  const [event] = await db.select({ id: events.id }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return { error: "Event not found" };

  const [{ existing }] = await db
    .select({ existing: count() })
    .from(eventImages)
    .where(eq(eventImages.eventId, eventId));
  if (existing >= MAX_IMAGES_PER_EVENT) {
    return { error: `Maximum of ${MAX_IMAGES_PER_EVENT} photos per event` };
  }

  const id = randomUUID();
  const userId = (session.user as { id?: string }).id ?? null;

  await db.insert(eventImages).values({
    id,
    eventId,
    url: dataUrl,
    caption: caption?.trim() || null,
    sortOrder: existing,
    createdBy: userId,
  });

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId,
    action: "update",
    entity: "event",
    entityId: eventId,
    after: JSON.stringify({ imageAdded: id, caption: caption?.trim() || null }),
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/report`);
  return { success: true, id };
}

export async function deleteEventImage(imageId: string) {
  const session = await requireEditor();
  const db = getDb();

  const [image] = await db.select().from(eventImages).where(eq(eventImages.id, imageId)).limit(1);
  if (!image) return { error: "Photo not found" };

  await db.delete(eventImages).where(eq(eventImages.id, imageId));

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: (session.user as { id?: string }).id ?? null,
    action: "update",
    entity: "event",
    entityId: image.eventId,
    after: JSON.stringify({ imageRemoved: imageId }),
  });

  revalidatePath(`/events/${image.eventId}`);
  revalidatePath(`/events/${image.eventId}/report`);
  return { success: true };
}
