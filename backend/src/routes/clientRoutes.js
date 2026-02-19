const express = require("express");
const {
  createClient,
  getClients,
  getClientById,
  updateClient
} = require("../controllers/clientController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * POST /api/clients
 * GET /api/clients
 * GET /api/clients/:id
 * PATCH /api/clients/:id
 */
router.post("/", protect, allowRoles("admin"), createClient);
router.get("/", protect, getClients);
router.get("/:id", protect, getClientById);
router.patch("/:id", protect, allowRoles("admin"), updateClient);

module.exports = router;
