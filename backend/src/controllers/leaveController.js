const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination } = require("../utils/pagination");
const { calculateLeaveDays, startOfUtcDay } = require("../utils/date");
const { createNotification, notifyUsersByRole } = require("../utils/notificationService");

const refundApprovedLeave = async ({ employee, leave }) => {
  if (leave.status === "approved" && leave.leaveType !== "unpaid") {
    employee.leaveBalance[leave.leaveType] += leave.days;
    await employee.save();
  }
};

const deductApprovedLeave = async ({ employee, leaveType, days }) => {
  if (leaveType === "unpaid") return;

  if (employee.leaveBalance[leaveType] < days) {
    throw new ApiError(400, "Employee does not have enough leave balance");
  }
  employee.leaveBalance[leaveType] -= days;
  await employee.save();
};

/**
 * @desc Apply for leave
 * @route POST /api/leaves
 * @access Employee
 */
const applyLeave = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason, handoverNotes, contactDuringLeave } = req.body;
  if (!leaveType || !startDate || !endDate || !reason) {
    throw new ApiError(400, "leaveType, startDate, endDate and reason are required");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    throw new ApiError(400, "startDate must be before endDate");
  }

  const days = calculateLeaveDays(start, end);
  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) {
    throw new ApiError(404, "Employee profile not found");
  }

  if (leaveType !== "unpaid" && employee.leaveBalance[leaveType] < days) {
    throw new ApiError(400, "Insufficient leave balance");
  }

  const leave = await Leave.create({
    user: req.user._id,
    departmentSnapshot: employee.department,
    leaveType,
    startDate: startOfUtcDay(start),
    endDate: startOfUtcDay(end),
    days,
    reason,
    handoverNotes,
    contactDuringLeave
  });

  await notifyUsersByRole({
    role: "admin",
    type: "leave-request",
    title: "New leave request",
    message: `${employee.firstName} ${employee.lastName} requested ${days} day(s) of ${leaveType} leave.`,
    link: "/admin/leaves",
    metadata: {
      leaveId: leave._id,
      employeeId: req.user._id
    }
  });

  res.status(201).json({
    success: true,
    data: leave
  });
});

/**
 * @desc Get current employee leaves
 * @route GET /api/leaves/me
 * @access Employee
 */
const getMyLeaves = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);

  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Leave.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
    Leave.countDocuments(filter)
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

const buildAdminLeavePipeline = ({ status, department, dateFrom, dateTo }) => {
  const match = {};
  if (status) match.status = status;
  if (department) match.departmentSnapshot = department;
  if (dateFrom || dateTo) {
    match.startDate = {};
    if (dateFrom) match.startDate.$gte = new Date(dateFrom);
    if (dateTo) match.startDate.$lte = new Date(dateTo);
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
        leaveType: 1,
        startDate: 1,
        endDate: 1,
        days: 1,
        reason: 1,
        handoverNotes: 1,
        contactDuringLeave: 1,
        status: 1,
        departmentSnapshot: 1,
        createdAt: 1,
        reviewComment: 1,
        "user._id": 1,
        "user.email": 1,
        firstName: "$employee.firstName",
        lastName: "$employee.lastName"
      }
    }
  ];
};

/**
 * @desc Get all leaves for HR/admin
 * @route GET /api/leaves/admin
 * @access Admin
 */
const getAllLeaves = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);

  const pipeline = buildAdminLeavePipeline(req.query);
  const [items, countDoc] = await Promise.all([
    Leave.aggregate([...pipeline, { $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: parsedLimit }]),
    Leave.aggregate([...pipeline, { $count: "total" }])
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
 * @desc Edit leave request (employee can edit any own leave and resubmit)
 * @route PUT /api/leaves/:id
 * @access Private
 */
const updateLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) {
    throw new ApiError(404, "Leave request not found");
  }

  const isAdmin = req.user.role === "admin";
  const isOwner = leave.user.toString() === req.user._id.toString();
  if (!isAdmin && !isOwner) {
    throw new ApiError(403, "You can edit only your own leave requests");
  }

  const employee = await Employee.findOne({ user: leave.user });
  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  await refundApprovedLeave({ employee, leave });

  const nextLeaveType = req.body.leaveType || leave.leaveType;
  const nextStart = req.body.startDate ? new Date(req.body.startDate) : leave.startDate;
  const nextEnd = req.body.endDate ? new Date(req.body.endDate) : leave.endDate;
  const nextReason = typeof req.body.reason !== "undefined" ? req.body.reason : leave.reason;
  const nextHandoverNotes =
    typeof req.body.handoverNotes !== "undefined" ? req.body.handoverNotes : leave.handoverNotes;
  const nextContactDuringLeave =
    typeof req.body.contactDuringLeave !== "undefined"
      ? req.body.contactDuringLeave
      : leave.contactDuringLeave;

  if (nextStart > nextEnd) {
    throw new ApiError(400, "startDate must be before endDate");
  }

  const nextDays = calculateLeaveDays(nextStart, nextEnd);
  if (nextLeaveType !== "unpaid" && employee.leaveBalance[nextLeaveType] < nextDays) {
    throw new ApiError(400, "Insufficient leave balance");
  }

  leave.leaveType = nextLeaveType;
  leave.startDate = startOfUtcDay(nextStart);
  leave.endDate = startOfUtcDay(nextEnd);
  leave.days = nextDays;
  leave.reason = nextReason;
  leave.handoverNotes = nextHandoverNotes;
  leave.contactDuringLeave = nextContactDuringLeave;
  leave.departmentSnapshot = employee.department;

  if (isAdmin) {
    const nextStatus = ["pending", "approved", "rejected"].includes(req.body.status)
      ? req.body.status
      : leave.status;
    leave.status = nextStatus;

    if (nextStatus === "approved") {
      await deductApprovedLeave({ employee, leaveType: leave.leaveType, days: leave.days });
    }

    if (nextStatus === "pending") {
      leave.reviewComment = "";
      leave.reviewedBy = null;
      leave.reviewedAt = null;
    } else {
      leave.reviewComment = req.body.reviewComment ?? leave.reviewComment;
      leave.reviewedBy = req.user._id;
      leave.reviewedAt = new Date();
    }
  } else {
    leave.status = "pending";
    leave.reviewComment = "";
    leave.reviewedBy = null;
    leave.reviewedAt = null;

    await notifyUsersByRole({
      role: "admin",
      type: "leave-request",
      title: "Leave request updated",
      message: `${employee.firstName} ${employee.lastName} updated a leave request.`,
      link: "/admin/leaves",
      metadata: {
        leaveId: leave._id,
        employeeId: leave.user
      }
    });
  }

  await leave.save();

  if (isAdmin) {
    await createNotification({
      userId: leave.user,
      type: "leave-reviewed",
      title: "Leave request updated",
      message: `Your leave request is now marked as ${leave.status}.`,
      link: "/employee/leave",
      metadata: {
        leaveId: leave._id,
        status: leave.status
      }
    });
  }

  res.status(200).json({
    success: true,
    data: leave
  });
});

/**
 * @desc Approve/reject leave request
 * @route PATCH /api/leaves/:id/review
 * @access Admin
 */
const reviewLeave = asyncHandler(async (req, res) => {
  const { action, reviewComment } = req.body;
  if (!["approved", "rejected"].includes(action)) {
    throw new ApiError(400, "action must be approved or rejected");
  }

  const leave = await Leave.findById(req.params.id);
  if (!leave) {
    throw new ApiError(404, "Leave request not found");
  }

  const employee = await Employee.findOne({ user: leave.user });
  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  await refundApprovedLeave({ employee, leave });

  if (action === "approved") {
    await deductApprovedLeave({
      employee,
      leaveType: leave.leaveType,
      days: leave.days
    });
  }

  leave.status = action;
  leave.reviewComment = reviewComment;
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  await leave.save();

  await createNotification({
    userId: leave.user,
    type: "leave-reviewed",
    title: `Leave ${action}`,
    message: `Your ${leave.leaveType} leave request has been ${action}.`,
    link: "/employee/leave",
    metadata: {
      leaveId: leave._id,
      status: action
    }
  });

  res.status(200).json({
    success: true,
    data: leave
  });
});

/**
 * @desc Leave analytics for HR/admin dashboard
 * @route GET /api/leaves/analytics
 * @access Admin
 */
const getLeaveAnalytics = asyncHandler(async (_req, res) => {
  const [statusSummary, typeSummary, monthlyTrend] = await Promise.all([
    Leave.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Leave.aggregate([{ $group: { _id: "$leaveType", days: { $sum: "$days" }, requests: { $sum: 1 } } }]),
    Leave.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$startDate" },
            month: { $month: "$startDate" }
          },
          count: { $sum: 1 },
          totalDays: { $sum: "$days" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      statusSummary,
      typeSummary,
      monthlyTrend
    }
  });
});

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeave,
  reviewLeave,
  getLeaveAnalytics
};
