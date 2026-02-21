const Task = require("../models/Task");
const Team = require("../models/Team");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination } = require("../utils/pagination");
const { createNotification } = require("../utils/notificationService");

const normalizeChecklists = (checklists = []) => {
  if (!Array.isArray(checklists)) return [];
  return checklists
    .filter((row) => row?.title)
    .map((row) => ({
      title: row.title.toString().trim(),
      description: row.description?.toString().trim() || "",
      assignee: row.assignee || undefined
    }));
};

/**
 * @desc Create task and assign to employee
 * @route POST /api/tasks
 * @access Admin
 */
const createTask = asyncHandler(async (req, res) => {
  const { title, assignedTo, assignedTeam, description, dueDate, priority, project } = req.body;
  if (!title || (!assignedTo && !assignedTeam)) {
    throw new ApiError(400, "title and either assignedTo or assignedTeam are required");
  }

  const checklists = normalizeChecklists(req.body.checklists);

  if (assignedTeam) {
    const team = await Team.findById(assignedTeam).lean();
    if (!team || !team.isActive) {
      throw new ApiError(404, "Assigned team not found or inactive");
    }

    const memberIds = [
      ...new Set(
        (team.members || [])
          .map((member) => member?.user?._id || member?.user)
          .map((value) => (value ? value.toString() : ""))
          .filter(Boolean)
      )
    ];
    if (!memberIds.length) {
      throw new ApiError(400, "Assigned team has no members");
    }

    const users = await User.find({ _id: { $in: memberIds }, isActive: true }).select("_id role").lean();
    if (!users.length) {
      throw new ApiError(400, "Assigned team has no active members");
    }

    const taskPayloads = users.map((user) => ({
      title,
      assignedTo: user._id,
      assignedTeam: team._id,
      description,
      dueDate,
      priority,
      project,
      checklists: checklists.map((item) => ({ ...item })),
      assignedBy: req.user._id
    }));

    const tasks = await Task.insertMany(taskPayloads);

    await Promise.all(
      users.map((user, index) =>
        createNotification({
          userId: user._id,
          type: "task-assigned",
          title: "New team task assigned",
          message: `${title} has been assigned to your team (${team.name}).`,
          link: user.role === "admin" ? "/admin/projects" : "/employee/tasks",
          metadata: {
            taskId: tasks[index]._id,
            teamId: team._id
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      data: tasks,
      createdCount: tasks.length
    });
    return;
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
    checklists,
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
      .populate("assignedTeam", "name code")
      .populate("checklists.assignee", "email")
      .populate("checklists.checkedBy", "email")
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
      .populate("assignedTeam", "name code")
      .populate("checklists.assignee", "email")
      .populate("checklists.checkedBy", "email")
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
    if (task.checklists?.length) {
      task.checklists.forEach((item) => {
        item.isChecked = true;
        item.checkedBy = req.user._id;
        item.checkedAt = item.checkedAt || new Date();
      });
    }
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
 * @desc Update one checklist item for a task
 * @route PATCH /api/tasks/:id/checklists
 * @access Private
 */
const updateTaskChecklist = asyncHandler(async (req, res) => {
  const { checklistId, isChecked } = req.body;
  if (!checklistId) {
    throw new ApiError(400, "checklistId is required");
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const isAdmin = req.user.role === "admin";
  const isAssignee = task.assignedTo.toString() === req.user._id.toString();
  if (!isAdmin && !isAssignee) {
    throw new ApiError(403, "You can update only your own task checklist");
  }

  const checklistItem = task.checklists.id(checklistId);
  if (!checklistItem) {
    throw new ApiError(404, "Checklist item not found");
  }

  if (
    !isAdmin &&
    checklistItem.assignee &&
    checklistItem.assignee.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Checklist item is assigned to another member");
  }

  checklistItem.isChecked = Boolean(isChecked);
  checklistItem.checkedBy = Boolean(isChecked) ? req.user._id : null;
  checklistItem.checkedAt = Boolean(isChecked) ? new Date() : null;

  const totalItems = task.checklists.length;
  const completedItems = task.checklists.filter((item) => item.isChecked).length;
  const progress = totalItems ? Math.round((completedItems / totalItems) * 100) : task.progress;

  task.progress = progress;
  if (progress >= 100) {
    task.status = "done";
    task.employeeSubmission = task.employeeSubmission || {};
    task.employeeSubmission.isChecked = true;
    task.employeeSubmission.submittedAt = new Date();
  } else if (progress > 0) {
    task.status = "in-progress";
  } else {
    task.status = "todo";
    task.employeeSubmission = task.employeeSubmission || {};
    task.employeeSubmission.isChecked = false;
  }

  await task.save();

  if (!isAdmin && isAssignee) {
    await createNotification({
      userId: task.assignedBy,
      type: "task-update",
      title: "Checklist updated",
      message: `${task.title} checklist was updated.`,
      link: "/admin/projects",
      metadata: {
        taskId: task._id,
        checklistId
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
  updateTaskChecklist,
  uploadTaskAttachment
};
