/**
 * categorizer.service.js — Auto-Categorisation by Keyword
 * ─────────────────────────────────────────────────────────────────────────────
 * Maps transaction descriptions to category ID slugs using keyword arrays
 * loaded from the Category collection in MongoDB.
 *
 * Category IDs are human-readable slugs matching the seed data in db/db.js:
 *   "food", "transport", "shopping", "entertainment", "utilities",
 *   "healthcare", "income", "other"
 */

import Category from "../models/Category.js";

const DEFAULT_CATEGORY = "other";

/**
 * Loads categorisation rules from the database.
 * Each rule is derived from a category's `keywords` array.
 *
 * @returns {Promise<Array<{ categoryId: string, keywords: string[] }>>}
 */
export async function loadCategorizerRules() {
  const categories = await Category.find({}, { id: 1, keywords: 1 }).lean();

  return categories
    .filter((c) => Array.isArray(c.keywords) && c.keywords.length > 0)
    .map((c) => ({
      categoryId: c.id,
      keywords:   c.keywords
        .filter((k) => typeof k === "string" && k.trim().length > 0)
        .map((k) => k.toLowerCase()),
    }));
}

/**
 * Returns the best-matching category slug for a transaction description using
 * the provided rules array.
 *
 * @param  {string} description
 * @param  {{ categoryId: string, keywords: string[] }[]} rules
 * @returns {string} — a category slug (e.g. "food") or "other"
 */
export function autoCategory(description, rules) {
  const d = (description || "").toLowerCase();

  const match = (rules || []).find((rule) =>
    rule.keywords.some((keyword) => keyword && d.includes(keyword))
  );

  return match ? match.categoryId : DEFAULT_CATEGORY;
}
