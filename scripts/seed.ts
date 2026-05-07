import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { users, sports } from "../db/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function seed() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await db
    .insert(users)
    .values({
      id: randomUUID(),
      username: "admin",
      passwordHash,
      fullName: "System Administrator",
      role: "admin",
      active: true,
    })
    .onConflictDoNothing();

  console.log("✅ Admin user created (username: admin, password: ChangeMe123!)");

  const INITIAL_SPORTS = ["Athletics","Swimming","Badminton","Cricket","Football","Volleyball","Basketball","Table Tennis","Carrom","Chess"];
  for (const name of INITIAL_SPORTS) {
    await db.insert(sports).values({ id: randomUUID(), name, active: true }).onConflictDoNothing();
  }
  console.log(`✅ ${INITIAL_SPORTS.length} sports seeded`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
