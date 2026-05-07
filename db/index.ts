import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Copy .env.local.example to .env.local and fill in your Turso credentials."
    );
  }
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  _db = drizzle(client, { schema });
  return _db;
}
