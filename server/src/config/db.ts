import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { envConfig } from "./env";

if (!envConfig.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export const pool = new Pool({
  connectionString: envConfig.DATABASE_URL,
});

export const db = drizzle(pool);
