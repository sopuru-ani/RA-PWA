import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { connectDB } from "./lib/connect.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

/** Whether an Origin header is allowed (explicit list + localhost in development) */
function isAllowedOrigin(origin: string): boolean {
  if (env.corsOrigins.includes(origin)) {
    return true;
  }
  if (env.nodeEnv === "development") {
    try {
      const { hostname } = new URL(origin);
      return hostname === "localhost" || hostname === "127.0.0.1";
    } catch {
      return false;
    }
  }
  return false;
}

// Allow the Next.js frontend to call this API with credentials (cookies)
app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser clients (curl, Postman) may omit Origin
      if (!origin) {
        callback(null, true);
        return;
      }
      if (isAllowedOrigin(origin)) {
        // Must echo the exact origin when credentials: true (not "*")
        callback(null, origin);
        return;
      }
      console.warn(
        `CORS blocked origin: ${origin}. Allowed: ${env.corsOrigins.join(", ")}`,
      );
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check for deployments and local smoke tests
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// All migrated API routes live under /api/*
app.use("/api", apiRouter);

app.use(errorHandler);

async function start() {
  // Must connect before accepting traffic — /db models use the same mongoose instance
  await connectDB();

  app.listen(env.port, () => {
    console.log(
      `Express API listening on http://localhost:${env.port} (env: ${env.nodeEnv})`,
    );
    console.log(`CORS origins: ${env.corsOrigins.join(", ")}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
