const User = require("../models/User");
const Employee = require("../models/Employee");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination } = require("../utils/pagination");

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

const pickProfilePayload = (body) => ({
  employeeId: body.employeeId,
  firstName: body.firstName,
  lastName: body.lastName,
  phone: body.phone,
  personalEmail: body.personalEmail,
  alternatePhone: body.alternatePhone,
  dob: body.dob,
  gender: body.gender,
  maritalStatus: body.maritalStatus,
  bloodGroup: body.bloodGroup,
  nationality: body.nationality,
  department: body.department,
  designation: body.designation,
  salary: body.salary,
  joinDate: body.joinDate,
  manager: body.manager,
  workMode: body.workMode,
  employmentType: body.employmentType,
  emergencyContact: body.emergencyContact,
  governmentIds: body.governmentIds,
  bankDetails: body.bankDetails,
  education: body.education,
  experience: body.experience,
  bio: body.bio,
  address: body.address,
  skills: body.skills,
  certifications: body.certifications,
  leaveBalance: body.leaveBalance
});

/**
 * @desc Create an employee and login account
 * @route POST /api/employees
 * @access Admin
 */
const createEmployee = asyncHandler(async (req, res) => {
  const { email, password, role = "employee" } = req.body;
  const profilePayload = pickProfilePayload(req.body);

  if (
    !email ||
    !password ||
    !profilePayload.firstName ||
    !profilePayload.lastName ||
    !profilePayload.department ||
    !profilePayload.designation
  ) {
    throw new ApiError(
      400,
      "email, password, firstName, lastName, department, designation are required"
    );
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "Email is already registered");
  }

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    role
  });

  try {
    if (!profilePayload.employeeId) {
      profilePayload.employeeId = await generateEmployeeId();
    } else {
      profilePayload.employeeId = profilePayload.employeeId.toString().trim().toUpperCase();
    }

    const employee = await Employee.create({
      user: user._id,
      ...profilePayload
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        },
        employee
      }
    });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
});

/**
 * @desc List employees with filters and pagination
 * @route GET /api/employees
 * @access Admin
 */
const getEmployees = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, department, designation, role, isActive } = req.query;
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);

  const matchEmployee = {};
  if (search) {
    matchEmployee.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } }
    ];
  }
  if (department) matchEmployee.department = department;
  if (designation) matchEmployee.designation = designation;

  const matchUser = {};
  if (role) matchUser["user.role"] = role;
  if (typeof isActive !== "undefined") matchUser["user.isActive"] = isActive === "true";

  const basePipeline = [
    { $match: matchEmployee },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    { $match: matchUser },
    {
      $project: {
        employeeId: 1,
        firstName: 1,
        lastName: 1,
        phone: 1,
        personalEmail: 1,
        alternatePhone: 1,
        dob: 1,
        gender: 1,
        maritalStatus: 1,
        bloodGroup: 1,
        nationality: 1,
        department: 1,
        designation: 1,
        salary: 1,
        joinDate: 1,
        workMode: 1,
        employmentType: 1,
        emergencyContact: 1,
        governmentIds: 1,
        bankDetails: 1,
        education: 1,
        experience: 1,
        address: 1,
        skills: 1,
        leaveBalance: 1,
        avatarUrl: 1,
        "user._id": 1,
        "user.email": 1,
        "user.role": 1,
        "user.isActive": 1
      }
    }
  ];

  const [items, countDoc] = await Promise.all([
    Employee.aggregate([...basePipeline, { $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: parsedLimit }]),
    Employee.aggregate([...basePipeline, { $count: "total" }])
  ]);

  const total = countDoc[0]?.total || 0;

  res.status(200).json({
    success: true,
    data: items,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  });
});

/**
 * @desc Get one employee details
 * @route GET /api/employees/:id
 * @access Admin
 */
const getEmployeeById = asyncHandler(async (req, res) => {
  const employee =
    (await Employee.findOne({ user: req.params.id }).populate("user", "email role isActive")) ||
    (await Employee.findById(req.params.id).populate("user", "email role isActive"));

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  if (!employee.employeeId) {
    employee.employeeId = await generateEmployeeId();
    await employee.save();
  }

  res.status(200).json({
    success: true,
    data: employee
  });
});

/**
 * @desc Update employee profile and account role
 * @route PUT /api/employees/:id
 * @access Admin
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.params.id });
  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  const profilePayload = pickProfilePayload(req.body);
  Object.keys(profilePayload).forEach((key) => {
    if (typeof profilePayload[key] !== "undefined") employee[key] = profilePayload[key];
  });

  if (profilePayload.employeeId) {
    employee.employeeId = profilePayload.employeeId.toString().trim().toUpperCase();
  } else if (!employee.employeeId) {
    employee.employeeId = await generateEmployeeId();
  }

  await employee.save();

  const userUpdates = {};
  if (typeof req.body.role !== "undefined") userUpdates.role = req.body.role;
  if (typeof req.body.isActive !== "undefined") userUpdates.isActive = req.body.isActive;
  if (typeof req.body.email !== "undefined") userUpdates.email = req.body.email.toLowerCase();

  if (Object.keys(userUpdates).length > 0) {
    await User.findByIdAndUpdate(req.params.id, userUpdates, { runValidators: true });
  }

  const updated = await Employee.findOne({ user: req.params.id }).populate("user", "email role isActive");
  res.status(200).json({
    success: true,
    data: updated
  });
});

/**
 * @desc Deactivate employee account
 * @route DELETE /api/employees/:id
 * @access Admin
 */
const deleteEmployee = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Employee deactivated"
  });
});

/**
 * @desc Get current employee profile
 * @route GET /api/employees/me
 * @access Private
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await Employee.findOne({ user: req.user._id }).populate("user", "email role isActive");
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  if (!profile.employeeId) {
    profile.employeeId = await generateEmployeeId();
    await profile.save();
  }

  res.status(200).json({
    success: true,
    data: profile
  });
});

/**
 * @desc Update current employee profile
 * @route PUT /api/employees/me
 * @access Private
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await Employee.findOne({ user: req.user._id });
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  const allowedFields = [
    "firstName",
    "lastName",
    "phone",
    "personalEmail",
    "alternatePhone",
    "dob",
    "gender",
    "maritalStatus",
    "bloodGroup",
    "nationality",
    "workMode",
    "employmentType",
    "emergencyContact",
    "governmentIds",
    "bankDetails",
    "education",
    "experience",
    "bio",
    "address",
    "skills",
    "certifications"
  ];
  allowedFields.forEach((field) => {
    if (typeof req.body[field] !== "undefined") {
      profile[field] = req.body[field];
    }
  });
  await profile.save();

  res.status(200).json({
    success: true,
    data: profile
  });
});

/**
 * @desc Upload current employee avatar
 * @route PUT /api/employees/me/avatar
 * @access Private
 */
const updateMyAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Avatar file is required");
  }

  const profile = await Employee.findOne({ user: req.user._id });
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.avatarUrl = `/uploads/${req.file.filename}`;
  await profile.save();

  res.status(200).json({
    success: true,
    avatarUrl: profile.avatarUrl
  });
});

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getMyProfile,
  updateMyProfile,
  updateMyAvatar
};
