/**
 * server.js — Application Entry Point
 * ─────────────────────────────────────────────────────────────────────────────
 * Startup sequence:
 *   1. Load environment variables from .env (via dotenv)
 *   2. Connect to MongoDB — fail fast if the database is unreachable
 *   3. Register Express middleware
 *   4. Mount route groups
 *   5. Attach the central error handler
 *   6. Start the HTTP server
 *
 * ESM NOTE:
 *   dotenv/config is imported as a side-effect import — this is the ESM
 *   equivalent of require("dotenv").config(). It must appear before any
 *   module that reads process.env so the variables are available immediately.
 *
 * WHY CONNECT TO DB BEFORE LISTENING?
 *   If we started accepting HTTP requests before the DB connection is ready,
 *   early requests would fail with confusing "not connected" errors.
 *   Awaiting connectDB() guarantees the DB is online before the first request.
 *
 * Data flow:
 *   HTTP Request → Route → Controller → Model (Mongoose) → MongoDB → Response
 */

// Side-effect import — loads .env variables into process.env
import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./db/db.js";
import errorHandler from "./middleware/errorHandler.middleware.js";
import transactionRoutes from "./routes/transactions.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import customMetricsRoutes from "./routes/customMetrics.routes.js";

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Route Registration ───────────────────────────────────────────────────────
app.use("/api/transactions",    transactionRoutes);
app.use("/api/categories",     categoryRoutes);
app.use("/api/custom-metrics", customMetricsRoutes);
app.use("/api",                analyticsRoutes);

// ── Central Error Handler — must be last ─────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap: connect to DB then start listening ────────────────────────────
// Top-level await is available in ESM modules — no IIFE wrapper needed.
await connectDB();
app.listen(PORT, () => {
  console.log(`🚀 FinanceFlow API running → http://localhost:${PORT}`);
});
