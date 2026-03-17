const express = require("express");
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  exportAttendanceCsv
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * POST /api/attendance/check-in
 * POST /api/attendance/check-out
 * GET /api/attendance/me
 */
router.post("/check-in", protect, allowRoles("employee", "manager"), checkIn);
router.post("/check-out", protect, allowRoles("employee", "manager"), checkOut);
router.get("/me", protect, allowRoles("employee", "manager"), getMyAttendance);

/**
 * GET /api/attendance/admin
 * GET /api/attendance/admin/export
 */
router.get("/admin/export", protect, allowRoles("admin", "hr"), exportAttendanceCsv);
router.get("/admin", protect, allowRoles("admin", "hr"), getAllAttendance);

module.exports = router;
