/**
 * transactions.routes.js
 */

const router     = require("express").Router();
const controller = require("../controllers/transactions.controller");
const upload     = require("../middleware/upload.middleware");

router.post   ("/upload", upload.single("file"), controller.upload);
router.get    ("/",                              controller.list);
router.patch  ("/:id",                           controller.update);
router.delete ("/:id",                           controller.remove);

module.exports = router;
