const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    teamRole: {
      type: String,
      trim: true,
      required: true
    }
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
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
    department: {
      type: String,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    members: [teamMemberSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

teamSchema.index({ department: 1, isActive: 1 });
teamSchema.index({ "members.user": 1 });

module.exports = mongoose.model("Team", teamSchema);
