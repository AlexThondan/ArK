const express = require("express");
const {
  getDepartmentProductivity,
  getLeaveTrends,
  getPerformanceMetrics
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * GET /api/reports/department-productivity
 * GET /api/reports/leave-trends
 * GET /api/reports/performance
 */
router.get("/department-productivity", protect, allowRoles("admin", "hr"), getDepartmentProductivity);
router.get("/leave-trends", protect, allowRoles("admin", "hr"), getLeaveTrends);
router.get("/performance", protect, allowRoles("admin", "hr"), getPerformanceMetrics);

module.exports = router;
