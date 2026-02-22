/**
 * api.js — Centralized API client
 *
 * Vite env vars: use import.meta.env.VITE_API_URL (not process.env.REACT_APP_API_URL)
 * During dev, the Vite proxy forwards /api/* to localhost:3001 automatically,
 * so BASE_URL can be empty string for dev and the full URL for production.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const res = await fetch(BASE_URL + path, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Transactions
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/transactions?${qs}`);
  },
  uploadCSV: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return request("/api/transactions/upload", { method: "POST", body: fd });
  },
  updateTransaction: (id, data) =>
    request(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteTransaction: (id)  => request(`/api/transactions/${id}`, { method: "DELETE" }),
  deleteAllTransactions: () => request("/api/transactions",        { method: "DELETE" }),

  // Categories
  getCategories:  ()     => request("/api/categories"),
  createCategory: (data) =>
    request("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: "DELETE" }),

  // Analytics
  getAnalytics: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/analytics?${qs}`);
  },

  // Export (opens directly in browser)
  exportURL: () => `${BASE_URL}/api/export`,
};
