/**
 * upload.middleware.js
 * Configures multer for CSV file uploads.
 */

const multer = require("multer");
const path   = require("path");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const isCSV =
      file.mimetype === "text/csv" ||
      path.extname(file.originalname).toLowerCase() === ".csv";
    if (isCSV) cb(null, true);
    else cb(new Error("Only CSV files are allowed"));
  },
});

module.exports = upload;
