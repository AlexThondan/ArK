const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    logoUrl: {
      type: String,
      trim: true
    },
    contactRole: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    timezone: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    contractValue: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["prospect", "active", "inactive"],
      default: "active",
      index: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

clientSchema.index({ name: 1, company: 1 });
clientSchema.index({ status: 1, industry: 1 });

module.exports = mongoose.model("Client", clientSchema);
