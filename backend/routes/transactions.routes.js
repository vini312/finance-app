/**
 * transactions.routes.js — Transaction Route Definitions
 * ─────────────────────────────────────────────────────────────────────────────
 * Full URL map (mounted under /api/transactions in server.js):
 *   POST   /api/transactions/upload  → parse CSV, bulk-import transactions
 *   GET    /api/transactions         → list with search / filter / sort
 *   PATCH  /api/transactions/:id     → update a single transaction
 *   DELETE /api/transactions/:id     → delete one transaction
 *   DELETE /api/transactions         → delete ALL transactions
 *
 * ESM NOTE:
 *   express.Router() is accessed via the default import — no destructuring
 *   needed since the express default export exposes Router as a property.
 */

import { Router } from "express";
import upload from "../middleware/upload.middleware.js";
import * as controller from "../controllers/transactions.controller.js";

const router = Router();

router.post   ("/upload", upload.single("file"), controller.upload);
router.get    ("/",                              controller.list);
router.patch  ("/:id",                           controller.update);
router.delete ("/:id",                           controller.remove);
// DELETE "/" must come after "/:id" to avoid route shadowing
router.delete ("/",                              controller.removeAll);

export default router;
