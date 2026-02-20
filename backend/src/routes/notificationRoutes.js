const express = require("express");
const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * GET /api/notifications
 * PATCH /api/notifications/read-all
 * PATCH /api/notifications/:id/read
 */
router.get("/", protect, getMyNotifications);
router.patch("/read-all", protect, markAllNotificationsRead);
router.patch("/:id/read", protect, markNotificationRead);

module.exports = router;
