const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "Participant", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "Participant", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, default: Date.now },
    note: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settlement", settlementSchema);
