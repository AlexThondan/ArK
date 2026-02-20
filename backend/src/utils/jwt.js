const jwt = require("jsonwebtoken");
const { loadEnv } = require("../config/env");

const env = loadEnv();

const signToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });

const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);

module.exports = {
  signToken,
  verifyToken
};
