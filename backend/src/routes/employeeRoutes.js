const express = require("express");
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getMyProfile,
  updateMyProfile,
  updateMyAvatar
} = require("../controllers/employeeController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

/**
 * GET /api/employees/me
 * PUT /api/employees/me
 * PUT /api/employees/me/avatar
 */
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);
router.put("/me/avatar", protect, upload.single("avatar"), updateMyAvatar);

/**
 * GET /api/employees
 * POST /api/employees
 * GET /api/employees/:id
 * PUT /api/employees/:id
 * DELETE /api/employees/:id
 */
router.get("/", protect, allowRoles("admin"), getEmployees);
router.post("/", protect, allowRoles("admin"), createEmployee);
router.get("/:id", protect, allowRoles("admin"), getEmployeeById);
router.put("/:id", protect, allowRoles("admin"), updateEmployee);
router.delete("/:id", protect, allowRoles("admin"), deleteEmployee);

module.exports = router;
