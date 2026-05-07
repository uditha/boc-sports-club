"use server";

import { getDb } from "@/db";
import { ageCategories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";

export type AgeCategoryRow = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean | number;
};

export async function getAgeCategories(): Promise<AgeCategoryRow[]> {
  const db = getDb();
  return db
    .select({ id: ageCategories.id, name: ageCategories.name, sortOrder: ageCategories.sortOrder, active: ageCategories.active })
    .from(ageCategories)
    .orderBy(asc(ageCategories.sortOrder), asc(ageCategories.name));
}

export async function getActiveAgeCategoryNames(): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ name: ageCategories.name })
    .from(ageCategories)
    .where(eq(ageCategories.active, true))
    .orderBy(asc(ageCategories.sortOrder), asc(ageCategories.name));
  return rows.map((r) => r.name);
}

export async function createAgeCategory(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  const db = getDb();
  // Set sort order to current max + 1
  const all = await db.select({ sortOrder: ageCategories.sortOrder }).from(ageCategories);
  const maxOrder = all.length > 0 ? Math.max(...all.map((r) => r.sortOrder)) : -1;

  try {
    await db.insert(ageCategories).values({ id: randomUUID(), name: trimmed, sortOrder: maxOrder + 1, active: true });
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Category name already exists" };
  }
}

export async function updateAgeCategory(id: string, data: { name?: string; active?: boolean; sortOrder?: number }) {
  await requireAdmin();
  const db = getDb();
  try {
    await db.update(ageCategories).set(data).where(eq(ageCategories.id, id));
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Name already in use" };
  }
}
