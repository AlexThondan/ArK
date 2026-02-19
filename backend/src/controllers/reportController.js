const Task = require("../models/Task");
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const asyncHandler = require("../utils/asyncHandler");
const { predictPerformanceScore, detectBurnoutRisk } = require("../utils/predictive");
const { startOfUtcDay } = require("../utils/date");

/**
 * @desc Department productivity report
 * @route GET /api/reports/department-productivity
 * @access Admin
 */
const getDepartmentProductivity = asyncHandler(async (_req, res) => {
  const rows = await Task.aggregate([
    {
      $lookup: {
        from: "employees",
        localField: "assignedTo",
        foreignField: "user",
        as: "employee"
      }
    },
    { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$employee.department",
        totalTasks: { $sum: 1 },
        completedTasks: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
        inProgressTasks: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } }
      }
    },
    {
      $project: {
        department: { $ifNull: ["$_id", "Unassigned"] },
        totalTasks: 1,
        completedTasks: 1,
        inProgressTasks: 1,
        completionRate: {
          $cond: [
            { $eq: ["$totalTasks", 0] },
            0,
            { $round: [{ $multiply: [{ $divide: ["$completedTasks", "$totalTasks"] }, 100] }, 0] }
          ]
        }
      }
    },
    { $sort: { completionRate: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: rows
  });
});

/**
 * @desc Leave trend report
 * @route GET /api/reports/leave-trends
 * @access Admin
 */
const getLeaveTrends = asyncHandler(async (_req, res) => {
  const rows = await Leave.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$startDate" },
          month: { $month: "$startDate" },
          status: "$status"
        },
        count: { $sum: 1 },
        days: { $sum: "$days" }
      }
    },
    {
      $project: {
        year: "$_id.year",
        month: "$_id.month",
        status: "$_id.status",
        count: 1,
        days: 1
      }
    },
    { $sort: { year: 1, month: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: rows
  });
});

/**
 * @desc Employee performance and predictive metrics
 * @route GET /api/reports/performance
 * @access Admin
 */
const getPerformanceMetrics = asyncHandler(async (_req, res) => {
  const last30Days = new Date();
  last30Days.setUTCDate(last30Days.getUTCDate() - 29);
  const fromDate = startOfUtcDay(last30Days);
  const currentYear = new Date().getUTCFullYear();

  const [employees, taskRows, attendanceRows, leaveRows] = await Promise.all([
    Employee.find({}).select("user firstName lastName department leaveBalance").lean(),
    Task.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } }
        }
      }
    ]),
    Attendance.aggregate([
      { $match: { date: { $gte: fromDate } } },
      {
        $group: {
          _id: "$user",
          daysPresent: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          avgWorkMinutes: { $avg: "$workDurationMinutes" },
          variance: { $stdDevPop: "$workDurationMinutes" }
        }
      }
    ]),
    Leave.aggregate([
      {
        $match: {
          status: "approved",
          startDate: {
            $gte: new Date(Date.UTC(currentYear, 0, 1)),
            $lte: new Date(Date.UTC(currentYear, 11, 31))
          }
        }
      },
      {
        $group: {
          _id: "$user",
          usedLeaveDays: { $sum: "$days" }
        }
      }
    ])
  ]);

  const taskMap = taskRows.reduce((acc, row) => {
    acc[row._id.toString()] = row;
    return acc;
  }, {});
  const attendanceMap = attendanceRows.reduce((acc, row) => {
    acc[row._id.toString()] = row;
    return acc;
  }, {});
  const leaveMap = leaveRows.reduce((acc, row) => {
    acc[row._id.toString()] = row;
    return acc;
  }, {});

  const data = employees.map((emp) => {
    const id = emp.user.toString();
    const taskRow = taskMap[id] || { totalTasks: 0, completedTasks: 0 };
    const attendanceRow = attendanceMap[id] || { daysPresent: 0, avgWorkMinutes: 0, variance: 0 };
    const leaveRow = leaveMap[id] || { usedLeaveDays: 0 };

    const taskCompletionRate = taskRow.totalTasks
      ? Math.round((taskRow.completedTasks / taskRow.totalTasks) * 100)
      : 0;
    const attendanceRate = Math.round((attendanceRow.daysPresent / 30) * 100);
    const yearlyLeaveAllowance = (emp.leaveBalance?.annual || 0) + leaveRow.usedLeaveDays;
    const leaveUtilizationRate = yearlyLeaveAllowance
      ? Math.round((leaveRow.usedLeaveDays / yearlyLeaveAllowance) * 100)
      : 0;

    const performanceScore = predictPerformanceScore({
      taskCompletionRate,
      attendanceRate,
      leaveUtilizationRate
    });

    const burnoutRisk = detectBurnoutRisk({
      overtimeHours: Math.max((attendanceRow.avgWorkMinutes || 0) - 480, 0) / 60,
      attendanceVariance: Math.min((attendanceRow.variance || 0) / 10, 100),
      leaveUtilizationRate
    });

    return {
      userId: emp.user,
      name: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      taskCompletionRate,
      attendanceRate,
      leaveUtilizationRate,
      performanceScore,
      burnoutRisk
    };
  });

  res.status(200).json({
    success: true,
    data
  });
});

module.exports = {
  getDepartmentProductivity,
  getLeaveTrends,
  getPerformanceMetrics
};
