const { Router } = require("express");
const c = require("../controllers/accounts.controller");

const router = Router();

router.post("/accounts", c.create);
router.get("/accounts", c.list);
router.get("/accounts/:id", c.getOne);
router.post("/accounts/:id/deposit", c.deposit);
router.post("/accounts/:id/withdraw", c.withdraw);
router.post("/transfers", c.transfer);

module.exports = router;
