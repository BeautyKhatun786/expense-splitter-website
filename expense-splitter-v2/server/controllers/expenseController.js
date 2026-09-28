const Expense = require("../models/Expense");
const Participant = require("../models/Participant");
const Event = require("../models/Event");
const { createNotification } = require("../utils/notify");

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

async function normalizeSplit({ eventId, amount, splitType = "equal", splitAmong, shares }) {
  if (!Array.isArray(splitAmong) || splitAmong.length === 0) throw new Error("Select at least one participant");
  const ids = [...new Set(splitAmong.map(String))];
  const relevant = await Participant.find({ _id: { $in: ids }, event: eventId });
  if (relevant.length !== ids.length) throw new Error("splitAmong contains a participant not in this event");
  const total = Number(amount);
  let normalized;
  if (splitType === "exact") {
    if (!Array.isArray(shares)) throw new Error("Enter an exact amount for every participant");
    const map = new Map(shares.map((s) => [String(s.participant), Number(s.value)]));
    normalized = ids.map((id) => ({ participant: id, value: round2(map.get(id) || 0) }));
    const sum = round2(normalized.reduce((a, s) => a + s.value, 0));
    if (Math.abs(sum - total) > 0.01) throw new Error(`Exact split must add up to ₹${total.toFixed(2)}`);
  } else if (splitType === "percentage") {
    if (!Array.isArray(shares)) throw new Error("Enter a percentage for every participant");
    const map = new Map(shares.map((s) => [String(s.participant), Number(s.value)]));
    normalized = ids.map((id) => ({ participant: id, value: Number(map.get(id) || 0) }));
    const pct = round2(normalized.reduce((a, s) => a + s.value, 0));
    if (Math.abs(pct - 100) > 0.01) throw new Error("Percentage split must add up to 100%");
    normalized = normalized.map((s) => ({ participant: s.participant, value: round2(total * s.value / 100) }));
    const diff = round2(total - normalized.reduce((a, s) => a + s.value, 0));
    if (Math.abs(diff) > 0) normalized[normalized.length - 1].value = round2(normalized[normalized.length - 1].value + diff);
  } else {
    const base = Math.floor((total / ids.length) * 100) / 100;
    let remaining = round2(total - base * ids.length);
    normalized = ids.map((id) => { const v = base + (remaining > 0 ? Math.min(0.01, remaining) : 0); remaining = round2(remaining - (remaining > 0 ? Math.min(0.01, remaining) : 0)); return { participant: id, value: round2(v) }; });
  }
  return normalized;
}

exports.addExpense = async (req, res) => {
  try {
    const { title, amount, paidBy, splitAmong, splitType, shares, date, notes } = req.body;
    const eventId = req.params.eventId;
    if (!title || amount === undefined || !paidBy) return res.status(400).json({ message: "title, amount and paidBy are required" });
    if (Number(amount) <= 0) return res.status(400).json({ message: "Amount must be greater than 0" });
    const payer = await Participant.findOne({ _id: paidBy, event: eventId });
    if (!payer) return res.status(400).json({ message: "Payer is not a participant in this event" });
    const normalizedShares = await normalizeSplit({ eventId, amount, splitType, splitAmong, shares });
    const expense = await Expense.create({ event: eventId, title, amount: Number(amount), paidBy, splitType: splitType || "equal", splitAmong: normalizedShares.map((s) => s.participant), shares: normalizedShares, date: date || Date.now(), notes: notes || "", createdBy: req.user.id });
    const event = await Event.findById(eventId).select("title");
    const uniqueUsers = await Participant.find({ _id: { $in: normalizedShares.map((s) => s.participant) }, user: { $ne: null } }).select("user name");
    for (const p of uniqueUsers) if (String(p.user) !== String(req.user.id)) await createNotification({ user: p.user, type: "expense", title: "New group expense", message: `${payer.name} added ₹${Number(amount).toFixed(2)} for ${title} in ${event?.title || "your group"}.`, event: eventId });
    res.status(201).json(await expense.populate([{ path: "paidBy", select: "name" }, { path: "splitAmong", select: "name" }, { path: "shares.participant", select: "name" }]));
  } catch (err) { res.status(400).json({ message: err.message || "Could not add expense" }); }
};

exports.getExpenses = async (req, res) => {
  try { res.json(await Expense.find({ event: req.params.eventId }).populate("paidBy", "name").populate("splitAmong", "name").populate("shares.participant", "name").sort({ date: -1 })); }
  catch (err) { res.status(500).json({ message: "Could not fetch expenses", error: err.message }); }
};
exports.getExpense = async (req, res) => {
  try { const expense = await Expense.findOne({ _id: req.params.id, event: req.params.eventId }).populate("paidBy", "name").populate("splitAmong", "name").populate("shares.participant", "name"); if (!expense) return res.status(404).json({ message: "Expense not found" }); res.json(expense); }
  catch (err) { res.status(500).json({ message: "Could not fetch expense", error: err.message }); }
};
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, event: req.params.eventId });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    const amount = req.body.amount !== undefined ? Number(req.body.amount) : expense.amount;
    const paidBy = req.body.paidBy || expense.paidBy;
    const splitAmong = req.body.splitAmong || expense.splitAmong.map(String);
    if (amount <= 0) return res.status(400).json({ message: "Amount must be greater than 0" });
    const payer = await Participant.findOne({ _id: paidBy, event: req.params.eventId });
    if (!payer) return res.status(400).json({ message: "Payer is not a participant in this event" });
    const normalizedShares = await normalizeSplit({ eventId: req.params.eventId, amount, splitType: req.body.splitType || expense.splitType, splitAmong, shares: req.body.shares || expense.shares });
    Object.assign(expense, { title: req.body.title ?? expense.title, amount, paidBy, splitType: req.body.splitType || expense.splitType, splitAmong: normalizedShares.map((s) => s.participant), shares: normalizedShares, date: req.body.date ?? expense.date, notes: req.body.notes ?? expense.notes });
    await expense.save();
    res.json(await expense.populate([{ path: "paidBy", select: "name" }, { path: "splitAmong", select: "name" }, { path: "shares.participant", select: "name" }]));
  } catch (err) { res.status(400).json({ message: err.message || "Could not update expense" }); }
};
exports.deleteExpense = async (req, res) => {
  try { const removed = await Expense.findOneAndDelete({ _id: req.params.id, event: req.params.eventId }); if (!removed) return res.status(404).json({ message: "Expense not found" }); res.json({ message: "Expense deleted" }); }
  catch (err) { res.status(500).json({ message: "Could not delete expense", error: err.message }); }
};
