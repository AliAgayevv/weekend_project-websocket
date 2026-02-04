import { envConfig } from "./src/config/env";
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!envConfig.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env file");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: envConfig.DATABASE_URL,
  },
});
