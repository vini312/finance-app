/**
 * In-memory data store.
 * Replace this module with a real DB adapter (SQLite, PostgreSQL, etc.)
 * without touching any routes or controllers.
 */

let transactions = [];

let categories = [
  { id: "1", name: "Food & Dining",  color: "#FF6B6B", icon: "🍔" },
  { id: "2", name: "Transport",      color: "#4ECDC4", icon: "🚗" },
  { id: "3", name: "Shopping",       color: "#45B7D1", icon: "🛍️" },
  { id: "4", name: "Entertainment",  color: "#96CEB4", icon: "🎬" },
  { id: "5", name: "Utilities",      color: "#FFEAA7", icon: "💡" },
  { id: "6", name: "Healthcare",     color: "#DDA0DD", icon: "🏥" },
  { id: "7", name: "Income",         color: "#98FB98", icon: "💰" },
  { id: "8", name: "Other",          color: "#D3D3D3", icon: "📦" },
];

module.exports = {
  getTransactions:    ()        => transactions,
  setTransactions:    (data)    => { transactions = data; },

  getCategories:      ()        => categories,
  setCategories:      (data)    => { categories = data; },
};
