/**
 * Database connection singleton for Neon serverless Postgres
 * Uses Drizzle ORM for type-safe queries
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
