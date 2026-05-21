/**
 * Use the project root's mongoose so /db models and connectDB share one connection.
 * (A separate copy in server/node_modules caused buffering timeouts on login.)
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mongoose = require(path.join(rootDir, "node_modules/mongoose")) as typeof import("mongoose");

export default mongoose;
