const Client = require("../models/Client");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination } = require("../utils/pagination");

/**
 * @desc Create client
 * @route POST /api/clients
 * @access Admin
 */
const createClient = asyncHandler(async (req, res) => {
  const { name, company } = req.body;
  if (!name || !company) {
    throw new ApiError(400, "name and company are required");
  }

  const client = await Client.create({
    ...req.body,
    contractValue: Number(req.body.contractValue || 0)
  });
  res.status(201).json({
    success: true,
    data: client
  });
});

/**
 * @desc Get clients list
 * @route GET /api/clients
 * @access Private
 */
const getClients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { industry: { $regex: search, $options: "i" } }
    ];
  }

  const [items, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
    Client.countDocuments(filter)
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
 * @desc Get client details
 * @route GET /api/clients/:id
 * @access Private
 */
const getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) {
    throw new ApiError(404, "Client not found");
  }
  res.status(200).json({
    success: true,
    data: client
  });
});

/**
 * @desc Update client
 * @route PATCH /api/clients/:id
 * @access Admin
 */
const updateClient = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body
  };
  if (typeof req.body.contractValue !== "undefined") {
    payload.contractValue = Number(req.body.contractValue || 0);
  }

  const client = await Client.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });
  if (!client) {
    throw new ApiError(404, "Client not found");
  }
  res.status(200).json({
    success: true,
    data: client
  });
});

/**
 * @desc Upload client logo
 * @route PATCH /api/clients/:id/logo
 * @access Admin
 */
const uploadClientLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Logo file is required");
  }

  const client = await Client.findById(req.params.id);
  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  client.logoUrl = `/uploads/${req.file.filename}`;
  await client.save();

  res.status(200).json({
    success: true,
    data: client
  });
});

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  uploadClientLogo
};
