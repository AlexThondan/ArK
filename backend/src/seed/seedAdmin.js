const connectDB = require("../config/db");
const { loadEnv } = require("../config/env");
const User = require("../models/User");
const Employee = require("../models/Employee");

const run = async () => {
  const env = loadEnv();
  await connectDB(env.MONGO_URI);

  const email = process.env.SEED_ADMIN_EMAIL || "admin@hrms.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      password,
      role: "admin"
    });
  }

  const profile = await Employee.findOne({ user: user._id });
  if (!profile) {
    await Employee.create({
      user: user._id,
      firstName: "System",
      lastName: "Admin",
      department: "Administration",
      designation: "HR Lead"
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Admin ready: ${email}`);
  process.exit(0);
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
