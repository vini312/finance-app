/**
 * analytics.routes.js — Analytics & Export Route Definitions
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/analytics → full dashboard analytics via MongoDB aggregation
 * GET /api/export    → download all transactions as a CSV file
 */

import { Router } from "express";
import { summary } from "../controllers/analytics.controller.js";
import { exportCSV } from "../controllers/transactions.controller.js";

const router = Router();

router.get("/analytics", summary);
router.get("/export",    exportCSV);

export default router;
