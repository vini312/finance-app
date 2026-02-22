/**
 * upload.middleware.js
 * Multer 2.x configuration for CSV file uploads.
 *
 * Multer 2.0 breaking changes applied:
 *  - fileFilter callback signature is unchanged but stream handling is fixed internally
 *  - memoryStorage() API is identical
 *  - Security fixes for CVE-2025-47935 and CVE-2025-47944 included in 2.0
 */

const multer = require("multer");
const path   = require("path");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const isCSV =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/csv" ||
      path.extname(file.originalname).toLowerCase() === ".csv";
    if (isCSV) cb(null, true);
    else cb(Object.assign(new Error("Only CSV files are allowed"), { status: 400 }));
  },
});

module.exports = upload;
