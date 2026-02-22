/**
 * server.js
 * App entry point — Express 5.x
 *
 * Key Express 5 changes applied:
 *  - Async route errors are forwarded automatically (no manual try/catch needed in routes)
 *  - Wildcard routes now require a named param: /*splat instead of /*
 *  - app.del() removed (was already using app.delete())
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
app.use("/api",              analyticsRoutes);

// ── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Finance API running → http://localhost:${PORT}`);
});
