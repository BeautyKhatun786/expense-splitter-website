const Event = require("../models/Event");
const Participant = require("../models/Participant");
const Expense = require("../models/Expense");
const { _computeEventSummary } = require("./summaryController");

exports.getDashboard = async (req, res) => {
  try {
    const myParticipantRows = await Participant.find({ user: req.user.id }).select("event");
    const eventIds = myParticipantRows.map((p) => p.event);
    const events = await Event.find({ $or: [{ createdBy: req.user.id }, { _id: { $in: eventIds } }] }).sort({ date: -1 });
    const allEventIds = events.map((e) => e._id);
    const [participantCount, expenses] = await Promise.all([
      Participant.countDocuments({ event: { $in: allEventIds } }),
      Expense.find({ event: { $in: allEventIds } }).populate("paidBy", "name").populate("event", "title").sort({ createdAt: -1 }).limit(10),
    ]);
    const totalExpenseAmount = await Expense.aggregate([{ $match: { event: { $in: allEventIds } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
    let youOwe = 0, youGet = 0;
    for (const event of events) {
      const summary = await _computeEventSummary(event._id);
      const myParticipant = await Participant.findOne({ event: event._id, user: req.user.id }).select("_id");
      if (!myParticipant) continue;
      const b = summary.balances.find((x) => x.id === String(myParticipant._id));
      if (b?.net > 0) youGet += b.net; else if (b) youOwe += -b.net;
    }
    const recentActivities = expenses.map((e) => ({ id: e._id, description: `${e.paidBy?.name || "Someone"} paid ₹${Number(e.amount).toFixed(2)} for "${e.title}" in ${e.event?.title || "an event"}`, date: e.createdAt }));
    res.json({ totalEvents: events.length, totalParticipants: participantCount, totalExpenses: totalExpenseAmount[0] ? Math.round(totalExpenseAmount[0].total * 100) / 100 : 0, youOwe: Math.round(youOwe * 100) / 100, youGet: Math.round(youGet * 100) / 100, recentActivities });
  } catch (err) { res.status(500).json({ message: "Could not load dashboard", error: err.message }); }
};
