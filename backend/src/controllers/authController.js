const User = require("../models/User");
const Employee = require("../models/Employee");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/jwt");
const { loadEnv } = require("../config/env");

const generateEmployeeId = async () => {
  let employeeId = "";
  let exists = true;

  while (exists) {
    const stamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).toUpperCase().slice(2, 5);
    employeeId = `ARK-${stamp}${random}`;
    // eslint-disable-next-line no-await-in-loop
    exists = Boolean(await Employee.findOne({ employeeId }).select("_id").lean());
  }

  return employeeId;
};

const sanitizeUser = (userDoc) => ({
  id: userDoc._id,
  email: userDoc.email,
  role: userDoc.role,
  isActive: userDoc.isActive
});

/**
 * @desc Login with email and password
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account is inactive");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ userId: user._id, role: user.role });
  res.status(200).json({
    success: true,
    token,
    user: sanitizeUser(user)
  });
});

/**
 * @desc Bootstrap first admin account
 * @route POST /api/auth/register-admin
 * @access Public (protected by ADMIN_BOOTSTRAP_KEY)
 */
const registerAdmin = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, bootstrapKey } = req.body;
  if (!email || !password || !firstName || !lastName || !bootstrapKey) {
    throw new ApiError(400, "Missing required fields");
  }

  const { ADMIN_BOOTSTRAP_KEY } = loadEnv();
  if (!ADMIN_BOOTSTRAP_KEY) {
    throw new ApiError(500, "ADMIN_BOOTSTRAP_KEY is not configured");
  }
  if (bootstrapKey !== ADMIN_BOOTSTRAP_KEY) {
    throw new ApiError(403, "Invalid bootstrap key");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "Email is already registered");
  }

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    role: "admin"
  });

  await Employee.create({
    user: user._id,
    firstName,
    lastName,
    department: "Administration",
    designation: "HR Manager"
  });

  const token = signToken({ userId: user._id, role: user.role });
  res.status(201).json({
    success: true,
    token,
    user: sanitizeUser(user)
  });
});

/**
 * @desc Get currently logged-in user
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res) => {
  let profile = await Employee.findOne({ user: req.user._id }).lean();
  if (profile && !profile.employeeId) {
    const employeeId = await generateEmployeeId();
    await Employee.findByIdAndUpdate(profile._id, { employeeId });
    profile = { ...profile, employeeId };
  }

  res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
    profile
  });
});

/**
 * @desc Change password for current user
 * @route PUT /api/auth/change-password
 * @access Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new password are required");
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully"
  });
});

module.exports = {
  login,
  registerAdmin,
  getMe,
  changePassword
};
