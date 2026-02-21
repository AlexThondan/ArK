const express = require("express");
const { createTeam, getTeams, updateTeam } = require("../controllers/teamController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * POST /api/teams
 * GET /api/teams
 * PATCH /api/teams/:id
 */
router.post("/", protect, allowRoles("admin"), createTeam);
router.get("/", protect, getTeams);
router.patch("/:id", protect, allowRoles("admin"), updateTeam);

module.exports = router;
