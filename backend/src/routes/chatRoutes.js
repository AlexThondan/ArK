const express = require("express");
const {
  getContacts,
  getMessages,
  getInbox,
  sendMessage,
  markConversationRead
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * GET /api/chat/contacts
 * GET /api/chat/messages?with=:userId
 * GET /api/chat/inbox
 * POST /api/chat/messages
 * PATCH /api/chat/read
 */
router.get("/contacts", protect, getContacts);
router.get("/messages", protect, getMessages);
router.get("/inbox", protect, getInbox);
router.post("/messages", protect, sendMessage);
router.patch("/read", protect, markConversationRead);

module.exports = router;
