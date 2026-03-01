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

  return {
    totalIncome,
    totalExpenses,
    netBalance:       totalIncome - totalExpenses,
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

  transactions.forEach(transaction => {
    // Find category details for this transaction's categoryId
    const cat = categories.find((c) => c.id === transaction.categoryId);

    // If we haven't seen this categoryId before, initialize it in the map with category details and zero totals
    if (!map[transaction.categoryId]) {
      map[transaction.categoryId] = { ...cat, total: 0, count: 0 };
    }

    // Add this transaction's amount to the total for its category, and increment the count
    map[transaction.categoryId].total += Math.abs(transaction.amount);
    map[transaction.categoryId].count += 1;
  });

  //
  return Object.values(map).sort((a, b) => b.total - a.total);
}

function groupByMonth(transactions) {
  const map = {};

  transactions.forEach((t) => {
    // Extract the month in YYYY-MM format from the transaction date
    const month = t.date?.slice(0, 7) || "Unknown";

    // Initialize the month in the map if we haven't seen it before
    if (!map[month]) {
      map[month] = { income: 0, expenses: 0 };
    }

    // If the amount is positive, add to income; if negative, add to expenses (as a positive number)
    if (t.amount > 0) {
      map[month].income   += t.amount;
    } else {
      map[month].expenses += Math.abs(t.amount);
    }
  });

  // Convert the map to an array of { month, income, expenses } objects, sorted by month
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
