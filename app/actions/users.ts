"use server";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, requireUser } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  fullName: z.string().min(1, "Full name required").max(100),
  role: z.enum(["admin", "editor", "viewer"]),
  password: z.string().min(8, "Minimum 8 characters"),
});

const updateSchema = z.object({
  fullName: z.string().min(1, "Full name required").max(100),
  role: z.enum(["admin", "editor", "viewer"]),
  active: z.boolean(),
  password: z.string().min(8, "Minimum 8 characters").or(z.literal("")).optional(),
});

export type UserRow = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  active: boolean | number;
  createdAt: string;
};

export async function getUsers(): Promise<UserRow[]> {
  await requireAdmin();
  const db = getDb();
  const rows = await db.select({
    id: users.id,
    username: users.username,
    fullName: users.fullName,
    role: users.role,
    active: users.active,
    createdAt: users.createdAt,
  }).from(users).orderBy(users.createdAt);
  return rows as UserRow[];
}

export async function createUser(data: unknown) {
  await requireAdmin();
  const parsed = createSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { username, fullName, role, password } = parsed.data;
  const db = getDb();
  try {
    await db.insert(users).values({
      id: randomUUID(),
      username,
      fullName,
      role,
      passwordHash: await bcrypt.hash(password, 12),
      active: true,
    });
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Username already exists" };
  }
}

export async function updateUser(id: string, data: unknown) {
  await requireAdmin();
  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { fullName, role, active, password } = parsed.data;
  const db = getDb();

  type UpdateFields = { fullName: string; role: "admin" | "editor" | "viewer"; active: boolean; passwordHash?: string };
  const fields: UpdateFields = { fullName, role, active };
  if (password) fields.passwordHash = await bcrypt.hash(password, 12);

  await db.update(users).set(fields).where(eq(users.id, id));
  revalidatePath("/settings");
  return { success: true };
}

export async function changeOwnPassword(data: { currentPassword: string; newPassword: string }) {
  const session = await requireUser();
  const userId = (session.user as { id?: string }).id;
  if (!userId) return { error: "Invalid session" };

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return { error: "User not found" };

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect" };
  if (data.newPassword.length < 8) return { error: "New password must be at least 8 characters" };

  await db.update(users).set({ passwordHash: await bcrypt.hash(data.newPassword, 12) }).where(eq(users.id, userId));
  return { success: true };
}
