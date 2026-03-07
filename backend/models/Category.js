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
 *   `_id: false` disables Mongoose's default ObjectId generation so that our
 *   custom string id is the only identifier on these documents.
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
  },
  {
    // Disable auto _id — our custom string id is the sole identifier.
    _id: false,

    toJSON: {
      // Remove __v version key from API responses — it's an internal Mongoose detail.
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

CategorySchema.index({ id: 1 }, { unique: true });

export default mongoose.model("Category", CategorySchema);
