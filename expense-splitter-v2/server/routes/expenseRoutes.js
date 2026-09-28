const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const eventAccess = require("../middleware/eventAccess");
const {
  addExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

router.use(auth, eventAccess);

router.post("/", addExpense);
router.get("/", getExpenses);
router.get("/:id", getExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
