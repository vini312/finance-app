/**
 * formatters.js — Pure Display Formatting Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Stateless helper functions that convert raw data values into
 * human-readable display strings. Kept in one place so the format is
 * consistent throughout the app and only needs to change here.
 *
 * All functions are pure: same input → same output, no side effects.
 */

/**
 * Formats a number as a USD currency string.
 * Uses the Intl.NumberFormat API for locale-aware formatting.
 *
 * Examples:
 *   1234.5  → "$1,234.50"
 *   -42     → "-$42.00"
 *   0       → "$0.00"
 *
 * @param  {number} n - Raw numeric amount
 * @returns {string}  - Formatted currency string
 */
export const formatCurrency = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

/**
 * Formats an ISO date string (YYYY-MM-DD) into a readable short date.
 * Appends T00:00:00 before parsing to avoid timezone offset issues —
 * without it, new Date("2024-01-15") is treated as UTC midnight and can
 * display as Jan 14 in UTC-offset timezones.
 *
 * Examples:
 *   "2024-01-15" → "Jan 15, 2024"
 *   ""           → ""
 *   undefined    → ""
 *
 * @param  {string} d - ISO date string "YYYY-MM-DD"
 * @returns {string}  - Formatted date string
 */
export const formatDate = (d) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""; // return empty string for null/undefined dates rather than "Invalid Date"

/**
 * Formats a "YYYY-MM" month key into a short month + year label.
 * Used in chart axis labels and the monthly breakdown widget.
 *
 * Examples:
 *   "2024-01" → "Jan 2024"
 *   "Unknown" → "Unknown"  (pass-through for missing month data)
 *
 * @param  {string} yyyymm - Month string in "YYYY-MM" format
 * @returns {string}       - Formatted month label
 */
export const formatMonth = (yyyymm) => {
  if (!yyyymm || yyyymm === "Unknown") return yyyymm; // guard against bad values

  const [year, month] = yyyymm.split("-");

  // new Date(year, month - 1) → month is 0-indexed in the Date constructor
  return new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};
