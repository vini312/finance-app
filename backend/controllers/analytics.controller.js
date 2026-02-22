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

  if (startDate) transactions = transactions.filter((t) => t.date >= startDate);
  if (endDate)   transactions = transactions.filter((t) => t.date <= endDate);

  res.json(buildAnalytics(transactions, store.getCategories()));
}

module.exports = { summary };
