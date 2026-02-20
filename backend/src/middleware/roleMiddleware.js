const ApiError = require("../utils/ApiError");

const allowRoles =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthenticated request");
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "Insufficient role permissions");
    }
    next();
  };

module.exports = { allowRoles };
