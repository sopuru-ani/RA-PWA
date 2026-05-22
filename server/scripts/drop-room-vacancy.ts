/**
 * One-time migration: remove stored `vacancy` from all Room documents.
 * Run from server/: npm run migrate:drop-room-vacancy
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";

async function main(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
  const collection = mongoose.connection.collection("rooms");
  const result = await collection.updateMany({}, { $unset: { vacancy: "" } });

  console.log(
    `Matched ${result.matchedCount} room(s); removed vacancy from ${result.modifiedCount}.`,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
