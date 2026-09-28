const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const eventAccess = require("../middleware/eventAccess");
const { getSummary } = require("../controllers/summaryController");

router.use(auth, eventAccess);

router.get("/", getSummary);

module.exports = router;
