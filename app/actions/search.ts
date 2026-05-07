"use server";

import { getDb } from "@/db";
import { players, events } from "@/db/schema";
import { like, or, eq, and, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";

export type SearchResult = {
  type: "player" | "event";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  await requireUser();
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const db = getDb();
  const pattern = `%${q}%`;

  const [playerRows, eventRows] = await Promise.all([
    db
      .select({ id: players.id, fullName: players.fullName, employeeId: players.employeeId, branch: players.branch, active: players.active })
      .from(players)
      .where(
        and(
          eq(players.active, true),
          or(
            like(players.fullName, pattern),
            like(players.employeeId, pattern),
            like(players.branch, pattern)
          )
        )
      )
      .limit(5),

    db
      .select({ id: events.id, name: events.name, eventDate: events.eventDate, type: events.type })
      .from(events)
      .where(like(events.name, pattern))
      .orderBy(desc(events.eventDate))
      .limit(4),
  ]);

  const results: SearchResult[] = [
    ...playerRows.map((p) => ({
      type: "player" as const,
      id: p.id,
      title: p.fullName,
      subtitle: `${p.employeeId} · ${p.branch}`,
      href: `/players/${p.id}`,
    })),
    ...eventRows.map((e) => ({
      type: "event" as const,
      id: e.id,
      title: e.name,
      subtitle: new Date(e.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      href: `/events/${e.id}`,
    })),
  ];

  return results;
}
