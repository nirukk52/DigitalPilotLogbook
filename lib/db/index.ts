/**
 * Database connection singleton for Neon serverless Postgres
 * Uses Drizzle ORM for type-safe queries
 * Connection is lazily initialized to avoid build-time errors
 */
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let sql: NeonQueryFunction<false, false> | null = null;
let _db: NeonHttpDatabase<typeof schema> | null = null;

/**
 * Gets the database instance, lazily initializing the connection
 * Throws an error if DATABASE_URL is not configured
 */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Please configure your database connection."
      );
    }
    sql = neon(process.env.DATABASE_URL);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

/**
 * @deprecated Use getDb() instead for lazy initialization
 * This export is kept for backwards compatibility but will fail at build time
 * if DATABASE_URL is not set
 */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    return getDb()[prop as keyof NeonHttpDatabase<typeof schema>];
  },
});
