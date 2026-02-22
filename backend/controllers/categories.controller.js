/**
 * categories.controller.js
 * Request/response handling for category routes.
 */

const { v4: uuidv4 } = require("uuid");
const store = require("../data/store");

// GET /api/categories
function list(_req, res) {
  res.json(store.getCategories());
}

// POST /api/categories
function create(req, res) {
  const { name, color, icon } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const category = { id: uuidv4(), name, color: color || "#888888", icon: icon || "📁" };
  store.setCategories([...store.getCategories(), category]);
  res.status(201).json(category);
}

// PATCH /api/categories/:id
function update(req, res) {
  const cats = store.getCategories();
  const idx  = cats.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Category not found" });

  cats[idx] = { ...cats[idx], ...req.body };
  store.setCategories(cats);
  res.json(cats[idx]);
}

// DELETE /api/categories/:id
function remove(req, res) {
  const { id } = req.params;

  // Move transactions in deleted category to "Other"
  store.setTransactions(
    store.getTransactions().map((t) => (t.categoryId === id ? { ...t, categoryId: "8" } : t))
  );
  store.setCategories(store.getCategories().filter((c) => c.id !== id));
  res.json({ success: true });
}

module.exports = { list, create, update, remove };
