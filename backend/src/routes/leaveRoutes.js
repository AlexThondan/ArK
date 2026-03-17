const express = require("express");
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeave,
  reviewLeave,
  getLeaveAnalytics
} = require("../controllers/leaveController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * POST /api/leaves
 * GET /api/leaves/me
 * PUT /api/leaves/:id
 */
router.post("/", protect, allowRoles("employee", "manager"), applyLeave);
router.get("/me", protect, allowRoles("employee", "manager"), getMyLeaves);
router.put("/:id", protect, updateLeave);

/**
 * GET /api/leaves/admin
 * PATCH /api/leaves/:id/review
 * GET /api/leaves/analytics
 */
router.get("/admin", protect, allowRoles("admin", "hr"), getAllLeaves);
router.patch("/:id/review", protect, allowRoles("admin", "hr"), reviewLeave);
router.get("/analytics", protect, allowRoles("admin", "hr"), getLeaveAnalytics);

module.exports = router;
