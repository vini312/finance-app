/**
 * db/db.js — MongoDB Connection Manager + Seed Data
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsible for:
 *   1. Opening and managing the Mongoose connection to MongoDB
 *   2. Seeding the categories collection with default data on first run
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
import Category from "../models/Category.js";

// ── Default Categories Seed Data ─────────────────────────────────────────────
// Inserted when the categories collection is empty (first run).
// The "id" field is the stable string key used as categoryId on transactions.
// "other" (id) is the permanent fallback category — never delete it.
const SEED_CATEGORIES = [
  { id: "food",          name: "Food & Dining",  color: "#FF6B6B", icon: "🍔" },
  { id: "transport",     name: "Transport",      color: "#4ECDC4", icon: "🚗" },
  { id: "shopping",      name: "Shopping",       color: "#45B7D1", icon: "🛍️" },
  { id: "entertainment", name: "Entertainment",  color: "#96CEB4", icon: "🎬" },
  { id: "utilities",     name: "Utilities",      color: "#FFEAA7", icon: "💡" },
  { id: "healthcare",    name: "Healthcare",     color: "#DDA0DD", icon: "🏥" },
  { id: "income",        name: "Income",         color: "#98FB98", icon: "💰" },
  { id: "other",         name: "Other",          color: "#D3D3D3", icon: "📦" },
];

/**
 * Connects to MongoDB and seeds default categories if the collection is empty.
 *
 * @throws Will throw (and crash the process) if the connection fails.
 *         This is intentional — the API cannot operate without a database.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/financeflow";

  console.log("🔌 Connecting to MongoDB…");

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log(`✅ MongoDB connected → ${mongoose.connection.name}`);

  // countDocuments() is O(1) with the index — does not scan documents
  const count = await Category.countDocuments();

  if (count === 0) {
    await Category.insertMany(SEED_CATEGORIES);
    console.log(`🌱 Seeded ${SEED_CATEGORIES.length} default categories`);
  }
}
