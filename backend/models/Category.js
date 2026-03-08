/**
 * models/Category.js — Mongoose Category Schema
 * ─────────────────────────────────────────────────────────────────────────────
 * Defines the shape and indexes for category documents stored in the
 * "categories" MongoDB collection.
 *
 * ID STRATEGY:
 *   Categories use a custom string `id` field (e.g. "food", "transport")
 *   rather than MongoDB's auto-generated ObjectId. This makes the seed data
 *   readable and lets the categorizer service reference categories by a
 *   meaningful name rather than a random hex string.
 *
 *   We also keep Mongoose's default _id so that create/save works. The frontend
 *   and API use the string `id` for lookups and keys; _id is present for
 *   compatibility with code that expects it.
 */

import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    // Stable human-readable identifier (e.g. "food", "transport", "other")
    id: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
    },
    // Display name shown in dropdowns, chips, and charts
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    // Hex colour string (e.g. "#FF6B6B")
    color: {
      type:    String,
      default: "#888888",
      trim:    true,
    },
    // Emoji icon displayed next to the category name
    icon: {
      type:    String,
      default: "📁",
    },
    // Array of lowercase keyword strings used for auto-categorisation
    keywords: {
      type:    [String],
      default: [],
      trim:    true,
    },
  },
  {
    toJSON: {
      // Remove __v version key from API responses — it's an internal Mongoose detail.
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.model("Category", CategorySchema);
