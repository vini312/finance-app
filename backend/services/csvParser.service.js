/**
 * csvParser.service.js
 * Handles all CSV parsing logic: column detection, amount parsing, date normalization.
 */

const { parse } = require("csv-parse/sync");
const { v4: uuidv4 } = require("uuid");
const { autoCategory } = require("./categorizer.service");

/**
 * Map the index of CSV columns to transaction fields based on header keywords.
 * 
 * Returns an object like { date: 0, description: 1, amount: 2 }.
 * Unmatched fields are simply omitted from the mapping.
 * 
 * @param {string[]} recordHeaders - Array of column header strings from the CSV
 */
function detectColumns(recordHeaders) {
  // TODO: define the mapping in a separate config file and allow users to customize it via the frontend in the future
  // Define possible keywords for each field
  const fieldKeysRef = {
    date: ["date", "time", "data"],
    description: ["description", "desc", "memo", "narrative", "details", "merchant"],
    amount: ["amount", "value"],
    debit: ["debit", "withdrawal", "expense"],
    credit: ["credit", "deposit", "income"],
    balance: ["balance", "running"],
  };
  
  // Convert headers to lowercase for case-insensitive matching and trim whitespace
  const headersLowerCase = recordHeaders.map((h) => h.toLowerCase().trim());

  // Helper function to find the index of the first header that matches any of the provided keywords
  const findHeadersIndex = (keywords) => headersLowerCase.findIndex((h) => keywords.some((k) => h.includes(k)));

  // Respond with an object mapping field names to their corresponding column index in the CSV
  return Object.fromEntries(
    // Return an array of [field, index] pairs for fields that were successfully matched to a column
    Object.entries(fieldKeysRef).map(([field, keywords]) => {
      const idx = findHeadersIndex(keywords);
      return idx !== -1 ? [field, idx] : null;
    }).filter(Boolean) // Filter out any fields that didn't find a matching column (i.e. null entries)
  );
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
  // Use csv-parse to convert buffer to array of records 
  // Each record is an array of column values
  const records = parse(
    buffer.toString("utf8"),
    { skip_empty_lines: true, relax_column_count: true }
  );

  // Must have at least header + 1 data row
  if (records.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const headers = records[0]; // First row is header
  const mapping = detectColumns(headers); // Determine which columns correspond to which fields
  const imported = [];
  const errors   = [];

  // Loop through each data row and attempt to parse it into a transaction object starting from index 1 (since index 0 is the header)
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
