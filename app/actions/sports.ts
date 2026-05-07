"use server";

import { getDb } from "@/db";
import { sports, sportDisciplines } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin, requireUser } from "@/lib/auth-helpers";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export type SportRow = {
  id: string;
  name: string;
  active: boolean | number;
  createdAt: string;
};

export type DisciplineRow = {
  id: string;
  sportId: string;
  name: string;
  active: boolean | number;
};

export async function getSports(): Promise<SportRow[]> {
  await requireUser();
  const db = getDb();
  return db.select().from(sports).orderBy(sports.name) as Promise<SportRow[]>;
}

export async function getActiveSportNames(): Promise<string[]> {
  await requireUser();
  const db = getDb();
  const rows = await db
    .select({ name: sports.name })
    .from(sports)
    .where(eq(sports.active, true))
    .orderBy(sports.name);
  return rows.map((r) => r.name);
}

export async function createSport(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Sport name is required" };
  if (trimmed.length > 50) return { error: "Name must be 50 characters or fewer" };

  const db = getDb();
  try {
    await db.insert(sports).values({ id: randomUUID(), name: trimmed, active: true });
    revalidatePath("/settings");
    revalidatePath("/players");
    revalidatePath("/rankings");
    return { success: true };
  } catch {
    return { error: "A sport with this name already exists" };
  }
}

export async function getDisciplinesForSport(sportId: string): Promise<DisciplineRow[]> {
  await requireUser();
  const db = getDb();
  return db
    .select()
    .from(sportDisciplines)
    .where(eq(sportDisciplines.sportId, sportId))
    .orderBy(sportDisciplines.name) as Promise<DisciplineRow[]>;
}

// Returns { sportName: activeDisciplineNames[] } — used to populate result form pickers
export async function getAllDisciplinesBySport(): Promise<Record<string, string[]>> {
  await requireUser();
  const db = getDb();
  const rows = await db
    .select({
      sportName: sports.name,
      disciplineName: sportDisciplines.name,
      disciplineActive: sportDisciplines.active,
    })
    .from(sportDisciplines)
    .innerJoin(sports, eq(sportDisciplines.sportId, sports.id))
    .where(and(eq(sportDisciplines.active, true), eq(sports.active, true)))
    .orderBy(sportDisciplines.name);

  const map: Record<string, string[]> = {};
  for (const row of rows) {
    if (!map[row.sportName]) map[row.sportName] = [];
    map[row.sportName].push(row.disciplineName);
  }
  return map;
}

export async function createDiscipline(sportId: string, name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Discipline name is required" };
  if (trimmed.length > 80) return { error: "Name must be 80 characters or fewer" };

  const db = getDb();
  try {
    await db.insert(sportDisciplines).values({ id: randomUUID(), sportId, name: trimmed, active: true });
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "A discipline with this name already exists for this sport" };
  }
}

export async function updateDiscipline(id: string, data: { name?: string; active?: boolean }) {
  await requireAdmin();
  const db = getDb();

  const updates: { name?: string; active?: boolean } = {};
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) return { error: "Discipline name is required" };
    updates.name = trimmed;
  }
  if (data.active !== undefined) updates.active = data.active;

  try {
    await db.update(sportDisciplines).set(updates).where(eq(sportDisciplines.id, id));
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "A discipline with this name already exists for this sport" };
  }
}

export async function updateSport(id: string, data: { name?: string; active?: boolean }) {
  await requireAdmin();
  const db = getDb();

  const updates: { name?: string; active?: boolean } = {};
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) return { error: "Sport name is required" };
    updates.name = trimmed;
  }
  if (data.active !== undefined) updates.active = data.active;

  try {
    await db.update(sports).set(updates).where(eq(sports.id, id));
    revalidatePath("/settings");
    revalidatePath("/players");
    revalidatePath("/rankings");
    return { success: true };
  } catch {
    return { error: "A sport with this name already exists" };
  }
}
