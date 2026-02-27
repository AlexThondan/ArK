const { Parser } = require("json2csv");
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination } = require("../utils/pagination");
const { startOfUtcDay, diffInMinutes } = require("../utils/date");

const getDepartmentSnapshot = async (userId) => {
  const employee = await Employee.findOne({ user: userId }).select("department");
  return employee?.department || "Unknown";
};

const parseUtcDay = (value, fieldName) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, `${fieldName} is invalid`);
  }
  return startOfUtcDay(parsed);
};

const parseCheckOutDateTime = ({ date, checkOutTime }) => {
  if (!checkOutTime) return null;

  // Allow both HH:mm and full datetime values.
  if (/^\d{2}:\d{2}$/.test(checkOutTime)) {
    const [hours, minutes] = checkOutTime.split(":").map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new ApiError(400, "checkOutTime must be in HH:mm format");
    }
    const [year, month, day] = String(date)
      .split("-")
      .map((value) => Number(value));
    const parsed = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
    if (Number.isNaN(parsed.getTime())) {
      throw new ApiError(400, "checkOutTime is invalid");
    }
    return parsed;
  }

  const parsed = new Date(checkOutTime);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "checkOutTime is invalid");
  }
  return parsed;
};

/**
 * @desc Employee check-in
 * @route POST /api/attendance/check-in
 * @access Employee
 */
const checkIn = asyncHandler(async (req, res) => {
  const date = startOfUtcDay(new Date());
  const existing = await Attendance.findOne({ user: req.user._id, date });

  if (existing?.checkIn) {
    throw new ApiError(409, "Already checked in today");
  }

  const departmentSnapshot = await getDepartmentSnapshot(req.user._id);

  const record =
    existing ||
    (await Attendance.create({
      user: req.user._id,
      date,
      departmentSnapshot
    }));

  record.checkIn = new Date();
  record.status = "present";
  await record.save();

  res.status(200).json({
    success: true,
    data: record
  });
});

/**
 * @desc Employee check-out
 * @route POST /api/attendance/check-out
 * @access Employee
 */
const checkOut = asyncHandler(async (req, res) => {
  const requestedDate = req.body?.date;
  const requestedCheckOutTime = req.body?.checkOutTime;
  const requestedNotes = req.body?.notes;

  if (requestedDate && !requestedCheckOutTime) {
    throw new ApiError(400, "checkOutTime is required when date is provided");
  }

  const date = requestedDate ? parseUtcDay(requestedDate, "date") : startOfUtcDay(new Date());
  const record = await Attendance.findOne({ user: req.user._id, date });

  if (!record?.checkIn) {
    throw new ApiError(400, "Check-in required before check-out");
  }
  if (record.checkOut) {
    throw new ApiError(409, "Already checked out for the selected date");
  }

  const fallbackDateInput = date.toISOString().slice(0, 10);
  const checkOutTime = parseCheckOutDateTime({
    date: requestedDate || fallbackDateInput,
    checkOutTime: requestedCheckOutTime
  }) || new Date();

  if (startOfUtcDay(checkOutTime).getTime() !== date.getTime()) {
    throw new ApiError(400, "checkOutTime must belong to the selected date");
  }
  if (checkOutTime <= record.checkIn) {
    throw new ApiError(400, "checkOutTime must be after check-in");
  }

  record.checkOut = checkOutTime;
  record.workDurationMinutes = diffInMinutes(record.checkIn, checkOutTime);
  record.status = record.workDurationMinutes >= 240 ? "present" : "half-day";
  if (typeof requestedNotes !== "undefined") {
    record.notes = String(requestedNotes || "").trim();
  }
  await record.save();

  res.status(200).json({
    success: true,
    data: record
  });
});

/**
 * @desc Get current employee attendance history
 * @route GET /api/attendance/me
 * @access Employee
 */
const getMyAttendance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, dateFrom, dateTo } = req.query;
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);

  const filter = { user: req.user._id };
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);
  }

  const [items, total] = await Promise.all([
    Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(parsedLimit),
    Attendance.countDocuments(filter)
  ]);

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

const buildAdminAttendancePipeline = ({ department, status, dateFrom, dateTo, userId }) => {
  const match = {};
  if (department) match.departmentSnapshot = department;
  if (status) match.status = status;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    match.user = new mongoose.Types.ObjectId(userId);
  }
  if (dateFrom || dateTo) {
    match.date = {};
    if (dateFrom) match.date.$gte = new Date(dateFrom);
    if (dateTo) match.date.$lte = new Date(dateTo);
  }

  return [
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "employees",
        localField: "user._id",
        foreignField: "user",
        as: "employee"
      }
    },
    { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        date: 1,
        checkIn: 1,
        checkOut: 1,
        workDurationMinutes: 1,
        status: 1,
        departmentSnapshot: 1,
        "user._id": 1,
        "user.email": 1,
        firstName: "$employee.firstName",
        lastName: "$employee.lastName"
      }
    }
  ];
};

/**
 * @desc Admin attendance list
 * @route GET /api/attendance/admin
 * @access Admin
 */
const getAllAttendance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);
  if (req.query.userId && !mongoose.Types.ObjectId.isValid(req.query.userId)) {
    throw new ApiError(400, "userId is invalid");
  }

  const pipeline = buildAdminAttendancePipeline(req.query);
  const [items, countDoc] = await Promise.all([
    Attendance.aggregate([
      ...pipeline,
      { $sort: { date: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: parsedLimit }
    ]),
    Attendance.aggregate([...pipeline, { $count: "total" }])
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
 * @desc Export attendance CSV
 * @route GET /api/attendance/admin/export
 * @access Admin
 */
const exportAttendanceCsv = asyncHandler(async (req, res) => {
  if (req.query.userId && !mongoose.Types.ObjectId.isValid(req.query.userId)) {
    throw new ApiError(400, "userId is invalid");
  }

  const records = await Attendance.aggregate([
    ...buildAdminAttendancePipeline(req.query),
    { $sort: { date: -1 } }
  ]);

  const parser = new Parser({
    fields: [
      { label: "Date", value: "date" },
      { label: "Email", value: "user.email" },
      { label: "First Name", value: "firstName" },
      { label: "Last Name", value: "lastName" },
      { label: "Department", value: "departmentSnapshot" },
      { label: "Status", value: "status" },
      { label: "Check In", value: "checkIn" },
      { label: "Check Out", value: "checkOut" },
      { label: "Work Duration (mins)", value: "workDurationMinutes" }
    ]
  });

  const csv = parser.parse(records);
  res.header("Content-Type", "text/csv");
  res.attachment(`attendance-report-${Date.now()}.csv`);
  res.send(csv);
});

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  exportAttendanceCsv
};
