/**
 * categorizer.service.js — Auto-Categorisation by Keyword
 * ─────────────────────────────────────────────────────────────────────────────
 * Maps transaction descriptions to category ID slugs using regex pattern rules.
 *
 * Category IDs are human-readable slugs matching the seed data in db/db.js:
 *   "food", "transport", "shopping", "entertainment", "utilities",
 *   "healthcare", "income", "other"
 *
 * To add a new rule: add the category to SEED_CATEGORIES in db/db.js, then
 * add a matching rule here. Nothing else needs to change.
 */

const RULES = [
  {
    categoryId: "food",
    pattern: /restaurant|cafe|coffee|food|pizza|burger|sushi|mcdonalds|kfc|subway|starbucks|uber eats|doordash|grubhub/i,
  },
  {
    categoryId: "transport",
    pattern: /uber|lyft|taxi|bus|train|metro|fuel|gas|parking|toll|transit/i,
  },
  {
    categoryId: "shopping",
    pattern: /amazon|walmart|target|costco|shop|store|market|mall|purchase/i,
  },
  {
    categoryId: "entertainment",
    pattern: /netflix|spotify|disney|hulu|cinema|movie|concert|game|steam/i,
  },
  {
    categoryId: "utilities",
    pattern: /electric|water|internet|phone|utility|bill|insurance/i,
  },
  {
    categoryId: "healthcare",
    pattern: /pharmacy|doctor|hospital|medical|dental|health|clinic/i,
  },
  {
    categoryId: "income",
    pattern: /salary|payroll|paycheck|income|deposit|transfer in|refund/i,
  },
];

const DEFAULT_CATEGORY = "other";

/**
 * Returns the best-matching category slug for a transaction description.
 *
 * @param  {string} description
 * @returns {string} — a category slug (e.g. "food") or "other"
 */
export function autoCategory(description) {
  const d = (description || "").toLowerCase();
  const match = RULES.find((rule) => rule.pattern.test(d));
  return match ? match.categoryId : DEFAULT_CATEGORY;
}
