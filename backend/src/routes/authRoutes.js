const express = require("express");
const { login, registerAdmin, getMe, changePassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * POST /api/auth/login
 * POST /api/auth/register-admin
 * GET /api/auth/me
 * PUT /api/auth/change-password
 */
router.post("/login", login);
router.post("/register-admin", registerAdmin);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

module.exports = router;
