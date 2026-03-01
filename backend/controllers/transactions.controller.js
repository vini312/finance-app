/**
 * transactions.controller.js
 *
 * Express 5: async functions automatically forward thrown errors to
 * the error handler — no try/catch wrapper needed in route handlers.
 */

const store        = require("../data/store");
const { parseCSV } = require("../services/csvParser.service");

// POST /api/transactions/upload
// Use multer middleware to handle file upload, then parse CSV and store transactions in memory
async function upload(req, res) {
  if (!req.file) {
    const err = new Error("No file provided");
    err.status = 400;
    throw err;
  }

  // parseCSV returns an object with 'imported' array and 'errors' array
  const { imported, errors } = parseCSV(req.file.buffer, req.file.originalname);

  // Append imported transactions to existing ones in the store
  store.setTransactions([...store.getTransactions(), ...imported]);

  // Return summary of import results
  res.json({
    imported:     imported.length,
    errors:       errors.length,
    errorDetails: errors,
    transactions: imported,
  });
}

// GET /api/transactions
function list(req, res) {
  const { search, categoryId, startDate, endDate, type, sortBy, sortDir } = req.query;
  let result = [...store.getTransactions()];

  if (search)                             result = result.filter((t) => t.description.toLowerCase().includes(search.toLowerCase()));
  if (categoryId && categoryId !== "all") result = result.filter((t) => t.categoryId === categoryId);
  if (startDate)                          result = result.filter((t) => t.date >= startDate);
  if (endDate)                            result = result.filter((t) => t.date <= endDate);
  if (type === "income")                  result = result.filter((t) => t.amount > 0);
  if (type === "expense")                 result = result.filter((t) => t.amount < 0);

  const dir = sortDir === "asc" ? 1 : -1;
  if (sortBy === "amount")           result.sort((a, b) => (a.amount - b.amount) * dir);
  else if (sortBy === "description") result.sort((a, b) => a.description.localeCompare(b.description) * dir);
  else                               result.sort((a, b) => (a.date < b.date ? 1 : -1) * dir);

  res.json(result);
}

// PATCH /api/transactions/:id
function update(req, res) {
  const txns = store.getTransactions();
  const idx  = txns.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    const err = new Error("Transaction not found");
    err.status = 404;
    throw err;
  }
  txns[idx] = { ...txns[idx], ...req.body };
  store.setTransactions(txns);
  res.json(txns[idx]);
}

// DELETE /api/transactions/:id
function remove(req, res) {
  store.setTransactions(store.getTransactions().filter((t) => t.id !== req.params.id));
  res.json({ success: true });
}

// GET /api/export
function exportCSV(_req, res) {
  const categories = store.getCategories();

  const header = "Date,Description,Amount,Category,Balance\n";
  
  const rows   = store.getTransactions().map((t) => {
    const cat = categories.find((c) => c.id === t.categoryId)?.name || "Other";
    return `"${t.date}","${t.description}",${t.amount},"${cat}",${t.balance ?? ""}`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
  res.send(header + rows.join("\n"));
}

module.exports = { upload, list, update, remove, exportCSV };
