const express = require("express");
const {
  uploadDocument,
  getMyDocuments,
  getDocumentById,
  updateDocument
} = require("../controllers/documentController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

/**
 * POST /api/documents/upload
 * GET /api/documents/me
 * PATCH /api/documents/:id
 * GET /api/documents/:id
 */
router.post("/upload", protect, upload.single("file"), uploadDocument);
router.get("/me", protect, getMyDocuments);
router.patch("/:id", protect, updateDocument);
router.get("/:id", protect, getDocumentById);

module.exports = router;
