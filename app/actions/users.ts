"use server";

import { getDb } from "@/db";
import { users, userSportAssignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, requireUser } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ROLE_ENUM = ["super_admin", "sport_admin", "viewer"] as const;

const createSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  fullName: z.string().min(1, "Full name required").max(100),
  role: z.enum(ROLE_ENUM),
  province: z.string().optional(),
  password: z.string().min(8, "Minimum 8 characters"),
  assignedSportIds: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  fullName: z.string().min(1, "Full name required").max(100),
  role: z.enum(ROLE_ENUM),
  province: z.string().optional().nullable(),
  active: z.boolean(),
  password: z.string().min(8, "Minimum 8 characters").or(z.literal("")).optional(),
  assignedSportIds: z.array(z.string()).optional(),
});

export type UserRow = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  province: string | null;
  active: boolean | number;
  createdAt: string;
  assignedSportIds: string[];
};

export async function getUsers(): Promise<UserRow[]> {
  await requireAdmin();
  const db = getDb();

  const [usersRaw, allAssignments] = await Promise.all([
    db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      role: users.role,
      province: users.province,
      active: users.active,
      createdAt: users.createdAt,
    }).from(users).orderBy(users.createdAt),
    db.select({
      userId: userSportAssignments.userId,
      sportId: userSportAssignments.sportId,
    }).from(userSportAssignments),
  ]);

  const assignmentMap = new Map<string, string[]>();
  for (const a of allAssignments) {
    if (!assignmentMap.has(a.userId)) assignmentMap.set(a.userId, []);
    assignmentMap.get(a.userId)!.push(a.sportId);
  }

  return usersRaw.map(u => ({
    ...u,
    assignedSportIds: assignmentMap.get(u.id) ?? [],
  })) as UserRow[];
}

export async function createUser(data: unknown) {
  await requireAdmin();
  const parsed = createSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { username, fullName, role, province, password, assignedSportIds } = parsed.data;
  const db = getDb();
  const userId = randomUUID();

  try {
    await db.insert(users).values({
      id: userId,
      username,
      fullName,
      role,
      province: province ?? null,
      passwordHash: await bcrypt.hash(password, 12),
      active: true,
    });

    if (role === "sport_admin" && assignedSportIds?.length) {
      await db.insert(userSportAssignments).values(
        assignedSportIds.map(sportId => ({ id: randomUUID(), userId, sportId }))
      );
    }

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

  const { fullName, role, province, active, password, assignedSportIds } = parsed.data;
  const db = getDb();

  type UpdateFields = {
    fullName: string;
    role: typeof ROLE_ENUM[number];
    province: string | null;
    active: boolean;
    passwordHash?: string;
  };

  const fields: UpdateFields = { fullName, role, province: province ?? null, active };
  if (password) fields.passwordHash = await bcrypt.hash(password, 12);

  await db.update(users).set(fields).where(eq(users.id, id));

  // Sync sport assignments: delete old, insert new
  await db.delete(userSportAssignments).where(eq(userSportAssignments.userId, id));
  if (role === "sport_admin" && assignedSportIds?.length) {
    await db.insert(userSportAssignments).values(
      assignedSportIds.map(sportId => ({ id: randomUUID(), userId: id, sportId }))
    );
  }

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
