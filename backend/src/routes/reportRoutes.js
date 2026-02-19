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
router.get("/department-productivity", protect, allowRoles("admin"), getDepartmentProductivity);
router.get("/leave-trends", protect, allowRoles("admin"), getLeaveTrends);
router.get("/performance", protect, allowRoles("admin"), getPerformanceMetrics);

module.exports = router;
