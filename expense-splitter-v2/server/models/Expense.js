const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "Participant", required: true },
    splitType: { type: String, enum: ["equal", "exact", "percentage"], default: "equal" },
    splitAmong: [{ type: mongoose.Schema.Types.ObjectId, ref: "Participant", required: true }],
    shares: [{ participant: { type: mongoose.Schema.Types.ObjectId, ref: "Participant" }, value: { type: Number, min: 0 } }],
    date: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
