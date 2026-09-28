const Notification = require("../models/Notification");
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });
    res.json({ notifications, unreadCount });
  } catch (err) { res.status(500).json({ message: "Could not load notifications", error: err.message }); }
};
exports.markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true }, { new: true });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (err) { res.status(500).json({ message: "Could not update notification", error: err.message }); }
};
exports.markAllRead = async (req, res) => {
  try { await Notification.updateMany({ user: req.user.id, read: false }, { read: true }); res.json({ message: "All notifications marked as read" }); }
  catch (err) { res.status(500).json({ message: "Could not update notifications", error: err.message }); }
};
