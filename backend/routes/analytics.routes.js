/**
 * analytics.routes.js
 */

const router = require("express").Router();
const controller = require("../controllers/analytics.controller");
const transactionControler = require("../controllers/transactions.controller");

router.get("/analytics", controller.summary);
router.get("/export",    transactionControler.exportCSV);

module.exports = router;
