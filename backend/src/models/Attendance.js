const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
      index: true
    },
    checkIn: {
      type: Date
    },
    checkOut: {
      type: Date
    },
    workDurationMinutes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["present", "absent", "half-day", "on-leave"],
      default: "present",
      index: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, departmentSnapshot: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
