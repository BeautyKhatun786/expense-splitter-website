const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const eventAccess = require("../middleware/eventAccess");
const {
  addParticipant,
  getParticipants,
  removeParticipant,
} = require("../controllers/participantController");

router.use(auth, eventAccess);

router.post("/", addParticipant);
router.get("/", getParticipants);
router.delete("/:id", removeParticipant);

module.exports = router;
