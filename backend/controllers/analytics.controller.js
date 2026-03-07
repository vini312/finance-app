/**
 * analytics.controller.js — Analytics via MongoDB Aggregation Pipelines
 * ─────────────────────────────────────────────────────────────────────────────
 * Analytics are computed inside MongoDB using the Aggregation Framework.
 *
 * A single $facet pipeline runs four sub-aggregations on the same matched
 * document set in one round-trip:
 *   totals      — income / expense / count sums
 *   byCategory  — spending grouped by categoryId, sorted desc
 *   byMonth     — income & expenses per YYYY-MM, sorted chronologically
 *   topExpenses — up to 5 largest single expense transactions
 *
 * $match runs first so later stages operate on a smaller document set,
 * and can use the { date: -1 } index to skip irrelevant records entirely.
 */

import Transaction from "../models/Transaction.js";
import Category from "../models/Category.js";

// ── GET /api/analytics ───────────────────────────────────────────────────────
export async function summary(req, res) {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.date = {};
    if (startDate) dateFilter.date.$gte = startDate;
    if (endDate)   dateFilter.date.$lte = endDate;
  }

  const [result] = await Transaction.aggregate([
    // Stage 1: narrow the working set with the date index
    { $match: dateFilter },

    // Stage 2: four concurrent sub-pipelines over the same matched docs
    {
      $facet: {

        // 2a: overall totals
        totals: [
          {
            $group: {
              _id: null,
              totalIncome: {
                $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] },
              },
              totalExpenses: {
                $sum: { $cond: [{ $lt: ["$amount", 0] }, { $abs: "$amount" }, 0] },
              },
              transactionCount: { $sum: 1 },
            },
          },
        ],

        // 2b: spending by category (absolute amounts, largest first)
        byCategory: [
          {
            $group: {
              _id:   "$categoryId",
              total: { $sum: { $abs: "$amount" } },
              count: { $sum: 1 },
            },
          },
          { $sort:  { total: -1 } },
          { $limit: 20 },
        ],

        // 2c: income & expenses per calendar month
        // $substrCP extracts YYYY-MM from the YYYY-MM-DD date string
        byMonth: [
          {
            $group: {
              _id: { $substrCP: ["$date", 0, 7] },
              income: {
                $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] },
              },
              expenses: {
                $sum: { $cond: [{ $lt: ["$amount", 0] }, { $abs: "$amount" }, 0] },
              },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, month: "$_id", income: 1, expenses: 1 } },
        ],

        // 2d: top 5 largest individual expenses
        topExpenses: [
          { $match: { amount: { $lt: 0 } } },
          { $sort:  { amount: 1 } },
          { $limit: 5 },
          {
            $project: {
              id:          { $toString: "$_id" },
              date:        1,
              description: 1,
              amount:      1,
              categoryId:  1,
              _id:         0,
            },
          },
        ],
      },
    },
  ]);

  // Hydrate category details — fetch all categories once and build a Map
  // for O(1) lookups. Cheaper than a $lookup for a small, stable collection.
  const categories  = await Category.find({}).lean();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const totals = result.totals[0] || { totalIncome: 0, totalExpenses: 0, transactionCount: 0 };

  const byCategory = result.byCategory.map((item) => {
    const cat = categoryMap.get(item._id) || { name: "Other", color: "#D3D3D3", icon: "📦" };
    return {
      id:    item._id,
      name:  cat.name,
      icon:  cat.icon,
      color: cat.color,
      total: item.total,
      count: item.count,
    };
  });

  res.json({
    totalIncome:      totals.totalIncome,
    totalExpenses:    totals.totalExpenses,
    netBalance:       totals.totalIncome - totals.totalExpenses,
    transactionCount: totals.transactionCount,
    byCategory,
    byMonth:     result.byMonth,
    topExpenses: result.topExpenses,
  });
}
