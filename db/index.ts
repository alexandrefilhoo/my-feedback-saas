import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

// Configure client specifically for Supabase Transaction Pooler
const client = postgres(connectionString, {
  prepare: false, // Required for PgBouncer
  max: 1, // Limit pool connections per serverless function
  idle_timeout: 20, // Close idle connections quickly
  connect_timeout: 10, // Timeout faster if unable to connect
});

export const db = drizzle(client, { schema });
