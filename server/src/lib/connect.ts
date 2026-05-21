import mongoose from "./mongoose.js";
import { env } from "../config/env.js";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Reuse a single connection across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var mongooseServer: MongooseCache | undefined;
}

let cached = global.mongooseServer;

/** Connect to MongoDB once and reuse the connection for all requests */
export async function connectDB(): Promise<typeof mongoose> {
  if (!cached) {
    cached = global.mongooseServer = { conn: null, promise: null };
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.mongodbUri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
      })
      .then((m) => {
        console.log("MongoDB connected");
        return m;
      })
      .catch((err) => {
        cached!.promise = null;
        console.error("MongoDB connection failed:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
