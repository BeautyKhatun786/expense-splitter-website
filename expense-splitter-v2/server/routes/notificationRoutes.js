const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getNotifications, markRead, markAllRead } = require("../controllers/notificationController");
router.use(auth);
router.get("/", getNotifications);
router.patch("/:id/read", markRead);
router.patch("/read-all", markAllRead);
module.exports = router;
