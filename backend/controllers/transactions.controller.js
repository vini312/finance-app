/**
 * transactions.controller.js — Transaction Request Handlers (MongoDB)
 * ─────────────────────────────────────────────────────────────────────────────
 * All operations go to MongoDB via the Transaction Mongoose model.
 * Filtering, sorting, and aggregation are pushed to the database engine rather
 * than loading records into Node memory.
 *
 * PERFORMANCE PHILOSOPHY:
 *   "Do the work in the database, not in Node."
 *   MongoDB's query engine uses indexes, runs in optimised C++, and processes
 *   data without allocating large JS arrays on Node's heap.
 */

import Transaction from "../models/Transaction.js";
import Category from "../models/Category.js";
import { parseCSV } from "../services/csvParser.service.js";

function normalizeTxnId(t) {
  if (!t) return t;
  if (t.id) return t;
  if (t._id) return { ...t, id: t._id.toString?.() || String(t._id) };
  return t;
}

// ── POST /api/transactions/upload ────────────────────────────────────────────
/**
 * Parses an uploaded CSV and bulk-inserts the results.
 * insertMany() is a single batch write — one DB round-trip for any number of rows.
 * ordered: false lets MongoDB continue inserting after an individual failure.
 */
export async function upload(req, res) {
  if (!req.file) {
    const err = new Error("No file provided");
    err.status = 400;
    throw err;
  }

  // parseCSV returns an object with 'imported' array and 'errors' array
  const { imported, errors } = await parseCSV(req.file.buffer, req.file.originalname);

  let savedDocs = [];
  if (imported.length > 0) {
    savedDocs = await Transaction.insertMany(imported, { ordered: false });
  }

  res.json({
    imported:     savedDocs.length,
    errors:       errors.length,
    errorDetails: errors,
    transactions: savedDocs,
  });
}

// ── GET /api/transactions ────────────────────────────────────────────────────
/**
 * Returns a filtered, sorted list of transactions via MongoDB queries.
 *
 * Filter object is built incrementally — only conditions with a provided
 * query param are added. An empty {} matches all documents.
 *
 * Text search uses the { description: "text" } index — far faster than $regex.
 * All sorts are applied at the DB level so indexes can serve them.
 * .lean() returns plain JS objects, skipping Mongoose hydration overhead.
 */
export async function list(req, res) {
  const { search, categoryId, startDate, endDate, type, sortBy, sortDir } = req.query;

  const filter = {};

  if (search) {
    filter.$text = { $search: search };
  }

  if (categoryId && categoryId !== "all") {
    filter.categoryId = categoryId;
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = startDate;
    if (endDate)   filter.date.$lte = endDate;
  }

  if (type === "income") {
    filter.amount = { $gt: 0 };
  } else if (type === "expense") {
    filter.amount = { $lt: 0 };
  }

  const dir = sortDir === "asc" ? 1 : -1;
  let sort = { date: -1 };

  if (sortBy === "amount")           sort = { amount: dir };
  else if (sortBy === "description") sort = { description: dir };
  else                               sort = { date: dir };

  const projection = search ? { score: { $meta: "textScore" } } : {};

  const transactions = await Transaction.find(filter, projection).sort(sort).lean();
  res.json(transactions.map(normalizeTxnId));
}

// ── PATCH /api/transactions/:id ──────────────────────────────────────────────
/**
 * Partially updates a transaction (used for re-categorisation).
 * { new: true } returns the document AFTER the update.
 * { runValidators: true } runs schema validators on the updated fields.
 */
export async function update(req, res) {
  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).lean();

  if (!transaction) {
    const err = new Error("Transaction not found");
    err.status = 404;
    throw err;
  }

  res.json(normalizeTxnId(transaction));
}

// ── DELETE /api/transactions/:id ─────────────────────────────────────────────
/**
 * Deletes a single transaction by its MongoDB _id.
 */
export async function remove(req, res) {
  await Transaction.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}

// ── DELETE /api/transactions ─────────────────────────────────────────────────
/**
 * Deletes ALL transactions in one DB command.
 */
export async function removeAll(_req, res) {
  await Transaction.deleteMany({});
  res.json({ success: true });
}

// ── GET /api/export ──────────────────────────────────────────────────────────
/**
 * Exports all transactions as a downloadable CSV file.
 * Fetches transactions and categories in parallel with Promise.all() —
 * both queries are independent so they run concurrently, halving latency.
 * A Map lookup resolves category names in O(1) per row.
 */
export async function exportCSV(_req, res) {
  const [transactions, categories] = await Promise.all([
    Transaction.find({}).sort({ date: -1 }).lean(),
    Category.find({}).lean(),
  ]);

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const header = "Date,Description,Amount,Category,Balance\n";
  const rows   = transactions.map((t) => {
    const catName = catMap[t.categoryId] || "Other";
    return `"${t.date}","${t.description}",${t.amount},"${catName}",${t.balance ?? ""}`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
  res.send(header + rows.join("\n"));
}
