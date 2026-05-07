"use server";

import { getDb } from "@/db";
import { players, auditLog } from "@/db/schema";
import { eq, like, or, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireEditor, requireUser } from "@/lib/auth-helpers";
import { playerSchema, type PlayerFormData } from "@/lib/validations";

function sportsToString(sports: string[]) {
  return sports.join(",");
}

export async function createPlayer(data: PlayerFormData) {
  const session = await requireEditor();
  const parsed = playerSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const db = getDb();
  const id = randomUUID();

  await db.insert(players).values({
    id,
    fullName: parsed.data.fullName,
    employeeId: parsed.data.employeeId,
    branch: parsed.data.branch,
    sport: sportsToString(parsed.data.sports),
    gender: parsed.data.gender,
    dateOfBirth: parsed.data.dateOfBirth || null,
    joinedYear: parsed.data.joinedYear ? Number(parsed.data.joinedYear) : null,
    photoUrl: parsed.data.photoUrl || null,
    notes: parsed.data.notes || null,
    active: true,
  });

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: (session.user as { id?: string }).id ?? null,
    action: "create",
    entity: "player",
    entityId: id,
    after: JSON.stringify(parsed.data),
  });

  revalidatePath("/players");
  return { success: true };
}

export async function updatePlayer(id: string, data: PlayerFormData) {
  const session = await requireEditor();
  const parsed = playerSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const db = getDb();
  const [before] = await db.select().from(players).where(eq(players.id, id)).limit(1);
  if (!before) return { error: "Player not found" };

  await db
    .update(players)
    .set({
      fullName: parsed.data.fullName,
      employeeId: parsed.data.employeeId,
      branch: parsed.data.branch,
      sport: sportsToString(parsed.data.sports),
      gender: parsed.data.gender,
      dateOfBirth: parsed.data.dateOfBirth || null,
      joinedYear: parsed.data.joinedYear ? Number(parsed.data.joinedYear) : null,
      photoUrl: parsed.data.photoUrl || null,
      notes: parsed.data.notes || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(players.id, id));

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: (session.user as { id?: string }).id ?? null,
    action: "update",
    entity: "player",
    entityId: id,
    before: JSON.stringify(before),
    after: JSON.stringify(parsed.data),
  });

  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  return { success: true };
}

export async function togglePlayerActive(id: string) {
  const session = await requireEditor();
  const db = getDb();

  const [player] = await db.select().from(players).where(eq(players.id, id)).limit(1);
  if (!player) return { error: "Player not found" };

  await db
    .update(players)
    .set({ active: !player.active, updatedAt: new Date().toISOString() })
    .where(eq(players.id, id));

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: (session.user as { id?: string }).id ?? null,
    action: "update",
    entity: "player",
    entityId: id,
    before: JSON.stringify({ active: player.active }),
    after: JSON.stringify({ active: !player.active }),
  });

  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  return { success: true };
}

export async function getPlayers(opts?: {
  search?: string;
  sport?: string;
  // allowedSports: enforced for sport_admin — if set, player must match at least one
  allowedSports?: string[];
  includeInactive?: boolean;
}) {
  await requireUser();
  const db = getDb();

  const conditions = [];

  if (!opts?.includeInactive) {
    conditions.push(eq(players.active, true));
  }

  if (opts?.search) {
    const q = `%${opts.search}%`;
    conditions.push(
      or(
        like(players.fullName, q),
        like(players.employeeId, q),
        like(players.branch, q)
      )
    );
  }

  // sport is stored as comma-separated; allowedSports overrides the single sport filter
  if (opts?.allowedSports?.length) {
    // Player must match at least one of the allowed sports
    const sportClauses = opts.allowedSports.map(s => like(players.sport, `%${s}%`));
    conditions.push(or(...sportClauses)!);
  } else if (opts?.sport) {
    conditions.push(like(players.sport, `%${opts.sport}%`));
  }

  return db
    .select()
    .from(players)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(players.fullName);
}

export async function getPlayerById(id: string) {
  await requireUser();
  const db = getDb();
  const [player] = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return player ?? null;
}
