const Notification = require("../models/Notification");
exports.createNotification = async ({ user, type, title, message, event = null }) => {
  if (!user) return null;
  return Notification.create({ user, type, title, message, event });
};
