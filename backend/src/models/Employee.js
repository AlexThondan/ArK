const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    dob: {
      type: Date
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "prefer-not-to-say"]
    },
    department: {
      type: String,
      required: true,
      index: true
    },
    designation: {
      type: String,
      required: true,
      index: true
    },
    salary: {
      type: Number,
      default: 0
    },
    joinDate: {
      type: Date,
      default: Date.now
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    skills: [
      {
        type: String,
        trim: true
      }
    ],
    certifications: [
      {
        title: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        credentialUrl: String
      }
    ],
    leaveBalance: {
      annual: { type: Number, default: 20 },
      sick: { type: Number, default: 10 },
      casual: { type: Number, default: 7 }
    },
    avatarUrl: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

employeeSchema.index({ firstName: 1, lastName: 1 });
employeeSchema.index({ department: 1, designation: 1 });

module.exports = mongoose.model("Employee", employeeSchema);
