/**
 * One-time migration: remove stored raEmail/gaEmail from all Resident documents.
 * Run from server/: npm run migrate:drop-resident-staff-emails
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";

async function main(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
  const collection = mongoose.connection.collection("residents");
  const result = await collection.updateMany(
    {},
    { $unset: { raEmail: "", gaEmail: "" } },
  );

  console.log(
    `Matched ${result.matchedCount} resident(s); removed staff emails from ${result.modifiedCount}.`,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
