/**
 * analytics.service.js
 * Pure functions that compute dashboard analytics from raw transaction data.
 */

/**
 * Build a full analytics summary from a list of transactions and categories.
 */
function buildAnalytics(transactions, categories) {
  const totalIncome   = sum(transactions.filter((t) => t.amount > 0).map((t) => t.amount));
  const totalExpenses = sum(transactions.filter((t) => t.amount < 0).map((t) => Math.abs(t.amount)));
  const netBalance    = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    transactionCount: transactions.length,
    byCategory:       groupByCategory(transactions, categories),
    byMonth:          groupByMonth(transactions),
    topExpenses:      getTopExpenses(transactions, 5),
  };
}

// ── Private helpers ──────────────────────────────────────────────────────────

function sum(arr) {
  return arr.reduce((acc, n) => acc + n, 0);
}

function groupByCategory(transactions, categories) {
  const map = {};
  transactions.forEach((t) => {
    const cat = categories.find((c) => c.id === t.categoryId) || { name: "Other", color: "#D3D3D3", icon: "📦" };
    if (!map[t.categoryId]) map[t.categoryId] = { ...cat, total: 0, count: 0 };
    map[t.categoryId].total += Math.abs(t.amount);
    map[t.categoryId].count += 1;
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
}

function groupByMonth(transactions) {
  const map = {};
  transactions.forEach((t) => {
    const month = t.date?.slice(0, 7) || "Unknown";
    if (!map[month]) map[month] = { income: 0, expenses: 0 };
    if (t.amount > 0) map[month].income   += t.amount;
    else              map[month].expenses += Math.abs(t.amount);
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));
}

function getTopExpenses(transactions, limit = 5) {
  return transactions
    .filter((t) => t.amount < 0)
    .sort((a, b) => a.amount - b.amount)
    .slice(0, limit);
}

module.exports = { buildAnalytics };
