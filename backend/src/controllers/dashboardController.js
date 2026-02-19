const User = require("../models/User");
const Employee = require("../models/Employee");
const Task = require("../models/Task");
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const { startOfUtcDay } = require("../utils/date");
const { detectBurnoutRisk } = require("../utils/predictive");

const summarizeTaskStatus = (rows) => {
  const base = { todo: 0, "in-progress": 0, blocked: 0, done: 0 };
  rows.forEach((item) => {
    base[item._id] = item.count;
  });
  return base;
};

/**
 * @desc Employee dashboard overview
 * @route GET /api/dashboard/employee
 * @access Employee
 */
const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const dateBoundary = startOfUtcDay(sevenDaysAgo);

  const [taskSummaryRows, leaveSummaryRows, attendanceHistory, profile, recentTasks] = await Promise.all([
    Task.aggregate([
      { $match: { assignedTo: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Leave.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 }, days: { $sum: "$days" } } }
    ]),
    Attendance.find({ user: req.user._id, date: { $gte: dateBoundary } }).sort({ date: 1 }).lean(),
    Employee.findOne({ user: req.user._id }).lean(),
    Task.find({ assignedTo: req.user._id })
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(5)
      .select("title status priority dueDate progress")
      .lean()
  ]);

  const taskSummary = summarizeTaskStatus(taskSummaryRows);
  const leaveSummary = leaveSummaryRows.reduce((acc, curr) => {
    acc[curr._id] = { count: curr.count, days: curr.days };
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      welcome: profile ? `Welcome back, ${profile.firstName}` : "Welcome back",
      taskSummary: {
        pending: taskSummary.todo + taskSummary["in-progress"] + taskSummary.blocked,
        completed: taskSummary.done,
        breakdown: taskSummary
      },
      leaveBalance: profile?.leaveBalance || { annual: 0, sick: 0, casual: 0 },
      attendanceHistory,
      leaveSummary,
      recentTasks
    }
  });
});

/**
 * @desc Admin dashboard overview
 * @route GET /api/dashboard/admin
 * @access Admin
 */
const getAdminDashboard = asyncHandler(async (_req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
  const dateBoundary7 = startOfUtcDay(sevenDaysAgo);
  const dateBoundary30 = startOfUtcDay(thirtyDaysAgo);

  const [totalEmployees, activeProjects, pendingLeaves, attendanceRows, taskPerfRows, overtimeRows] =
    await Promise.all([
      User.countDocuments({ role: "employee", isActive: true }),
      Project.countDocuments({ status: { $in: ["planning", "active", "on-hold"] } }),
      Leave.countDocuments({ status: "pending" }),
      Attendance.aggregate([
        { $match: { date: { $gte: dateBoundary7 } } },
        {
          $group: {
            _id: {
              day: {
                $dateToString: { format: "%Y-%m-%d", date: "$date" }
              }
            },
            presentCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "present"] }, 1, 0]
              }
            }
          }
        },
        { $sort: { "_id.day": 1 } }
      ]),
      Task.aggregate([
        {
          $group: {
            _id: "$assignedTo",
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] }
            }
          }
        },
        { $sort: { completedTasks: -1, totalTasks: -1 } },
        { $limit: 8 }
      ]),
      Attendance.aggregate([
        { $match: { date: { $gte: dateBoundary30 } } },
        {
          $group: {
            _id: "$user",
            avgDuration: { $avg: "$workDurationMinutes" },
            latePresenceVariance: { $stdDevPop: "$workDurationMinutes" }
          }
        }
      ])
    ]);

  const performanceUsers = taskPerfRows.map((row) => row._id);
  const performanceProfiles = await Employee.find({ user: { $in: performanceUsers } })
    .select("firstName lastName user department")
    .lean();

  const profileMap = performanceProfiles.reduce((acc, profile) => {
    acc[profile.user.toString()] = profile;
    return acc;
  }, {});

  const performanceInsights = taskPerfRows.map((row) => {
    const profile = profileMap[row._id.toString()];
    const completionRate = row.totalTasks ? Math.round((row.completedTasks / row.totalTasks) * 100) : 0;
    return {
      userId: row._id,
      name: profile ? `${profile.firstName} ${profile.lastName}` : "Unknown",
      department: profile?.department || "Unknown",
      totalTasks: row.totalTasks,
      completedTasks: row.completedTasks,
      completionRate
    };
  });

  const overtimeSummary = overtimeRows.map((row) => ({
    userId: row._id,
    burnoutRisk: detectBurnoutRisk({
      overtimeHours: Math.max((row.avgDuration || 0) - 480, 0) / 60,
      attendanceVariance: Math.min((row.latePresenceVariance || 0) / 10, 100),
      leaveUtilizationRate: 45
    })
  }));

  const attendanceRateChart = attendanceRows.map((row) => ({
    date: row._id.day,
    rate: totalEmployees ? Math.round((row.presentCount / totalEmployees) * 100) : 0,
    presentCount: row.presentCount,
    totalEmployees
  }));

  res.status(200).json({
    success: true,
    data: {
      kpis: {
        totalEmployees,
        activeProjects,
        pendingLeaves
      },
      attendanceRateChart,
      performanceInsights,
      overtimeSummary
    }
  });
});

module.exports = {
  getEmployeeDashboard,
  getAdminDashboard
};
