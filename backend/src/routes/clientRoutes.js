const express = require("express");
const {
  createClient,
  getClients,
  getClientById,
  updateClient,
  uploadClientLogo
} = require("../controllers/clientController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

/**
 * POST /api/clients
 * GET /api/clients
 * GET /api/clients/:id
 * PATCH /api/clients/:id
 * PATCH /api/clients/:id/logo
 */
router.post("/", protect, allowRoles("admin"), createClient);
router.get("/", protect, getClients);
router.get("/:id", protect, getClientById);
router.patch("/:id", protect, allowRoles("admin"), updateClient);
router.patch("/:id/logo", protect, allowRoles("admin"), upload.single("logo"), uploadClientLogo);

module.exports = router;
