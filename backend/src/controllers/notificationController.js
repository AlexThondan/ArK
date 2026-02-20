const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination } = require("../utils/pagination");

/**
 * @desc List notifications for current user
 * @route GET /api/notifications
 * @access Private
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);

  const filter = { user: req.user._id };
  if (unreadOnly === "true") {
    filter.isRead = false;
  }

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false })
  ]);

  res.status(200).json({
    success: true,
    data: items,
    unreadCount,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  });
});

/**
 * @desc Mark one notification as read
 * @route PATCH /api/notifications/:id/read
 * @access Private
 */
const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification
  });
});

/**
 * @desc Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 * @access Private
 */
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });

  res.status(200).json({
    success: true,
    message: "All notifications marked as read"
  });
});

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
