/**
 * customMetrics.routes.js — Custom Metric Route Definitions
 * ─────────────────────────────────────────────────────────────────────────────
 * GET    /api/custom-metrics      → list all
 * POST   /api/custom-metrics      → create one
 * DELETE /api/custom-metrics/:id  → remove one
 */

import { Router } from "express";
import * as controller from "../controllers/customMetrics.controller.js";

const router = Router();

router.get("/", controller.list);
router.post("/", controller.create);
router.delete("/:id", controller.remove);

export default router;
