const express = require("express");
const { getEmployeeDashboard, getAdminDashboard } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * GET /api/dashboard/employee
 * GET /api/dashboard/admin
 */
router.get("/employee", protect, allowRoles("employee"), getEmployeeDashboard);
router.get("/admin", protect, allowRoles("admin"), getAdminDashboard);

module.exports = router;
