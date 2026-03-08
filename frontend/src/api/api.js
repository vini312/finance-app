/**
 * api.js — Centralised HTTP Client (Axios)
 * ─────────────────────────────────────────────────────────────────────────────
 * All network calls from the frontend go through this module.
 * We switched from the native fetch() API to Axios for these reasons:
 *
 *   1. AUTOMATIC JSON PARSING:
 *      Axios automatically parses JSON response bodies. fetch() requires an
 *      explicit await res.json() call after checking res.ok.
 *
 *   2. AUTOMATIC ERROR THROWING:
 *      Axios throws for any non-2xx status code. fetch() resolves successfully
 *      even for 4xx/5xx responses — you must check res.ok manually.
 *
 *   3. INTERCEPTORS:
 *      Axios interceptors let you add auth headers, log requests, or handle
 *      token refresh in one central place — no changes needed in calling code.
 *      The response interceptor below normalises all error messages.
 *
 *   4. REQUEST CANCELLATION:
 *      Axios supports AbortController natively for cancelling in-flight requests
 *      (useful for search-as-you-type to cancel previous requests).
 *
 *   5. UPLOAD PROGRESS:
 *      Axios exposes onUploadProgress for multipart uploads, enabling a real
 *      progress bar on the CSV upload page.
 *
 * INSTANCE CONFIGURATION:
 *   We create a named axios instance (client) rather than using the global
 *   axios object. This scopes the base URL and interceptors to this app only,
 *   avoiding conflicts if axios is used elsewhere.
 */

import axios from "axios";

// ── Axios Instance ────────────────────────────────────────────────────────────
// baseURL is empty in development — Vite's proxy forwards /api/* to :3001.
// In production, set VITE_API_URL=https://api.myapp.com before building.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: {
    // Tell the server we accept JSON responses by default.
    // For FormData (file uploads) we override this per-request.
    "Accept": "application/json",
  },
});

// ── Response Interceptor ──────────────────────────────────────────────────────
// Runs on every response (or error) before it reaches the calling code.
// Normalises the error message so components always get a plain Error object
// with a human-readable .message — regardless of whether the server sent JSON,
// plain text, or nothing at all.
client.interceptors.response.use(
  // Success handler: pass through unchanged
  (response) => response,

  // Error handler: normalise the error message
  (error) => {
    if (error.response) {
      // The server responded with a non-2xx status.
      // Our Express error handler always sends { error: "message" } in the body.
      const message = error.response.data?.error
        || error.response.statusText
        || "Request failed";
      return Promise.reject(new Error(message));
    }

    if (error.request) {
      // The request was sent but no response was received (network error, timeout).
      return Promise.reject(new Error("Network error — is the server running?"));
    }

    // Something went wrong setting up the request (bad config, etc.)
    return Promise.reject(error);
  }
);

// ── Public API ────────────────────────────────────────────────────────────────
// One method per backend endpoint. All return Promises that resolve to the
// parsed response data (the .data field from Axios's response object).
export const api = {
  // ── Transactions ───────────────────────────────────────────────────────────

  /**
   * Fetch filtered, sorted transactions.
   * Axios serialises the params object into a query string automatically.
   * @param {Object} params - { search, categoryId, type, sortBy, sortDir, ... }
   */
  getTransactions: (params = {}) =>
    client.get("/api/transactions", { params }).then((r) => r.data),

  /**
   * Upload a CSV file for parsing and import.
   * FormData is used because the file must be sent as multipart/form-data.
   * Axios detects FormData automatically and sets the Content-Type header
   * (including the boundary) without any manual configuration.
   *
   * @param {File}     file             - File object from drag-and-drop or input
   * @param {Function} onUploadProgress - Optional callback for upload progress:
   *                                      (progressEvent) => { progressEvent.loaded, .total }
   */
  uploadCSV: (file, onUploadProgress) => {
    const fd = new FormData();
    fd.append("file", file); // field name must match upload.single("file") on the backend

    return client
      .post("/api/transactions/upload", fd, {
        // Axios passes this to the browser's XMLHttpRequest.upload.onprogress event.
        // progressEvent.loaded / progressEvent.total gives the fraction uploaded.
        onUploadProgress,
      })
      .then((r) => r.data);
  },

  /**
   * Partially update a transaction (used for re-categorisation).
   * @param {string} id   - Transaction's MongoDB _id string
   * @param {Object} data - Fields to update, e.g. { categoryId: "shopping" }
   */
  updateTransaction: (id, data) =>
    client.patch(`/api/transactions/${id}`, data).then((r) => r.data),

  /** Delete a single transaction */
  deleteTransaction: (id) =>
    client.delete(`/api/transactions/${id}`).then((r) => r.data),

  /** Delete ALL transactions */
  deleteAllTransactions: () =>
    client.delete("/api/transactions").then((r) => r.data),

  // ── Categories ─────────────────────────────────────────────────────────────

  /** Fetch all categories */
  getCategories: () =>
    client.get("/api/categories").then((r) => r.data),

  /**
   * Create a new category.
   * @param {Object} data - { name, icon, color }
   */
  createCategory: (data) =>
    client.post("/api/categories", data).then((r) => r.data),

  /**
   * Delete a category (server reassigns its transactions to "Other").
   * @param {string} id - Category slug (e.g. "food", or a user-created slug)
   */
  deleteCategory: (id) =>
    client.delete(`/api/categories/${id}`).then((r) => r.data),

  // ── Custom Metrics ────────────────────────────────────────────────────────

  /** Fetch all custom dashboard metrics */
  getCustomMetrics: () =>
    client.get("/api/custom-metrics").then((r) => r.data),

  /**
   * Create a custom metric.
   * @param {Object} data - { name, icon, formula, format }
   */
  createCustomMetric: (data) =>
    client.post("/api/custom-metrics", data).then((r) => r.data),

  /** Delete a custom metric by ID */
  deleteCustomMetric: (id) =>
    client.delete(`/api/custom-metrics/${id}`).then((r) => r.data),

  // ── Analytics ──────────────────────────────────────────────────────────────

  /**
   * Fetch aggregated dashboard analytics computed by MongoDB aggregation pipelines.
   * @param {Object} params - Optional { startDate, endDate } for date filtering
   */
  getAnalytics: (params = {}) =>
    client.get("/api/analytics", { params }).then((r) => r.data),

  // ── Export ─────────────────────────────────────────────────────────────────

  /**
   * Returns the full URL for the CSV export endpoint.
   * The component passes this to window.open() to trigger a browser download.
   * Axios isn't used here because window.open() handles the request directly.
   */
  exportURL: () => `${import.meta.env.VITE_API_URL || ""}/api/export`,
};
