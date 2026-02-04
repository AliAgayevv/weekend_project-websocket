import dotenv from "dotenv";
dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: "development" | "production";
}

export const envConfig: EnvConfig = {
  PORT: parseInt(process.env.PORT || "3000"),
  NODE_ENV:
    (process.env.NODE_ENV as "development" | "production") || "development",
};

export const validateEnv = (): void => {
  // const requiredVars = ["PORT", "NODE_ENV"];

  if (envConfig.NODE_ENV === "development") {
    Object.keys(envConfig).forEach((key) => {
      console.log(`[ENV] - ${key}: ${envConfig[key as keyof EnvConfig]}`);
    });
  }
};
