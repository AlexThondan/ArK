const requiredKeys = ["MONGO_URI", "JWT_SECRET"];

const loadEnv = () => {
  // eslint-disable-next-line global-require
  require("dotenv").config();

  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment keys: ${missing.join(", ")}`);
  }

  return {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
    ADMIN_BOOTSTRAP_KEY: process.env.ADMIN_BOOTSTRAP_KEY || ""
  };
};

module.exports = { loadEnv };
