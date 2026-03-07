/**
 * upload.middleware.js — File Upload Configuration (Multer 2.x)
 * ─────────────────────────────────────────────────────────────────────────────
 * Configures multer to handle multipart/form-data file uploads.
 * Applied only to the CSV upload route, not globally.
 *
 * STORAGE: memoryStorage() keeps the file as a Buffer in req.file.buffer.
 * Fine for CSVs (< a few MB); switch to diskStorage() for very large files.
 *
 * ESM NOTE:
 *   `path` is a Node built-in. In ESM it is imported with a named import —
 *   no change in behaviour, just ESM syntax.
 */

import multer from "multer";
import path   from "path";

const upload = multer({
  storage: multer.memoryStorage(),

  // Reject files larger than 10 MB to prevent memory exhaustion
  limits: { fileSize: 10 * 1024 * 1024 },

  fileFilter: (_req, file, cb) => {
    const isCSV =
      file.mimetype === "text/csv"        ||
      file.mimetype === "application/csv" ||
      path.extname(file.originalname).toLowerCase() === ".csv";

    if (isCSV) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error("Only CSV files are allowed"), { status: 400 }));
    }
  },
});

export default upload;
