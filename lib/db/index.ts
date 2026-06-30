import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let cached: NeonHttpDatabase<typeof schema> | null = null;

/**
 * Returns the Drizzle client, creating it on first use. Lazy so a build
 * without DATABASE_URL (e.g. fresh clone, CI) doesn't crash at import time.
 */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local.",
    );
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}

export { schema };
