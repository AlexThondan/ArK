const express = require("express");
const {
  createTask,
  getMyTasks,
  getAdminTasks,
  updateTaskStatus,
  uploadTaskAttachment
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

/**
 * POST /api/tasks
 * GET /api/tasks/me
 * GET /api/tasks/admin
 * PATCH /api/tasks/:id/status
 * POST /api/tasks/:id/attachments
 */
router.post("/", protect, allowRoles("admin"), createTask);
router.get("/me", protect, allowRoles("employee"), getMyTasks);
router.get("/admin", protect, allowRoles("admin"), getAdminTasks);
router.patch("/:id/status", protect, updateTaskStatus);
router.post("/:id/attachments", protect, upload.single("file"), uploadTaskAttachment);

module.exports = router;
