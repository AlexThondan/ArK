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
      enum: [
        "resume",
        "certificate",
        "task-doc",
        "profile-image",
        "id-proof",
        "payroll",
        "policy",
        "other"
      ],
      default: "other",
      index: true
    },
    category: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    expiresOn: {
      type: Date
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
documentSchema.index({ user: 1, category: 1, expiresOn: 1 });

module.exports = mongoose.model("Document", documentSchema);
