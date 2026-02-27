const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

chatMessageSchema.index({ from: 1, to: 1, createdAt: -1 });
chatMessageSchema.index({ to: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
