/**
 * customMetrics.controller.js — Custom Metric Request Handlers (MongoDB)
 * ─────────────────────────────────────────────────────────────────────────────
 * CRUD for user-defined dashboard metrics.
 */

import CustomMetric from "../models/CustomMetric.js";

// ── GET /api/custom-metrics ──────────────────────────────────────────────────
export async function list(_req, res) {
  const metrics = await CustomMetric.find({}).sort({ createdAt: 1 }).lean();
  const withId = metrics.map((m) => ({
    ...m,
    id: m._id.toString(),
    _id: undefined,
  }));
  res.json(withId);
}

// ── POST /api/custom-metrics ──────────────────────────────────────────────────
export async function create(req, res) {
  const { name, icon, formula, format } = req.body;

  if (!name?.trim() || !formula?.trim()) {
    const err = new Error("Name and formula are required");
    err.status = 400;
    throw err;
  }

  const metric = await CustomMetric.create({
    name:    name.trim(),
    icon:    icon?.trim() || "🧮",
    formula: formula.trim(),
    format:  ["number", "currency", "percent"].includes(format) ? format : "number",
  });

  res.status(201).json({
    ...metric.toJSON(),
    id: metric._id.toString(),
  });
}

// ── DELETE /api/custom-metrics/:id ────────────────────────────────────────────
export async function remove(req, res) {
  const { id } = req.params;
  const result = await CustomMetric.findByIdAndDelete(id);

  if (!result) {
    const err = new Error("Custom metric not found");
    err.status = 404;
    throw err;
  }

  res.json({ success: true });
}
