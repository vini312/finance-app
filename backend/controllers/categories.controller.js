/**
 * categories.controller.js — Express 5 (no try/catch needed for async throws)
 */

const { v4: uuidv4 } = require("uuid");
const store = require("../data/store");

function list(_req, res) {
  res.json(store.getCategories());
}

function create(req, res) {
  const { name, color, icon } = req.body;
  if (!name) {
    const err = new Error("Name is required");
    err.status = 400;
    throw err;
  }
  const category = { id: uuidv4(), name, color: color || "#888888", icon: icon || "📁" };
  store.setCategories([...store.getCategories(), category]);
  res.status(201).json(category);
}

function update(req, res) {
  const cats = store.getCategories();
  const idx  = cats.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    const err = new Error("Category not found");
    err.status = 404;
    throw err;
  }
  cats[idx] = { ...cats[idx], ...req.body };
  store.setCategories(cats);
  res.json(cats[idx]);
}

function remove(req, res) {
  const { id } = req.params;
  store.setTransactions(
    store.getTransactions().map((t) => (t.categoryId === id ? { ...t, categoryId: "8" } : t))
  );
  store.setCategories(store.getCategories().filter((c) => c.id !== id));
  res.json({ success: true });
}

module.exports = { list, create, update, remove };
