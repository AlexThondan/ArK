const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    departmentSnapshot: {
      type: String,
      index: true
    },
    leaveType: {
      type: String,
      enum: ["annual", "sick", "casual", "unpaid"],
      required: true,
      index: true
    },
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    days: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    handoverNotes: {
      type: String,
      trim: true
    },
    contactDuringLeave: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: {
      type: Date
    },
    reviewComment: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

leaveSchema.index({ status: 1, departmentSnapshot: 1, startDate: 1 });

module.exports = mongoose.model("Leave", leaveSchema);
