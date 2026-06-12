/**
 * One-off data migration (idempotent — safe to re-run):
 * 1. Sets performance_unit on standard timed/measured disciplines
 *    (Athletics + Swimming) that are still "none".
 * 2. Parses results.performance text into results.performance_value
 *    wherever the value is missing and the text is parseable.
 *
 * Run with: npx tsx scripts/backfill-performance-values.ts
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { results, sports, sportDisciplines } from "../db/schema";
import { parsePerformance, type PerformanceUnit } from "../lib/performance";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

// Standard units for seeded disciplines. Team/board sports stay "none".
const UNIT_ASSIGNMENTS: Record<string, Record<string, PerformanceUnit>> = {
  Athletics: {
    "100m": "seconds", "200m": "seconds", "400m": "seconds", "800m": "seconds",
    "1500m": "seconds", "5000m": "seconds", "10000m": "seconds",
    "110m Hurdles": "seconds", "400m Hurdles": "seconds",
    "3000m Steeplechase": "seconds", "4x100m Relay": "seconds", "4x400m Relay": "seconds",
    "Long Jump": "metres", "High Jump": "metres", "Triple Jump": "metres",
    "Pole Vault": "metres", "Shot Put": "metres", "Discus Throw": "metres",
    "Javelin Throw": "metres", "Hammer Throw": "metres",
  },
  Swimming: {
    "50m Freestyle": "seconds", "100m Freestyle": "seconds", "200m Freestyle": "seconds",
    "400m Freestyle": "seconds", "100m Backstroke": "seconds", "200m Backstroke": "seconds",
    "100m Breaststroke": "seconds", "200m Breaststroke": "seconds",
    "100m Butterfly": "seconds", "200m Butterfly": "seconds",
    "200m Individual Medley": "seconds", "400m Individual Medley": "seconds",
  },
};

async function main() {
  // 1. Assign units where still unset
  let unitsSet = 0;
  for (const [sportName, disciplines] of Object.entries(UNIT_ASSIGNMENTS)) {
    const [sport] = await db.select({ id: sports.id }).from(sports).where(eq(sports.name, sportName)).limit(1);
    if (!sport) continue;
    for (const [disciplineName, unit] of Object.entries(disciplines)) {
      const updated = await db
        .update(sportDisciplines)
        .set({ performanceUnit: unit })
        .where(and(
          eq(sportDisciplines.sportId, sport.id),
          eq(sportDisciplines.name, disciplineName),
          eq(sportDisciplines.performanceUnit, "none")
        ));
      if (updated.rowsAffected > 0) {
        unitsSet++;
        console.log(`unit set: ${sportName} / ${disciplineName} → ${unit}`);
      }
    }
  }
  console.log(`\n${unitsSet} discipline unit(s) assigned`);

  // 2. Build unit lookup and backfill performance_value
  const unitRows = await db
    .select({ sport: sports.name, discipline: sportDisciplines.name, unit: sportDisciplines.performanceUnit })
    .from(sportDisciplines)
    .innerJoin(sports, eq(sportDisciplines.sportId, sports.id));
  const unitByKey = new Map(unitRows.map((r) => [`${r.sport}|${r.discipline}`, r.unit as PerformanceUnit]));

  const rows = await db
    .select({ id: results.id, sport: results.sport, discipline: results.discipline, performance: results.performance })
    .from(results)
    .where(and(isNotNull(results.performance), isNull(results.performanceValue)));

  let parsedCount = 0, skippedCount = 0;
  for (const row of rows) {
    const unit = unitByKey.get(`${row.sport}|${row.discipline}`) ?? "none";
    const value = parsePerformance(row.performance, unit);
    if (value === null) { skippedCount++; continue; }
    await db.update(results).set({ performanceValue: value }).where(eq(results.id, row.id));
    parsedCount++;
    console.log(`parsed: "${row.performance}" (${row.sport}/${row.discipline}, ${unit}) → ${value}`);
  }
  console.log(`\n${rows.length} row(s) examined, ${parsedCount} backfilled, ${skippedCount} not parseable/no unit`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
