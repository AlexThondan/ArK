const express = require("express");
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
  getLeaveAnalytics
} = require("../controllers/leaveController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * POST /api/leaves
 * GET /api/leaves/me
 */
router.post("/", protect, allowRoles("employee"), applyLeave);
router.get("/me", protect, allowRoles("employee"), getMyLeaves);

/**
 * GET /api/leaves/admin
 * PATCH /api/leaves/:id/review
 * GET /api/leaves/analytics
 */
router.get("/admin", protect, allowRoles("admin"), getAllLeaves);
router.patch("/:id/review", protect, allowRoles("admin"), reviewLeave);
router.get("/analytics", protect, allowRoles("admin"), getLeaveAnalytics);

module.exports = router;
