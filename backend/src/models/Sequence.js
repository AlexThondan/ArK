const mongoose = require("mongoose");

const sequenceSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    value: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sequence", sequenceSchema);
