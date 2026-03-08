/**
 * models/CustomMetric.js — User-Defined Dashboard Metric
 * ─────────────────────────────────────────────────────────────────────────────
 * Stores custom formula-based metrics that users create on the dashboard.
 * Persisted in MongoDB so they survive across sessions and devices.
 */

import mongoose from "mongoose";

const CustomMetricSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    icon: {
      type:    String,
      default: "🧮",
      trim:    true,
    },
    formula: {
      type:     String,
      required: true,
      trim:     true,
    },
    format: {
      type:    String,
      enum:    ["number", "currency", "percent"],
      default: "number",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.model("CustomMetric", CustomMetricSchema);
