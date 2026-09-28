const Event = require("../models/Event");
const Participant = require("../models/Participant");
module.exports = async function eventAccess(req, res, next) {
  try {
    const eventId = req.params.eventId || req.params.id;
    if (!eventId) return res.status(400).json({ message: "Event id is required" });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.createdBy) === String(req.user.id)) { req.event = event; return next(); }
    const member = await Participant.findOne({ event: eventId, user: req.user.id });
    if (!member) return res.status(403).json({ message: "You are not a member of this group" });
    req.event = event; req.eventMember = member; next();
  } catch (err) { res.status(500).json({ message: "Could not verify group access" }); }
};
