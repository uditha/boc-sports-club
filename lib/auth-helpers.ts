import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { userSportAssignments, sports } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AppRole = "super_admin" | "sport_admin" | "viewer" | "admin" | "editor";

// Treat legacy "admin" as super_admin, legacy "editor" as sport_admin
export function isSuperAdmin(role: string): boolean {
  return role === "super_admin" || role === "admin";
}

export function canEdit(role: string): boolean {
  return isSuperAdmin(role) || role === "sport_admin" || role === "editor";
}

export function getSessionUser(session: Awaited<ReturnType<typeof auth>>) {
  return session?.user as { id?: string; role?: string; name?: string } | undefined;
}

async function getSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireUser() {
  return getSession();
}

export async function requireEditor() {
  const session = await getSession();
  const role = getSessionUser(session)?.role ?? "";
  if (!canEdit(role)) redirect("/dashboard");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  const role = getSessionUser(session)?.role ?? "";
  if (!isSuperAdmin(role)) redirect("/dashboard");
  return session;
}

// Alias for clarity in new code
export const requireSuperAdmin = requireAdmin;

export async function requireSportAdmin() {
  return requireEditor();
}

// Returns null for super_admin (no filter) or array of sport names for sport_admin
export async function getSessionSportFilter(session: Awaited<ReturnType<typeof auth>>): Promise<string[] | null> {
  const user = getSessionUser(session);
  if (!user?.id || !user.role) return null;
  if (isSuperAdmin(user.role)) return null;

  const db = getDb();
  const assignments = await db
    .select({ sportName: sports.name })
    .from(userSportAssignments)
    .innerJoin(sports, eq(userSportAssignments.sportId, sports.id))
    .where(eq(userSportAssignments.userId, user.id));

  // If no assignments, sport_admin sees nothing (not everything)
  return assignments.map(a => a.sportName);
}

// Returns assigned sport IDs for sport_admin, null for super_admin
export async function getSessionSportIdFilter(session: Awaited<ReturnType<typeof auth>>): Promise<string[] | null> {
  const user = getSessionUser(session);
  if (!user?.id || !user.role) return null;
  if (isSuperAdmin(user.role)) return null;

  const db = getDb();
  const assignments = await db
    .select({ sportId: userSportAssignments.sportId })
    .from(userSportAssignments)
    .where(eq(userSportAssignments.userId, user.id));

  return assignments.map(a => a.sportId);
}

// Call this from server pages — avoids the session type-passing issue
export async function getMyAllowedSports(): Promise<string[] | null> {
  const session = await auth();
  if (!session?.user) return [];
  return getSessionSportFilter(session);
}

export async function getPendingResultsCount(): Promise<number> {
  const session = await auth();
  if (!session?.user) return 0;
  const role = getSessionUser(session)?.role ?? "";
  if (!isSuperAdmin(role)) return 0;

  const { getDb } = await import("@/db");
  const { results } = await import("@/db/schema");
  const { count, eq } = await import("drizzle-orm");
  const db = getDb();
  const [row] = await db.select({ cnt: count() }).from(results).where(eq(results.status, "pending"));
  return row?.cnt ?? 0;
}
