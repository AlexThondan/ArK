const mongoose = require("mongoose");

const projectChecklistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isChecked: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

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
    assignmentType: {
      type: String,
      enum: ["individual", "team"],
      default: "individual",
      index: true
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      index: true
    },
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
    },
    checklists: [projectChecklistSchema]
  },
  { timestamps: true }
);

projectSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.model("Project", projectSchema);
