const User = require("../models/User");
const Notification = require("../models/Notification");

const createNotification = async ({ userId, type, title, message, link = "/", metadata = {} }) =>
  Notification.create({
    user: userId,
    type,
    title,
    message,
    link,
    metadata
  });

const notifyUsersByRole = async ({ role, type, title, message, link = "/", metadata = {} }) => {
  const users = await User.find({ role, isActive: true }).select("_id").lean();
  if (!users.length) return [];

  const docs = users.map((user) => ({
    user: user._id,
    type,
    title,
    message,
    link,
    metadata
  }));
  return Notification.insertMany(docs);
};

module.exports = {
  createNotification,
  notifyUsersByRole
};
