const Task = require("../models/Task");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination } = require("../utils/pagination");
const { createNotification } = require("../utils/notificationService");

/**
 * @desc Create task and assign to employee
 * @route POST /api/tasks
 * @access Admin
 */
const createTask = asyncHandler(async (req, res) => {
  const { title, assignedTo, description, dueDate, priority, project } = req.body;
  if (!title || !assignedTo) {
    throw new ApiError(400, "title and assignedTo are required");
  }

  const assignee = await User.findById(assignedTo);
  if (!assignee || !assignee.isActive) {
    throw new ApiError(404, "Assigned employee not found or inactive");
  }

  const task = await Task.create({
    title,
    assignedTo,
    description,
    dueDate,
    priority,
    project,
    assignedBy: req.user._id
  });

  await createNotification({
    userId: assignedTo,
    type: "task-assigned",
    title: "New task assigned",
    message: `${title} has been assigned to you.`,
    link: assignee.role === "admin" ? "/admin/projects" : "/employee/tasks",
    metadata: {
      taskId: task._id
    }
  });

  res.status(201).json({
    success: true,
    data: task
  });
});

/**
 * @desc Get tasks assigned to current employee
 * @route GET /api/tasks/me
 * @access Employee
 */
const getMyTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority } = req.query;
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);
  const filter = { assignedTo: req.user._id };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate("project", "name code status")
      .populate("assignedBy", "email")
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Task.countDocuments(filter)
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

/**
 * @desc Get all tasks for admin
 * @route GET /api/tasks/admin
 * @access Admin
 */
const getAdminTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, assignedTo, project } = req.query;
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (project) filter.project = project;

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate("project", "name code status")
      .populate("assignedBy", "email")
      .populate("assignedTo", "email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Task.countDocuments(filter)
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

/**
 * @desc Update task status (employee for own tasks, admin for any)
 * @route PATCH /api/tasks/:id/status
 * @access Private
 */
const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const isAdmin = req.user.role === "admin";
  const isAssignee = task.assignedTo.toString() === req.user._id.toString();
  if (!isAdmin && !isAssignee) {
    throw new ApiError(403, "You can update only your own tasks");
  }

  const { status, progress, checked, updateNote } = req.body;

  if (typeof checked !== "undefined") {
    task.employeeSubmission = task.employeeSubmission || {};
    task.employeeSubmission.isChecked = Boolean(checked);
    task.employeeSubmission.submittedAt = new Date();
  }

  if (typeof updateNote !== "undefined") {
    task.employeeSubmission = task.employeeSubmission || {};
    task.employeeSubmission.updateNote = updateNote;
    task.employeeSubmission.submittedAt = new Date();
  }

  if (status) task.status = status;
  if (typeof progress !== "undefined") task.progress = Number(progress);

  if (task.employeeSubmission?.isChecked) {
    task.status = "done";
    task.progress = 100;
  } else if (task.status === "done" && !status && typeof checked !== "undefined") {
    task.status = "in-progress";
    task.progress = Number(progress || 60);
  }

  if (task.status === "done") {
    task.progress = 100;
    task.employeeSubmission = task.employeeSubmission || {};
    task.employeeSubmission.isChecked = true;
    task.employeeSubmission.submittedAt = task.employeeSubmission.submittedAt || new Date();
  }

  await task.save();

  if (!isAdmin && isAssignee) {
    await createNotification({
      userId: task.assignedBy,
      type: "task-update",
      title: "Task progress updated",
      message: `${task.title} was updated by the assignee.`,
      link: "/admin/projects",
      metadata: {
        taskId: task._id,
        status: task.status,
        progress: task.progress
      }
    });
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

/**
 * @desc Upload task attachment
 * @route POST /api/tasks/:id/attachments
 * @access Private
 */
const uploadTaskAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Attachment file is required");
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const isAdmin = req.user.role === "admin";
  const isAssignee = task.assignedTo.toString() === req.user._id.toString();
  if (!isAdmin && !isAssignee) {
    throw new ApiError(403, "You can upload only to your own tasks");
  }

  task.attachments.push({
    name: req.file.originalname,
    fileUrl: `/uploads/${req.file.filename}`,
    mimeType: req.file.mimetype,
    size: req.file.size
  });
  await task.save();

  if (!isAdmin && isAssignee) {
    await createNotification({
      userId: task.assignedBy,
      type: "task-update",
      title: "Task attachment submitted",
      message: `${task.title} has a new attachment from the assignee.`,
      link: "/admin/projects",
      metadata: {
        taskId: task._id
      }
    });
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

module.exports = {
  createTask,
  getMyTasks,
  getAdminTasks,
  updateTaskStatus,
  uploadTaskAttachment
};
