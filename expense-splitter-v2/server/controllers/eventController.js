const mongoose = require("mongoose");
const Event = require("../models/Event");
const Participant = require("../models/Participant");
const Expense = require("../models/Expense");
const User = require("../models/User");

// POST /api/events
exports.createEvent = async (req, res) => {
  let createdEvent = null;

  try {
    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const location = String(req.body?.location || "").trim();
    const rawDate = req.body?.date;

    if (!title) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!req.user?.id || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: "Your login session is invalid. Please log in again." });
    }

    const creator = await User.findById(req.user.id).select("_id name email");
    if (!creator) {
      return res.status(401).json({ message: "User account was not found. Please log in again." });
    }

    let date;
    if (rawDate) {
      date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({ message: "Please enter a valid date." });
      }
    }

    // Create the event first.
    createdEvent = await Event.create({
      title,
      description,
      ...(date ? { date } : {}),
      location,
      createdBy: creator._id,
    });

    // The creator is automatically the first group member.
    await Participant.create({
      event: createdEvent._id,
      user: creator._id,
      name: creator.name || "You",
      email: creator.email || "",
    });

    return res.status(201).json(createdEvent);
  } catch (err) {
    // Do not leave an orphan event behind if participant creation fails.
    if (createdEvent?._id) {
      try {
        await Participant.deleteMany({ event: createdEvent._id });
        await Event.deleteOne({ _id: createdEvent._id });
      } catch (cleanupError) {
        console.error("Create-event cleanup failed:", cleanupError);
      }
    }

    console.error("CREATE EVENT ERROR:", err);

    if (err?.code === 11000) {
      return res.status(409).json({
        message: "A duplicate group member record was detected. Please try again.",
      });
    }

    if (err?.name === "ValidationError" || err?.name === "CastError") {
      return res.status(400).json({
        message: "Invalid group information. Please check the form and try again.",
        error: err.message,
      });
    }

    return res.status(500).json({
      message: "Could not create event",
      error: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  }
};

// GET /api/events  -> events the user created OR participates in
exports.getEvents = async (req, res) => {
  try {
    const myParticipantRows = await Participant.find({ user: req.user.id }).select("event");
    const eventIds = myParticipantRows.map((p) => p.event);

    const events = await Event.find({
      $or: [{ createdBy: req.user.id }, { _id: { $in: eventIds } }],
    }).sort({ date: -1 });

    res.json(events);
  } catch (err) {
    console.error("GET EVENTS ERROR:", err);
    res.status(500).json({ message: "Could not fetch events", error: err.message });
  }
};

// GET /api/events/:id
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch event", error: err.message });
  }
};

// PUT /api/events/:id
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the event creator can edit this event" });
    }

    const { title, description, date, location } = req.body;
    if (title !== undefined) {
      const cleanTitle = String(title).trim();
      if (!cleanTitle) return res.status(400).json({ message: "Group name is required" });
      event.title = cleanTitle;
    }
    if (description !== undefined) event.description = String(description).trim();
    if (date !== undefined) event.date = date ? new Date(date) : null;
    if (location !== undefined) event.location = String(location).trim();

    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: "Could not update event", error: err.message });
  }
};

// DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the event creator can delete this event" });
    }

    const participants = await Participant.find({ event: event._id }).select("_id");
    const participantIds = participants.map((p) => p._id);

    await Expense.deleteMany({ event: event._id });
    await Participant.deleteMany({ event: event._id });
    await event.deleteOne();

    res.json({ message: "Event and related data deleted", removedParticipants: participantIds.length });
  } catch (err) {
    res.status(500).json({ message: "Could not delete event", error: err.message });
  }
};
