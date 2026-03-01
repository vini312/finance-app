/**
 * analytics.controller.js
 * Request/response handling for the analytics/dashboard endpoint.
 */

const store   = require("../data/store");
const { buildAnalytics } = require("../services/analytics.service");

// GET /api/analytics
function summary(req, res) {
  const { startDate, endDate } = req.query;
  let transactions = store.getTransactions();

  // Remove transactions older than startDate, if provided
  transactions = startDate ? transactions.filter((t) => t.date >= startDate) : transactions;
  // Remove transactions newer than endDate, if provided
  transactions = endDate ? transactions.filter((t) => t.date <= endDate) : transactions;

  res.json(buildAnalytics(transactions, store.getCategories()));
}

module.exports = { summary };
