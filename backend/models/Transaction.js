/**
 * models/Transaction.js — Mongoose Transaction Schema
 * ─────────────────────────────────────────────────────────────────────────────
 * Defines the shape, types, validation, and indexes for transaction documents
 * stored in the "transactions" MongoDB collection.
 *
 * INDEXES:
 *   1. { date: -1 }              — primary sort; serves date range queries
 *   2. { categoryId: 1 }         — category filter
 *   3. { amount: 1 }             — income/expense filter and top-expenses sort
 *   4. { description: "text" }   — full-text search (faster than $regex)
 *   5. { date: -1, categoryId: 1 } — compound for analytics grouping
 */

import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    date: {
      type:     String,
      required: true,
      trim:     true,
    },
    description: {
      type:    String,
      default: "Unknown",
      trim:    true,
    },
    // Positive = income, Negative = expense.
    amount: {
      type:     Number,
      required: true,
    },
    // Running account balance — may be absent in some CSV formats.
    balance: {
      type:    Number,
      default: null,
    },
    // References a Category document's string id (e.g. "food", "transport").
    categoryId: {
      type:    String,
      default: "other",
      trim:    true,
    },
    // Which CSV file this transaction came from — useful for debugging imports.
    source: {
      type:    String,
      default: "",
      trim:    true,
    },
  },
  {
    // Mongoose adds createdAt and updatedAt automatically.
    timestamps: true,

    // toJSON transform: expose _id as plain string "id", strip internal fields.
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ categoryId: 1 });
TransactionSchema.index({ amount: 1 });
TransactionSchema.index({ description: "text" });
TransactionSchema.index({ date: -1, categoryId: 1 });

export default mongoose.model("Transaction", TransactionSchema);
