const Project = require("../models/Project");
const Sequence = require("../models/Sequence");
const Team = require("../models/Team");
const Task = require("../models/Task");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination } = require("../utils/pagination");

const PROJECT_CODE_SEQUENCE_KEY = "project-code";

const normalizeChecklists = (checklists = []) => {
  if (!Array.isArray(checklists)) return [];
  return checklists
    .map((item) => ({
      title: String(item?.title || "").trim(),
      description: String(item?.description || "").trim()
    }))
    .filter((item) => item.title)
    .map((item) => ({ ...item, isChecked: false }));
};

const normalizeMemberIds = (members = []) => {
  if (!Array.isArray(members)) return [];
  return [...new Set(members.map((member) => String(member || "").trim()).filter(Boolean))];
};

const formatProjectCode = (value) => `ARK-${String(value).padStart(3, "0")}`;

const parseNumericProjectCode = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  if (!normalized) return 0;
  if (/^ARK-\d+$/.test(normalized)) {
    return Number(normalized.split("-")[1] || 0);
  }
  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }
  return 0;
};

const getMaxNumericProjectCode = async () => {
  const rows = await Project.find({ code: { $exists: true, $ne: null } }).select("code").lean();
  return rows.reduce((maxValue, row) => Math.max(maxValue, parseNumericProjectCode(row.code)), 0);
};

const getNextProjectCode = async () => {
  const counter = await Sequence.findOneAndUpdate(
    { key: PROJECT_CODE_SEQUENCE_KEY },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  let currentValue = Number(counter?.value || 1);

  // Align sequence with existing numeric project codes if counter was newly created/reset.
  if (currentValue === 1) {
    const maxExistingCode = await getMaxNumericProjectCode();
    if (maxExistingCode >= currentValue) {
      const aligned = await Sequence.findOneAndUpdate(
        { key: PROJECT_CODE_SEQUENCE_KEY },
        { $set: { value: maxExistingCode + 1 } },
        { new: true }
      );
      currentValue = Number(aligned?.value || maxExistingCode + 1);
    }
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = formatProjectCode(currentValue + attempt);
    // eslint-disable-next-line no-await-in-loop
    const exists = await Project.exists({ code: candidate });
    if (!exists) {
      if (attempt > 0) {
        await Sequence.findOneAndUpdate(
          { key: PROJECT_CODE_SEQUENCE_KEY },
          { $set: { value: currentValue + attempt } },
          { new: true }
        );
      }
      return candidate;
    }
  }

  throw new ApiError(500, "Unable to generate next project code");
};

const resolveProjectAssignment = async ({ assignmentType, members, assignedTeam }) => {
  const mode = assignmentType === "team" ? "team" : "individual";

  if (mode === "team") {
    if (!assignedTeam) {
      throw new ApiError(400, "assignedTeam is required when assignmentType is team");
    }

    const team = await Team.findById(assignedTeam).select("name members isActive").lean();
    if (!team || !team.isActive) {
      throw new ApiError(404, "Assigned team not found or inactive");
    }

    const teamMemberIds = normalizeMemberIds((team.members || []).map((row) => row.user));
    if (!teamMemberIds.length) {
      throw new ApiError(400, "Assigned team has no members");
    }

    return {
      assignmentType: "team",
      assignedTeam: team._id,
      members: teamMemberIds
    };
  }

  const memberIds = normalizeMemberIds(members);
  if (!memberIds.length) {
    throw new ApiError(400, "Select at least one member when assignmentType is individual");
  }

  const activeUsers = await User.countDocuments({
    _id: { $in: memberIds },
    isActive: true
  });
  if (activeUsers !== memberIds.length) {
    throw new ApiError(400, "One or more selected members are invalid or inactive");
  }

  return {
    assignmentType: "individual",
    assignedTeam: null,
    members: memberIds
  };
};

const pickProjectPayload = (body = {}) => {
  const payload = {};
  [
    "name",
    "description",
    "client",
    "startDate",
    "endDate",
    "budget",
    "status",
    "progress"
  ].forEach((key) => {
    if (typeof body[key] !== "undefined") {
      payload[key] = body[key];
    }
  });

  if (typeof body.checklists !== "undefined") {
    payload.checklists = normalizeChecklists(body.checklists);
  }

  return payload;
};

/**
 * @desc Create project
 * @route POST /api/projects
 * @access Admin
 */
const createProject = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    throw new ApiError(400, "name is required");
  }

  const payload = pickProjectPayload(req.body);
  payload.code = await getNextProjectCode();

  const assignment = await resolveProjectAssignment({
    assignmentType: req.body.assignmentType,
    members: req.body.members,
    assignedTeam: req.body.assignedTeam
  });

  Object.assign(payload, assignment);

  const project = await Project.create(payload);
  res.status(201).json({
    success: true,
    data: project
  });
});

/**
 * @desc List projects
 * @route GET /api/projects
 * @access Private
 */
const getProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, client } = req.query;
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);
  const filter = {};
  if (status) filter.status = status;
  if (client) filter.client = client;

  const [items, total] = await Promise.all([
    Project.find(filter)
      .populate("client", "name company")
      .populate("members", "email role")
      .populate("assignedTeam", "name code department")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Project.countDocuments(filter)
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
 * @desc Get single project
 * @route GET /api/projects/:id
 * @access Private
 */
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("client", "name company email phone")
    .populate("members", "email role")
    .populate("assignedTeam", "name code department");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  res.status(200).json({
    success: true,
    data: project
  });
});

/**
 * @desc Update project
 * @route PATCH /api/projects/:id
 * @access Admin
 */
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const payload = pickProjectPayload(req.body);

  const shouldResolveAssignment = ["assignmentType", "members", "assignedTeam"].some(
    (field) => typeof req.body[field] !== "undefined"
  );

  if (shouldResolveAssignment) {
    const assignment = await resolveProjectAssignment({
      assignmentType: req.body.assignmentType || project.assignmentType,
      members: typeof req.body.members !== "undefined" ? req.body.members : project.members,
      assignedTeam: typeof req.body.assignedTeam !== "undefined" ? req.body.assignedTeam : project.assignedTeam
    });
    Object.assign(payload, assignment);
  }

  Object.assign(project, payload);
  await project.save();

  const populated = await Project.findById(project._id)
    .populate("client", "name company")
    .populate("members", "email role")
    .populate("assignedTeam", "name code department");

  res.status(200).json({
    success: true,
    data: populated
  });
});

/**
 * @desc Delete project and linked tasks
 * @route DELETE /api/projects/:id
 * @access Admin
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const { deletedCount } = await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  res.status(200).json({
    success: true,
    message: "Project deleted successfully",
    deletedTasks: deletedCount || 0
  });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
};
