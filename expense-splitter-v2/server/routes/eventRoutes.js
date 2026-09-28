const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const eventAccess = require("../middleware/eventAccess");
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

router.use(auth);

router.post("/", createEvent);
router.get("/", getEvents);
router.get("/:id", eventAccess, getEvent);
router.put("/:id", eventAccess, updateEvent);
router.delete("/:id", eventAccess, deleteEvent);

module.exports = router;
