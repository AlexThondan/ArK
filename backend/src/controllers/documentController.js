const Document = require("../models/Document");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination } = require("../utils/pagination");

/**
 * @desc Upload document (resume/certificate/task-doc)
 * @route POST /api/documents/upload
 * @access Private
 */
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Document file is required");
  }

  const {
    type = "other",
    visibility = "private",
    category = "",
    description = "",
    expiresOn,
    tags = "",
    userId
  } = req.body;
  const targetUserId = req.user.role === "admin" && userId ? userId : req.user._id;

  if (req.user.role !== "admin" && userId && userId !== req.user._id.toString()) {
    throw new ApiError(403, "Cannot upload document for another user");
  }

  const document = await Document.create({
    user: targetUserId,
    uploadedBy: req.user._id,
    type,
    category,
    description,
    tags: Array.isArray(tags)
      ? tags
      : tags
          .toString()
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    expiresOn: expiresOn ? new Date(expiresOn) : undefined,
    visibility,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    fileUrl: `/uploads/${req.file.filename}`
  });

  res.status(201).json({
    success: true,
    data: document
  });
});

/**
 * @desc List documents for current user (or any user for admin)
 * @route GET /api/documents/me
 * @access Private
 */
const getMyDocuments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, visibility, category, search, expiresBefore, userId } = req.query;
  const { skip, limit: parsedLimit, page: parsedPage } = buildPagination(page, limit);

  const filter = {
    user: req.user.role === "admin" && userId ? userId : req.user._id
  };
  if (type) filter.type = type;
  if (visibility) filter.visibility = visibility;
  if (category) filter.category = category;
  if (expiresBefore) filter.expiresOn = { $lte: new Date(expiresBefore) };
  if (search) {
    filter.$or = [
      { originalName: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $elemMatch: { $regex: search, $options: "i" } } }
    ];
  }

  const [items, total] = await Promise.all([
    Document.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
    Document.countDocuments(filter)
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
 * @desc Get one document metadata
 * @route GET /api/documents/:id
 * @access Private
 */
const getDocumentById = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  const isOwner = document.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "Access denied");
  }

  res.status(200).json({
    success: true,
    data: document
  });
});

module.exports = {
  uploadDocument,
  getMyDocuments,
  getDocumentById
};
