/**
 * formatters.js
 * Pure formatting helpers used across components.
 */

export const formatCurrency = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

export const formatDate = (d) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

export const formatMonth = (yyyymm) => {
  if (!yyyymm || yyyymm === "Unknown") return yyyymm;
  const [year, month] = yyyymm.split("-");
  return new Date(year, month - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
};
