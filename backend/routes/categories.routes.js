/**
 * categories.routes.js
 */

const router     = require("express").Router();
const controller = require("../controllers/categories.controller");

router.get    ("/",    controller.list);
router.post   ("/",    controller.create);
router.patch  ("/:id", controller.update);
router.delete ("/:id", controller.remove);

module.exports = router;
