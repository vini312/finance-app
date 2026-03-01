/**
 * csvParser.service.js
 * Handles all CSV parsing logic: column detection, amount parsing, date normalization.
 */

const { parse } = require("csv-parse/sync");
const { v4: uuidv4 } = require("uuid");
const { autoCategory } = require("./categorizer.service");

// -------------------------- HELPER FUNCTIONS --------------------------

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
 * Normalize a raw date string to YYYY-MM-DD.
 * Falls back to today if unparseable.
 */
function normalizeDate(dateString) {
  if (!dateString) {
    return new Date().toISOString().split("T")[0];
  }

  const date = new Date(dateString);

  return isNaN(date.getTime()) ? dateString : date.toISOString().split("T")[0];

  
  // const dateObj = new Date(dateString);

  // const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  // const formattedDate = dateObj.toLocaleDateString('en-CA', options);

  // return formattedDate || new Date().toString().split("T")[0];
}

// -------------------------- MAIN FUNCTION --------------------------

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
  const fieldIndexMapping = detectColumns(headers); // Determine which columns correspond to which fields
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
        id:          uuidv4(),
        date,
        description,
        amount,
        balance,
        categoryId:  autoCategory(description),
        source:      filename,
        createdAt:   new Date().toString(),
      });

    } catch (e) {
      errors.push({ row: i, reason: e.message });
    }
  }

  return { imported, errors };
}

module.exports = { parseCSV };
