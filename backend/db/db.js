/**
 * db/db.js — MongoDB Connection Manager
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsible for:
 *   1. Opening and managing the Mongoose connection to MongoDB
 *
 * USAGE:
 *   Import connectDB and await it once in server.js before starting the
 *   HTTP listener. All Mongoose models share this connection automatically.
 *
 * CONNECTION STRING:
 *   Set MONGODB_URI in .env to point to your MongoDB instance.
 *   Default falls back to a local instance: mongodb://localhost:27017/financeflow
 *
 * MONGOOSE OPTIONS:
 *   serverSelectionTimeoutMS — how long to wait for MongoDB before giving up.
 *   Set to 5000ms so startup errors surface quickly rather than hanging.
 */

import mongoose from "mongoose";

/**
 * Connects to MongoDB.
 *
 * @throws Will throw (and crash the process) if the connection fails.
 *         This is intentional — the API cannot operate without a database.
 */
export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("env variable MONGODB_URI is not set");
  }

  console.info("🔌 Connecting to MongoDB…");

  await mongoose.connect(
    process.env.MONGODB_URI, 
    {
      serverSelectionTimeoutMS: 5000,
    }
  );

  console.info(`✅ MongoDB connected → ${mongoose.connection.name}`);
}
