/**
 * csvParser.service.js
 * Handles all CSV parsing logic: column detection, amount parsing, date normalization.
 */

const { parse } = require("csv-parse/sync");
const { v4: uuidv4 } = require("uuid");
const { autoCategory } = require("./categorizer.service");

/**
 * Detect which column index maps to each semantic field
 * by scanning the header row for known keywords.
 */
function detectColumns(headers) {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const mapping = {};

  const find = (keywords) => lower.findIndex((h) => keywords.some((k) => h.includes(k)));

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
 * Parse a raw string into a float, handling currency symbols and commas.
 */
function parseAmount(str) {
  if (!str && str !== 0) return null;
  const cleaned = String(str).replace(/[^0-9.\-,]/g, "").replace(",", ".");
  return parseFloat(cleaned);
}

/**
 * Normalize a raw date string to YYYY-MM-DD.
 * Falls back to today if unparseable.
 */
function normalizeDate(rawDate) {
  if (!rawDate) return new Date().toISOString().split("T")[0];
  const d = new Date(rawDate);
  return isNaN(d.getTime()) ? rawDate : d.toISOString().split("T")[0];
}

/**
 * Parse a CSV buffer and return { imported, errors }.
 * @param {Buffer} buffer   - Raw file buffer
 * @param {string} filename - Original filename (stored on each record)
 */
function parseCSV(buffer, filename) {
  const content = buffer.toString("utf8");
  const records = parse(content, { skip_empty_lines: true, relax_column_count: true });

  if (records.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const headers = records[0];
  const mapping = detectColumns(headers);
  const imported = [];
  const errors   = [];

  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    try {
      let amount = null;

      if (mapping.amount !== undefined) {
        amount = parseAmount(row[mapping.amount]);
      } else if (mapping.debit !== undefined || mapping.credit !== undefined) {
        const debit  = mapping.debit  !== undefined ? (parseAmount(row[mapping.debit])  || 0) : 0;
        const credit = mapping.credit !== undefined ? (parseAmount(row[mapping.credit]) || 0) : 0;
        amount = credit - debit;
      }

      if (amount === null || isNaN(amount)) {
        errors.push({ row: i + 1, reason: "Could not parse amount" });
        continue;
      }

      const description = mapping.description !== undefined
        ? row[mapping.description]?.trim()
        : `Row ${i}`;

      const date    = normalizeDate(mapping.date !== undefined ? row[mapping.date]?.trim() : null);
      const balance = mapping.balance !== undefined ? parseAmount(row[mapping.balance]) : null;

      imported.push({
        id:          uuidv4(),
        date,
        description: description || "Unknown",
        amount,
        balance,
        categoryId:  autoCategory(description),
        source:      filename,
        createdAt:   new Date().toISOString(),
      });
    } catch (e) {
      errors.push({ row: i + 1, reason: e.message });
    }
  }

  return { imported, errors };
}

module.exports = { parseCSV, detectColumns, parseAmount, normalizeDate };
