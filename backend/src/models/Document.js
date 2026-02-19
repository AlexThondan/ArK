const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["resume", "certificate", "task-doc", "profile-image", "other"],
      default: "other",
      index: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String
    },
    size: {
      type: Number
    },
    fileUrl: {
      type: String,
      required: true
    },
    visibility: {
      type: String,
      enum: ["private", "hr-only", "shared"],
      default: "private"
    }
  },
  { timestamps: true }
);

documentSchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model("Document", documentSchema);
