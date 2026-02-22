/**
 * analytics.routes.js
 */

const router     = require("express").Router();
const controller = require("../controllers/analytics.controller");
const txCtrl     = require("../controllers/transactions.controller");

router.get("/analytics", controller.summary);
router.get("/export",    txCtrl.exportCSV);

module.exports = router;
