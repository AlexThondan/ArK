const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      index: true
    },
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
    personalEmail: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
    },
    alternatePhone: {
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
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed", "prefer-not-to-say"]
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    },
    nationality: {
      type: String,
      trim: true
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
    workMode: {
      type: String,
      enum: ["onsite", "hybrid", "remote"],
      default: "onsite"
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "intern"],
      default: "full-time"
    },
    emergencyContact: {
      name: String,
      relation: String,
      phone: String
    },
    governmentIds: {
      pan: String,
      aadhaar: String,
      passport: String
    },
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      ifsc: String,
      bankName: String,
      branch: String,
      upiId: String
    },
    education: [
      {
        degree: String,
        institution: String,
        year: Number,
        grade: String
      }
    ],
    experience: {
      totalYears: Number,
      previousCompany: String
    },
    bio: {
      type: String,
      trim: true
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
