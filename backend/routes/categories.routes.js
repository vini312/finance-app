/**
 * categories.routes.js — Category Route Definitions
 * ─────────────────────────────────────────────────────────────────────────────
 * Full URL map (mounted under /api/categories in server.js):
 *   GET    /api/categories      → list all categories
 *   POST   /api/categories      → create a new category
 *   PATCH  /api/categories/:id  → update a category (name, color, icon)
 *   DELETE /api/categories/:id  → delete a category (transactions → "Other")
 */

import { Router } from "express";
import * as controller from "../controllers/categories.controller.js";

const router = Router();

router.get    ("/",    controller.list);
router.post   ("/",    controller.create);
router.patch  ("/:id", controller.update);
router.delete ("/:id", controller.remove);

export default router;
