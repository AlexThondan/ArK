const express = require("express");
const {
  createTask,
  getMyTasks,
  getAdminTasks,
  updateTask,
  updateTaskStatus,
  updateTaskChecklist,
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
 * PATCH /api/tasks/:id
 * PATCH /api/tasks/:id/status
 * PATCH /api/tasks/:id/checklists
 * POST /api/tasks/:id/attachments
 */
router.post("/", protect, allowRoles("admin"), createTask);
router.get("/me", protect, allowRoles("employee", "manager"), getMyTasks);
router.get("/admin", protect, allowRoles("admin"), getAdminTasks);
router.patch("/:id", protect, allowRoles("admin"), updateTask);
router.patch("/:id/status", protect, updateTaskStatus);
router.patch("/:id/checklists", protect, updateTaskChecklist);
router.post("/:id/attachments", protect, upload.single("file"), uploadTaskAttachment);

module.exports = router;
