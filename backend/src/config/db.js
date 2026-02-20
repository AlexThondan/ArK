const mongoose = require("mongoose");

const connectDB = async (mongoUri) => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, {
    autoIndex: true
  });
  // eslint-disable-next-line no-console
  console.log("MongoDB connected");
};

module.exports = connectDB;
