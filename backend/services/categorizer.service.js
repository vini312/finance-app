/**
 * categorizer.service.js
 * Maps transaction descriptions to category IDs using keyword rules.
 * Add more rules here without touching any other file.
 */

const RULES = [
  {
    categoryId: "1",
    pattern: /restaurant|cafe|coffee|food|pizza|burger|sushi|mcdonalds|kfc|subway|starbucks|uber eats|doordash|grubhub/,
  },
  {
    categoryId: "2",
    pattern: /uber|lyft|taxi|bus|train|metro|fuel|gas|parking|toll|transit/,
  },
  {
    categoryId: "3",
    pattern: /amazon|walmart|target|costco|shop|store|market|mall|purchase/,
  },
  {
    categoryId: "4",
    pattern: /netflix|spotify|disney|hulu|cinema|movie|concert|game|steam/,
  },
  {
    categoryId: "5",
    pattern: /electric|water|internet|phone|utility|bill|insurance/,
  },
  {
    categoryId: "6",
    pattern: /pharmacy|doctor|hospital|medical|dental|health|clinic/,
  },
  {
    categoryId: "7",
    pattern: /salary|payroll|paycheck|income|deposit|transfer in|refund/,
  },
];

const DEFAULT_CATEGORY = "8";

/**
 * Return the best-matching categoryId for a given description string.
 */
function autoCategory(description) {
  const match = RULES.find(rule => rule.pattern.test(description.toLowerCase()));

  return match?.categoryId || DEFAULT_CATEGORY;
}

module.exports = { autoCategory };
