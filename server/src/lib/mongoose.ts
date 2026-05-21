/**
 * Use the project root's mongoose so /db models and connectDB share one connection.
 * (A separate copy in server/node_modules caused buffering timeouts on login.)
 */
import mongoose from "mongoose";

export default mongoose;
