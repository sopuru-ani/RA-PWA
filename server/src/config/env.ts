import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load server/.env first, then project root .env.local / .env as fallback
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Typed, validated environment variables for the Express server */
export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongodbUri: requireEnv("MONGODB_URI"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: requireEnv("JWT_LIMIT"),
  corsOrigins: (
    process.env.CORS_ORIGIN ??
    "http://localhost:3000,https://localhost:3000"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  cookieSecure: process.env.COOKIE_SECURE === "true",
  nodeEnv: process.env.NODE_ENV ?? "development",
};
