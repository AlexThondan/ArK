const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      index: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
      }
    ],
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    budget: {
      type: Number
    },
    status: {
      type: String,
      enum: ["planning", "active", "on-hold", "completed"],
      default: "planning",
      index: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  { timestamps: true }
);

projectSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.model("Project", projectSchema);
