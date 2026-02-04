import dotenv from "dotenv";
dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: "development" | "production";
  DATABASE_URL?: string | undefined;
  HOST?: string | undefined;
}

export const envConfig: EnvConfig = {
  PORT: parseInt(process.env.PORT || "3000"),
  NODE_ENV:
    (process.env.NODE_ENV as "development" | "production") || "development",
  DATABASE_URL: process.env.DATABASE_URL,
  HOST: process.env.HOST,
};

export const validateEnv = (): void => {
  // const requiredVars = ["PORT", "NODE_ENV"];

  if (envConfig.NODE_ENV === "development") {
    Object.keys(envConfig).forEach((key) => {
      console.log(`[ENV] - ${key}: ${envConfig[key as keyof EnvConfig]}`);
    });
  }
};
