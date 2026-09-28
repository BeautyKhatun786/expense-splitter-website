const Participant = require("../models/Participant");
const Expense = require("../models/Expense");
const User = require("../models/User");
const { createNotification } = require("../utils/notify");

exports.addParticipant = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name) return res.status(400).json({ message: "Participant name is required" });
    let user = null;
    if (email) user = await User.findOne({ email: email.toLowerCase().trim() });
    const participant = await Participant.create({ event: req.params.eventId, user: user?._id || null, name: user?.name || name, email: user?.email || email || "" });
    if (user && String(user._id) !== String(req.user.id)) await createNotification({ user: user._id, type: "invite", title: "Added to a group", message: `You were added to ${req.event.title}.`, event: req.params.eventId });
    res.status(201).json(participant);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "A participant with this name already exists in this event" });
    res.status(500).json({ message: "Could not add participant", error: err.message });
  }
};
exports.getParticipants = async (req, res) => { try { res.json(await Participant.find({ event: req.params.eventId }).sort({ createdAt: 1 })); } catch (err) { res.status(500).json({ message: "Could not fetch participants", error: err.message }); } };
exports.removeParticipant = async (req, res) => {
  try {
    if (String(req.event.createdBy) !== String(req.user.id)) return res.status(403).json({ message: "Only the group creator can remove members" });
    const inUse = await Expense.exists({ event: req.params.eventId, $or: [{ paidBy: req.params.id }, { splitAmong: req.params.id }] });
    if (inUse) return res.status(400).json({ message: "Cannot remove participant: they are linked to one or more expenses in this event" });
    const removed = await Participant.findOneAndDelete({ _id: req.params.id, event: req.params.eventId });
    if (!removed) return res.status(404).json({ message: "Participant not found" });
    res.json({ message: "Participant removed" });
  } catch (err) { res.status(500).json({ message: "Could not remove participant", error: err.message }); }
};
