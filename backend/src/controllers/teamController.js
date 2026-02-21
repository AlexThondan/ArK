const Team = require("../models/Team");
const User = require("../models/User");
const Employee = require("../models/Employee");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination } = require("../utils/pagination");

const normalizeMembers = (members = []) => {
  if (!Array.isArray(members)) return [];
  return members
    .filter((row) => row?.user && row?.teamRole)
    .map((row) => ({
      user: row.user,
      teamRole: row.teamRole.toString().trim()
    }));
};

/**
 * @desc Create team
 * @route POST /api/teams
 * @access Admin
 */
const createTeam = asyncHandler(async (req, res) => {
  const { name, code, department, description, lead } = req.body;
  if (!name || !code) {
    throw new ApiError(400, "name and code are required");
  }

  const members = normalizeMembers(req.body.members);

  if (lead) {
    const leadUser = await User.findById(lead).select("_id isActive").lean();
    if (!leadUser || !leadUser.isActive) {
      throw new ApiError(404, "Lead user not found or inactive");
    }
  }

  const team = await Team.create({
    name,
    code: code.toString().trim().toUpperCase(),
    department,
    description,
    lead: lead || undefined,
    members
  });

  res.status(201).json({
    success: true,
    data: team
  });
});

/**
 * @desc Get teams list
 * @route GET /api/teams
 * @access Private
 */
const getTeams = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, search, department, isActive } = req.query;
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }
  if (department) filter.department = department;
  if (typeof isActive !== "undefined") filter.isActive = isActive === "true";

  if (req.user.role !== "admin") {
    filter["members.user"] = req.user._id;
  }

  const [items, total] = await Promise.all([
    Team.find(filter)
      .populate("lead", "email role")
      .populate("members.user", "email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Team.countDocuments(filter)
  ]);

  const userIds = [
    ...new Set(
      items.flatMap((team) => [
        ...(team.lead ? [team.lead._id] : []),
        ...(team.members || []).map((member) => member.user?._id).filter(Boolean)
      ])
    )
  ];

  const employeeRows = await Employee.find({ user: { $in: userIds } })
    .select("user firstName lastName employeeId department designation avatarUrl")
    .lean();
  const employeeMap = employeeRows.reduce((acc, row) => {
    acc[row.user.toString()] = row;
    return acc;
  }, {});

  const data = items.map((team) => ({
    _id: team._id,
    name: team.name,
    code: team.code,
    department: team.department,
    description: team.description,
    isActive: team.isActive,
    lead: team.lead
      ? {
          _id: team.lead._id,
          email: team.lead.email,
          role: team.lead.role,
          firstName: employeeMap[team.lead._id.toString()]?.firstName,
          lastName: employeeMap[team.lead._id.toString()]?.lastName,
          employeeId: employeeMap[team.lead._id.toString()]?.employeeId,
          avatarUrl: employeeMap[team.lead._id.toString()]?.avatarUrl
        }
      : null,
    members: (team.members || []).map((member) => ({
      user: member.user?._id,
      email: member.user?.email,
      role: member.user?.role,
      teamRole: member.teamRole,
      firstName: member.user ? employeeMap[member.user._id.toString()]?.firstName : "",
      lastName: member.user ? employeeMap[member.user._id.toString()]?.lastName : "",
      employeeId: member.user ? employeeMap[member.user._id.toString()]?.employeeId : "",
      avatarUrl: member.user ? employeeMap[member.user._id.toString()]?.avatarUrl : ""
    })),
    createdAt: team.createdAt
  }));

  res.status(200).json({
    success: true,
    data,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  });
});

/**
 * @desc Update team
 * @route PATCH /api/teams/:id
 * @access Admin
 */
const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const updatableFields = ["name", "department", "description", "isActive"];
  updatableFields.forEach((field) => {
    if (typeof req.body[field] !== "undefined") {
      team[field] = req.body[field];
    }
  });

  if (typeof req.body.code !== "undefined") {
    team.code = req.body.code.toString().trim().toUpperCase();
  }
  if (typeof req.body.lead !== "undefined") {
    team.lead = req.body.lead || null;
  }
  if (typeof req.body.members !== "undefined") {
    team.members = normalizeMembers(req.body.members);
  }

  await team.save();

  res.status(200).json({
    success: true,
    data: team
  });
});

module.exports = {
  createTeam,
  getTeams,
  updateTeam
};
