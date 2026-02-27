const User = require("../models/User");
const Employee = require("../models/Employee");
const Team = require("../models/Team");
const Project = require("../models/Project");
const Task = require("../models/Task");
const ChatMessage = require("../models/ChatMessage");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination } = require("../utils/pagination");

const mapPeople = async (userIds = []) => {
  const ids = [...new Set(userIds.map((id) => String(id || "")).filter(Boolean))];
  if (!ids.length) return {};

  const [users, employees] = await Promise.all([
    User.find({ _id: { $in: ids }, isActive: true }).select("_id email role").lean(),
    Employee.find({ user: { $in: ids } }).select("user firstName lastName employeeId avatarUrl").lean()
  ]);

  const employeeMap = employees.reduce((acc, row) => {
    acc[row.user.toString()] = row;
    return acc;
  }, {});

  return users.reduce((acc, user) => {
    const profile = employeeMap[user._id.toString()];
    acc[user._id.toString()] = {
      _id: user._id,
      email: user.email,
      role: user.role,
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      employeeId: profile?.employeeId || "",
      avatarUrl: profile?.avatarUrl || ""
    };
    return acc;
  }, {});
};

const addToSetMap = (map, key, value) => {
  if (!key || !value) return;
  if (!map[key]) map[key] = new Set();
  map[key].add(value);
};

/**
 * @desc Get chat contacts (active users except self)
 * @route GET /api/chat/contacts
 * @access Private
 */
const getContacts = asyncHandler(async (req, res) => {
  const { search = "", limit = 300 } = req.query;
  const parsedLimit = Math.max(1, Math.min(Number(limit) || 300, 500));

  const myUserId = req.user._id.toString();
  const [myTeams, directTaskLinks, adminUsers, inboxFrom, inboxTo] = await Promise.all([
    Team.find({ isActive: true, "members.user": req.user._id }).select("_id name members.user lead").lean(),
    Task.find({ $or: [{ assignedTo: req.user._id }, { assignedBy: req.user._id }] })
      .select("assignedTo assignedBy project assignedTeam")
      .lean(),
    User.find({ role: "admin", isActive: true }).select("_id").lean(),
    ChatMessage.distinct("from", { to: req.user._id }),
    ChatMessage.distinct("to", { from: req.user._id })
  ]);

  const myTeamIds = myTeams.map((team) => team._id);
  const taskProjectIds = [
    ...new Set(
      directTaskLinks
        .map((row) => row.project)
        .filter(Boolean)
        .map((value) => value.toString())
    )
  ];

  const taskTeamIds = [
    ...new Set(
      directTaskLinks
        .map((row) => row.assignedTeam)
        .filter(Boolean)
        .map((value) => value.toString())
    )
  ];

  const projectScopeOr = [{ members: req.user._id }];
  if (myTeamIds.length) {
    projectScopeOr.push({ assignedTeam: { $in: myTeamIds } });
  }
  if (taskProjectIds.length) {
    projectScopeOr.push({ _id: { $in: taskProjectIds } });
  }

  const scopedProjects = await Project.find({ $or: projectScopeOr })
    .select("_id name code members assignedTeam")
    .lean();

  const projectTeamIds = [
    ...new Set(
      scopedProjects
        .map((project) => project.assignedTeam)
        .filter(Boolean)
        .map((value) => value.toString())
    )
  ];

  const relatedTeamIds = [...new Set([...myTeamIds.map(String), ...projectTeamIds, ...taskTeamIds])];
  const relatedTeams = relatedTeamIds.length
    ? await Team.find({ _id: { $in: relatedTeamIds }, isActive: true }).select("_id name members.user lead").lean()
    : [];

  const projectByUser = {};
  const teamByUser = {};
  const relatedUserIds = new Set();

  myTeams.forEach((team) => {
    const leadId = team.lead?.toString();
    if (leadId) {
      relatedUserIds.add(leadId);
      addToSetMap(teamByUser, leadId, `${team.name} (Lead)`);
    }

    (team.members || []).forEach((member) => {
      const memberId = member?.user?.toString();
      if (!memberId) return;
      relatedUserIds.add(memberId);
      addToSetMap(teamByUser, memberId, team.name);
    });
  });

  relatedTeams.forEach((team) => {
    const leadId = team.lead?.toString();
    if (leadId) {
      relatedUserIds.add(leadId);
      addToSetMap(teamByUser, leadId, `${team.name} (Lead)`);
    }
    (team.members || []).forEach((member) => {
      const memberId = member?.user?.toString();
      if (!memberId) return;
      relatedUserIds.add(memberId);
      addToSetMap(teamByUser, memberId, team.name);
    });
  });

  scopedProjects.forEach((project) => {
    const projectLabel = project.code ? `${project.code} - ${project.name}` : project.name;
    (project.members || []).forEach((memberIdValue) => {
      const memberId = memberIdValue?.toString();
      if (!memberId) return;
      relatedUserIds.add(memberId);
      addToSetMap(projectByUser, memberId, projectLabel);
    });

    const assignedTeamId = project.assignedTeam?.toString();
    if (!assignedTeamId) return;

    const assignedTeam = relatedTeams.find((team) => team._id.toString() === assignedTeamId);
    if (!assignedTeam) return;

    (assignedTeam.members || []).forEach((member) => {
      const memberId = member?.user?.toString();
      if (!memberId) return;
      relatedUserIds.add(memberId);
      addToSetMap(projectByUser, memberId, projectLabel);
    });
  });

  directTaskLinks.forEach((task) => {
    const to = task.assignedTo?.toString();
    const by = task.assignedBy?.toString();
    if (to) relatedUserIds.add(to);
    if (by) relatedUserIds.add(by);
  });

  inboxFrom.map((id) => String(id)).forEach((id) => relatedUserIds.add(id));
  inboxTo.map((id) => String(id)).forEach((id) => relatedUserIds.add(id));
  adminUsers.forEach((admin) => relatedUserIds.add(admin._id.toString()));

  relatedUserIds.delete(myUserId);

  const users = await User.find({
    _id: { $in: [...relatedUserIds] },
    isActive: true
  })
    .select("_id email role")
    .lean();

  const peopleMap = await mapPeople(users.map((row) => row._id));
  let contacts = users
    .map((user) => {
      const person = peopleMap[user._id.toString()];
      if (!person) return null;

      return {
        ...person,
        projects: [...(projectByUser[user._id.toString()] || new Set())].slice(0, 4),
        teams: [...(teamByUser[user._id.toString()] || new Set())].slice(0, 4)
      };
    })
    .filter(Boolean)
    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

  if (search) {
    const query = search.toString().trim().toLowerCase();
    contacts = contacts.filter((person) => {
      const name = `${person.firstName || ""} ${person.lastName || ""}`.trim().toLowerCase();
      const projects = (person.projects || []).join(" ").toLowerCase();
      const teams = (person.teams || []).join(" ").toLowerCase();
      return (
        name.includes(query) ||
        String(person.email || "").toLowerCase().includes(query) ||
        String(person.employeeId || "").toLowerCase().includes(query) ||
        projects.includes(query) ||
        teams.includes(query)
      );
    });
  }

  res.status(200).json({
    success: true,
    data: contacts.slice(0, parsedLimit)
  });
});

/**
 * @desc Get conversation messages with one user
 * @route GET /api/chat/messages
 * @access Private
 */
const getMessages = asyncHandler(async (req, res) => {
  const { with: withUserId, page = 1, limit = 80 } = req.query;
  if (!withUserId) {
    throw new ApiError(400, "with query parameter is required");
  }

  const target = await User.findOne({ _id: withUserId, isActive: true }).select("_id").lean();
  if (!target) {
    throw new ApiError(404, "Chat user not found");
  }

  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);
  const filter = {
    $or: [
      { from: req.user._id, to: withUserId },
      { from: withUserId, to: req.user._id }
    ]
  };

  const [items, total] = await Promise.all([
    ChatMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit).lean(),
    ChatMessage.countDocuments(filter)
  ]);

  const ordered = items.reverse();

  res.status(200).json({
    success: true,
    data: ordered,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  });
});

/**
 * @desc Get inbox conversation summaries
 * @route GET /api/chat/inbox
 * @access Private
 */
const getInbox = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const parsedLimit = Math.max(1, Math.min(Number(limit) || 20, 100));

  const rows = await ChatMessage.aggregate([
    {
      $match: {
        $or: [{ from: req.user._id }, { to: req.user._id }]
      }
    },
    {
      $addFields: {
        counterpart: {
          $cond: [{ $eq: ["$from", req.user._id] }, "$to", "$from"]
        }
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$counterpart",
        lastMessage: { $first: "$text" },
        lastMessageAt: { $first: "$createdAt" },
        lastSender: { $first: "$from" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [{ $eq: ["$to", req.user._id] }, { $eq: ["$isRead", false] }]
              },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { lastMessageAt: -1 } },
    { $limit: parsedLimit }
  ]);

  const peopleMap = await mapPeople(rows.map((row) => row._id));
  const data = rows
    .map((row) => ({
      user: peopleMap[String(row._id)],
      lastMessage: row.lastMessage,
      lastMessageAt: row.lastMessageAt,
      lastSender: row.lastSender,
      unreadCount: Number(row.unreadCount || 0)
    }))
    .filter((row) => row.user);

  const totalUnread = data.reduce((sum, row) => sum + Number(row.unreadCount || 0), 0);

  res.status(200).json({
    success: true,
    data,
    unreadCount: totalUnread
  });
});

/**
 * @desc Send chat message
 * @route POST /api/chat/messages
 * @access Private
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { to, text } = req.body;
  if (!to || !String(text || "").trim()) {
    throw new ApiError(400, "to and text are required");
  }
  if (String(to) === req.user._id.toString()) {
    throw new ApiError(400, "Cannot send message to yourself");
  }

  const recipient = await User.findOne({ _id: to, isActive: true }).select("_id").lean();
  if (!recipient) {
    throw new ApiError(404, "Recipient not found");
  }

  const message = await ChatMessage.create({
    from: req.user._id,
    to,
    text: String(text).trim()
  });

  res.status(201).json({
    success: true,
    data: message
  });
});

/**
 * @desc Mark conversation messages as read
 * @route PATCH /api/chat/read
 * @access Private
 */
const markConversationRead = asyncHandler(async (req, res) => {
  const { with: withUserId } = req.body;
  if (!withUserId) {
    throw new ApiError(400, "with is required");
  }

  await ChatMessage.updateMany(
    { from: withUserId, to: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json({
    success: true,
    message: "Conversation marked as read"
  });
});

module.exports = {
  getContacts,
  getMessages,
  getInbox,
  sendMessage,
  markConversationRead
};
