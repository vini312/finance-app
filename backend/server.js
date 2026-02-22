/**
 * server.js
 * App entry point. Only responsible for:
 *  - creating the Express app
 *  - registering middleware & routes
 *  - starting the HTTP server
 */

const express      = require("express");
const cors         = require("cors");
const errorHandler = require("./middleware/errorHandler.middleware");

const transactionRoutes = require("./routes/transactions.routes");
const categoryRoutes    = require("./routes/categories.routes");
const analyticsRoutes   = require("./routes/analytics.routes");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Global middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories",   categoryRoutes);
app.use("/api",              analyticsRoutes);   // /api/analytics  &  /api/export

// ── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Finance API running → http://localhost:${PORT}`);
});
