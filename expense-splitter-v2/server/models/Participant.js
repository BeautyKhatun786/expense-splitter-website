const mongoose = require("mongoose");

// A participant links a user (or a guest name) to a specific event.
const participantSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true }, // display name (guest or user's name)
    email: { type: String, default: "" },
  },
  { timestamps: true }
);

participantSchema.index({ event: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Participant", participantSchema);
