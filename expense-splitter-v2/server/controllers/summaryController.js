const Expense = require("../models/Expense");
const Participant = require("../models/Participant");
const Settlement = require("../models/Settlement");

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

async function computeEventSummary(eventId) {
  const participants = await Participant.find({ event: eventId });
  const expenses = await Expense.find({ event: eventId });
  const settlements = await Settlement.find({ event: eventId });
  const balances = {};
  participants.forEach((p) => { balances[p._id.toString()] = { id: p._id.toString(), name: p.name, paid: 0, owed: 0, settledOut: 0, settledIn: 0 }; });
  let totalExpense = 0;

  expenses.forEach((exp) => {
    totalExpense += exp.amount;
    const payerId = String(exp.paidBy);
    if (balances[payerId]) balances[payerId].paid += exp.amount;
    if (Array.isArray(exp.shares) && exp.shares.length) {
      exp.shares.forEach((share) => { const id = String(share.participant); if (balances[id]) balances[id].owed += share.value; });
    } else {
      const ids = exp.splitAmong || [];
      const share = exp.amount / (ids.length || 1);
      ids.forEach((id) => { const key = String(id); if (balances[key]) balances[key].owed += share; });
    }
  });

  settlements.forEach((s) => {
    const from = String(s.from); const to = String(s.to);
    if (balances[from]) balances[from].settledOut += s.amount;
    if (balances[to]) balances[to].settledIn += s.amount;
  });

  const balanceList = Object.values(balances).map((b) => ({ ...b, paid: round2(b.paid), owed: round2(b.owed), settledOut: round2(b.settledOut), settledIn: round2(b.settledIn), net: round2(b.paid - b.owed + b.settledOut - b.settledIn) }));
  const debtors = balanceList.filter((b) => b.net < -0.01).map((b) => ({ ...b }));
  const creditors = balanceList.filter((b) => b.net > 0.01).map((b) => ({ ...b }));
  const suggestedSettlements = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i], creditor = creditors[j];
    const amount = Math.min(-debtor.net, creditor.net);
    if (amount > 0.01) suggestedSettlements.push({ fromId: debtor.id, toId: creditor.id, from: debtor.name, to: creditor.name, amount: round2(amount) });
    debtor.net = round2(debtor.net + amount); creditor.net = round2(creditor.net - amount);
    if (Math.abs(debtor.net) < 0.01) i += 1;
    if (Math.abs(creditor.net) < 0.01) j += 1;
  }

  return { totalExpense: round2(totalExpense), participantCount: participants.length, expenseCount: expenses.length, balances: balanceList, settlements: suggestedSettlements, recordedSettlements: settlements.map((s) => ({ id: s._id, from: s.from, to: s.to, amount: s.amount, date: s.date, note: s.note })) };
}
exports.getSummary = async (req, res) => { try { res.json(await computeEventSummary(req.params.eventId)); } catch (err) { res.status(500).json({ message: "Could not compute summary", error: err.message }); } };
exports._computeEventSummary = computeEventSummary;
