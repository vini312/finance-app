/**
 * csvParser.service.js — CSV Parsing Logic
 * ─────────────────────────────────────────────────────────────────────────────
 * Converts a raw CSV buffer into an array of transaction objects ready for
 * bulk insertion into MongoDB via Transaction.insertMany().
 *
 * Three-stage pipeline:
 *   Stage 1 — detectColumns: map header keywords → column indices
 *   Stage 2 — parseAmount / normalizeDate: sanitise raw cell values
 *   Stage 3 — row loop: assemble transaction objects, collect errors
 *
 * NOTE ON IDs:
 *   No UUIDs are generated here. MongoDB auto-assigns _id on insertMany().
 *
 * ESM NOTE:
 *   csv-parse ships with a named "parse" export under the /sync sub-path.
 *   The import below uses the full package path with a named import — identical
 *   to what the CJS destructured require did.
 */

import { parse } from "csv-parse/sync";
import { autoCategory, loadCategorizerRules } from "./categorizer.service.js";

// -------------------------- HELPER FUNCTIONS --------------------------

/**
 * Scans the CSV header row and maps semantic field names to column indices.
 * Returns an object like { date: 0, description: 1, amount: 2 }.
 *
 * @param  {string[]} headers
 * @returns {Object} — { fieldName: columnIndex } for each matched field
 */
function detectColumns(headers) {
  const lower = headers.map((h) => h.toLowerCase().trim());

  // Helper: index of the first header that contains any keyword
  const find = (keywords) =>
    lower.findIndex((h) => keywords.some((k) => h.includes(k)));

  const mapping = {};
  const dateIdx   = find(["date", "time", "data"]);
  const descIdx   = find(["description", "desc", "memo", "narrative", "details", "merchant"]);
  const amountIdx = find(["amount", "value"]);
  const debitIdx  = find(["debit", "withdrawal", "expense"]);
  const creditIdx = find(["credit", "deposit", "income"]);
  const balIdx    = find(["balance", "running"]);

  if (dateIdx   !== -1) mapping.date        = dateIdx;
  if (descIdx   !== -1) mapping.description = descIdx;
  if (amountIdx !== -1) mapping.amount      = amountIdx;
  if (debitIdx  !== -1) mapping.debit       = debitIdx;
  if (creditIdx !== -1) mapping.credit      = creditIdx;
  if (balIdx    !== -1) mapping.balance     = balIdx;

  return mapping;
}

/**
 * Normalises a raw date string to YYYY-MM-DD.
 * Falls back to today's date if the string is unparseable.
 *
 * @param  {string} rawDate
 * @returns {string} — "YYYY-MM-DD"
 */
function normalizeDate(dateString) {
  if (!dateString) {
    return new Date().toString().split("T")[0];
  }

  const date = new Date(dateString);

  return isNaN(date.getTime()) ? dateString : date.toString().split("T")[0];
  
  // TODO: Check Date parsing option below
  // const dateObj = new Date(dateString);

  // const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  // const formattedDate = dateObj.toLocaleDateString('en-CA', options);

  // return formattedDate || new Date().toString().split("T")[0];
}

// -------------------------- MAIN FUNCTION --------------------------

/**
 * Parses a CSV buffer and returns { imported, errors }.
 * The imported array contains plain objects — Mongoose assigns _id on insert.
 *
 * @param  {Buffer} buffer   — file buffer from multer (req.file.buffer)
 * @param  {string} filename — original filename stored in the source field
 * @returns {Promise<{ imported: Object[], errors: Object[] }>}
 */
export async function parseCSV(buffer, filename) {
  const records = parse(buffer.toString("utf8"), {
    skip_empty_lines:   true,
    relax_column_count: true,
  });

  if (records.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const headers = records[0]; // First row is header
  const fieldIndexMapping = detectColumns(headers); // Determine which columns correspond to which fields
  const rules = await loadCategorizerRules();
  const imported = [];
  const errors   = [];

  // Loop through each data row and attempt to parse it into a transaction object starting from index 1 (since index 0 is the header)
  for (let i = 1; i < records.length; i++) {
    const row = records[i];

    try {
      let amount = null;

      // First try to parse amount directly from an "amount" column, if it exists
      if (fieldIndexMapping.amount) {
        amount = parseFloat(row[fieldIndexMapping.amount]);
      } 
      // If no direct amount column, calculate it from debit and credit columns
      else {
        const debit  = fieldIndexMapping.debit ? (parseFloat(row[fieldIndexMapping.debit])  || 0) : 0;
        const credit = fieldIndexMapping.credit ? (parseFloat(row[fieldIndexMapping.credit]) || 0) : 0;
        amount = credit - debit;
      }

      // If amount is still not a valid number, log an error for this row and skip it
      if (isNaN(amount)) {
        errors.push({ row: i, value: amount , reason: "Could not parse amount" });
        continue; // Skip to next row without adding a transaction for this one
      }

      const description = fieldIndexMapping.description ? row[fieldIndexMapping.description]?.trim() : "";
      const date    = normalizeDate(fieldIndexMapping.date !== undefined ? row[fieldIndexMapping.date]?.trim() : null);
      const balance = fieldIndexMapping.balance ? parseFloat(row[fieldIndexMapping.balance]) : null;

      imported.push({
        date,
        description,
        amount,
        balance,
        categoryId: autoCategory(description, rules),
        source:     filename,
      });

    } catch (e) {
      errors.push({ row: i, reason: e.message });
    }
  }

  return { imported, errors };
}
