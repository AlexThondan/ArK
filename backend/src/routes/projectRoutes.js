const express = require("express");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject
} = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * POST /api/projects
 * GET /api/projects
 * GET /api/projects/:id
 * PATCH /api/projects/:id
 */
router.post("/", protect, allowRoles("admin"), createProject);
router.get("/", protect, getProjects);
router.get("/:id", protect, getProjectById);
router.patch("/:id", protect, allowRoles("admin"), updateProject);

module.exports = router;
