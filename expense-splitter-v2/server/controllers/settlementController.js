const Settlement = require("../models/Settlement");
const Participant = require("../models/Participant");
const Event = require("../models/Event");
const { createNotification } = require("../utils/notify");

exports.createSettlement = async (req, res) => {
  try {
    const { from, to, amount, date, note } = req.body;
    const eventId = req.params.eventId;
    if (!from || !to || from === to || amount === undefined || Number(amount) <= 0) return res.status(400).json({ message: "from, to and a positive amount are required" });
    const participants = await Participant.find({ _id: { $in: [from, to] }, event: eventId });
    if (participants.length !== 2) return res.status(400).json({ message: "Both settlement members must belong to this event" });
    const settlement = await Settlement.create({ event: eventId, from, to, amount: Number(amount), date: date || Date.now(), note: note || "", createdBy: req.user.id });
    const event = await Event.findById(eventId).select("title");
    const fromParticipant = participants.find((p) => String(p._id) === String(from));
    const toParticipant = participants.find((p) => String(p._id) === String(to));
    if (fromParticipant?.user && String(fromParticipant.user) !== String(req.user.id)) await createNotification({ user: fromParticipant.user, type: "settlement", title: "Settlement recorded", message: `${toParticipant.name} recorded a ₹${Number(amount).toFixed(2)} settlement in ${event?.title || "your group"}.`, event: eventId });
    if (toParticipant?.user && String(toParticipant.user) !== String(req.user.id)) await createNotification({ user: toParticipant.user, type: "settlement", title: "Settlement recorded", message: `${fromParticipant.name} paid ₹${Number(amount).toFixed(2)} in ${event?.title || "your group"}.`, event: eventId });
    const populated = await settlement.populate([{ path: "from", select: "name" }, { path: "to", select: "name" }]);
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: "Could not record settlement", error: err.message }); }
};
exports.getSettlements = async (req, res) => {
  try { res.json(await Settlement.find({ event: req.params.eventId }).populate("from", "name").populate("to", "name").sort({ date: -1 })); }
  catch (err) { res.status(500).json({ message: "Could not fetch settlements", error: err.message }); }
};
exports.deleteSettlement = async (req, res) => {
  try { const removed = await Settlement.findOneAndDelete({ _id: req.params.id, event: req.params.eventId }); if (!removed) return res.status(404).json({ message: "Settlement not found" }); res.json({ message: "Settlement removed" }); }
  catch (err) { res.status(500).json({ message: "Could not remove settlement", error: err.message }); }
};
