const Project = require("../models/Project");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination } = require("../utils/pagination");

/**
 * @desc Create project
 * @route POST /api/projects
 * @access Admin
 */
const createProject = asyncHandler(async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    throw new ApiError(400, "name and code are required");
  }

  const project = await Project.create(req.body);
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
    .populate("members", "email role");

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
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  res.status(200).json({
    success: true,
    data: project
  });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject
};
