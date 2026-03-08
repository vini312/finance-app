import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "../db/db.js";
import Category from "../models/Category.js";

// Default Categories Seed Data
// The "id" field is the stable string key used as categoryId on transactions.
// "other" (id) is the permanent fallback category — never delete it.
const SEED_CATEGORIES = [
  {
    id:       "food",
    name:     "Food & Dining",
    color:    "#FF6B6B",
    icon:     "🍔",
    keywords: ["restaurant", "cafe", "coffee", "food", "pizza", "burger", "sushi", "mcdonalds", "kfc", "subway", "starbucks", "uber eats", "doordash", "grubhub"],
  },
  {
    id:       "transport",
    name:     "Transport",
    color:    "#4ECDC4",
    icon:     "🚗",
    keywords: ["uber", "lyft", "taxi", "bus", "train", "metro", "fuel", "gas", "parking", "toll", "transit"],
  },
  {
    id:       "shopping",
    name:     "Shopping",
    color:    "#45B7D1",
    icon:     "🛍️",
    keywords: ["amazon", "walmart", "target", "costco", "shop", "store", "market", "mall", "purchase"],
  },
  {
    id:       "entertainment",
    name:     "Entertainment",
    color:    "#96CEB4",
    icon:     "🎬",
    keywords: ["netflix", "spotify", "disney", "hulu", "cinema", "movie", "concert", "game", "steam"],
  },
  {
    id:       "utilities",
    name:     "Utilities",
    color:    "#FFEAA7",
    icon:     "💡",
    keywords: ["electric", "water", "internet", "phone", "utility", "bill", "insurance"],
  },
  {
    id:       "healthcare",
    name:     "Healthcare",
    color:    "#DDA0DD",
    icon:     "🏥",
    keywords: ["pharmacy", "doctor", "hospital", "medical", "dental", "health", "clinic"],
  },
  {
    id:       "income",
    name:     "Income",
    color:    "#98FB98",
    icon:     "💰",
    keywords: ["salary", "payroll", "paycheck", "income", "deposit", "transfer in", "refund"],
  },
  {
    id:       "other",
    name:     "Other",
    color:    "#D3D3D3",
    icon:     "📦",
    keywords: [],
  },
];

async function seedCategories() {
  try {
    await connectDB();

    const count = await Category.countDocuments();

    if (count === 0) {
      await Category.insertMany(SEED_CATEGORIES);
      console.log(`🌱 Seeded ${SEED_CATEGORIES.length} default categories`);
    } else {
      console.log(`ℹ️ Categories collection already has ${count} documents — skipping seed`);
    }
  } catch (err) {
    console.error("❌ Failed to seed categories:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedCategories();

