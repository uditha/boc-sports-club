import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { userSportAssignments, sports } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AppRole = "super_admin" | "sport_admin" | "viewer" | "admin" | "editor";

// Explicit session type — avoids depending on NextAuth's overloaded auth() return type
export type AppSession = {
  user?: { id?: string; name?: string | null; email?: string | null; role?: string } | null;
} | null;

export function isSuperAdmin(role: string): boolean {
  return role === "super_admin" || role === "admin";
}

export function canEdit(role: string): boolean {
  return isSuperAdmin(role) || role === "sport_admin" || role === "editor";
}

export function getSessionUser(session: AppSession) {
  return session?.user as { id?: string; role?: string; name?: string } | undefined;
}

type AuthedSession = NonNullable<AppSession>;

async function getSession(): Promise<AuthedSession> {
  const session = (await auth()) as AppSession;
  if (!session?.user) redirect("/login");
  return session as AuthedSession;
}

export async function requireUser(): Promise<AuthedSession> {
  return getSession();
}

export async function requireEditor(): Promise<AuthedSession> {
  const session = await getSession();
  const role = getSessionUser(session)?.role ?? "";
  if (!canEdit(role)) redirect("/dashboard");
  return session;
}

export async function requireAdmin(): Promise<AuthedSession> {
  const session = await getSession();
  const role = getSessionUser(session)?.role ?? "";
  if (!isSuperAdmin(role)) redirect("/dashboard");
  return session;
}

export const requireSuperAdmin = requireAdmin;

export async function requireSportAdmin(): Promise<AuthedSession> {
  return requireEditor();
}

// Returns null for super_admin (no filter), array of sport names for sport_admin
export async function getSessionSportFilter(session: AppSession): Promise<string[] | null> {
  const user = getSessionUser(session);
  if (!user?.id || !user.role) return null;
  if (isSuperAdmin(user.role)) return null;

  const db = getDb();
  const assignments = await db
    .select({ sportName: sports.name })
    .from(userSportAssignments)
    .innerJoin(sports, eq(userSportAssignments.sportId, sports.id))
    .where(eq(userSportAssignments.userId, user.id));

  return assignments.map(a => a.sportName);
}

// Returns assigned sport IDs for sport_admin, null for super_admin
export async function getSessionSportIdFilter(session: AppSession): Promise<string[] | null> {
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

// Call from server pages — self-contained, no session threading needed
export async function getMyAllowedSports(): Promise<string[] | null> {
  const session = (await auth()) as AppSession;
  if (!session?.user) return [];
  return getSessionSportFilter(session);
}

export async function getPendingResultsCount(): Promise<number> {
  const session = (await auth()) as AppSession;
  if (!session?.user) return 0;
  const role = getSessionUser(session)?.role ?? "";
  if (!isSuperAdmin(role)) return 0;

  const db = getDb();
  const { results } = await import("@/db/schema");
  const { count, eq } = await import("drizzle-orm");
  const [row] = await db.select({ cnt: count() }).from(results).where(eq(results.status, "pending"));
  return row?.cnt ?? 0;
}
