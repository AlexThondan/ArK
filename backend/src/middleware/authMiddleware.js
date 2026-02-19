const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/jwt");

const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    throw new ApiError(401, "Authorization token missing");
  }

  const token = header.split(" ")[1];
  const decoded = verifyToken(token);
  const user = await User.findById(decoded.userId).select("-password");

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid token user");
  }

  req.user = user;
  next();
});

module.exports = { protect };
