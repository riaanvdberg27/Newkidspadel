import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Cap at 10 connections — Neon's free tier allows up to 100 but serverless
  // functions spawn many instances; keeping this low prevents exhaustion.
  max: 10,
  // Close idle connections after 30 s to free Neon compute quickly.
  idleTimeoutMillis: 30_000,
  // Fail fast if a new connection can't be acquired within 5 s.
  connectionTimeoutMillis: 5_000,
})
export const db = drizzle(pool, { schema })
