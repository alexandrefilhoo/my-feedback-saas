import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Explicitly load .env.local
config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL!,
  },
});
