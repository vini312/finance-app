/**
 * categories.controller.js — Category Request Handlers (MongoDB)
 * ─────────────────────────────────────────────────────────────────────────────
 * CRUD operations backed by the Category Mongoose model.
 *
 * CUSTOM STRING IDs:
 *   Categories use a human-readable string `id` field (e.g. "food", "transport")
 *   rather than MongoDB ObjectIds. The id is a URL-safe slug derived from the
 *   name with a short UUID suffix to prevent collisions.
 */

import { v4 as uuidv4 } from "uuid";
import Category          from "../models/Category.js";
import Transaction       from "../models/Transaction.js";

// ── GET /api/categories ──────────────────────────────────────────────────────
export async function list(_req, res) {
  const categories = await Category.find({}).sort({ name: 1 }).lean();
  res.json(categories);
}

// ── POST /api/categories ─────────────────────────────────────────────────────
/**
 * Creates a new user-defined category.
 * ID is a slugified name + short UUID suffix, e.g. "food-dining-a1b2c3d4".
 */
export async function create(req, res) {
  const { name, color, icon } = req.body;

  if (!name) {
    const err = new Error("Name is required");
    err.status = 400;
    throw err;
  }

  const slug    = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const shortId = uuidv4().split("-")[0];
  const id      = `${slug}-${shortId}`;

  const category = await Category.create({
    id,
    name,
    color: color || "#888888",
    icon:  icon  || "📁",
  });

  res.status(201).json(category.toJSON());
}

// ── PATCH /api/categories/:id ────────────────────────────────────────────────
export async function update(req, res) {
  const category = await Category.findOneAndUpdate(
    { id: req.params.id },
    { $set: req.body },
    { new: true, runValidators: true }
  ).lean();

  if (!category) {
    const err = new Error("Category not found");
    err.status = 404;
    throw err;
  }

  res.json(category);
}

// ── DELETE /api/categories/:id ───────────────────────────────────────────────
/**
 * Deletes a category and reassigns its transactions to "other" in one
 * updateMany() DB command — no JS iteration needed.
 * Reassignment happens BEFORE deletion so transactions are never orphaned.
 */
export async function remove(req, res) {
  const { id } = req.params;

  await Transaction.updateMany(
    { categoryId: id },
    { $set: { categoryId: "other" } }
  );

  await Category.findOneAndDelete({ id });

  res.json({ success: true });
}
