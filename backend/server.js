const { createServer } = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { loadEnv } = require("./src/config/env");

const env = loadEnv();
const PORT = env.PORT || 5000;

const bootstrap = async () => {
  await connectDB(env.MONGO_URI);

  const server = createServer(app);
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`HRMS API listening on port ${PORT}`);
  });

  process.on("unhandledRejection", (error) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled rejection:", error);
    server.close(() => process.exit(1));
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Startup failed:", error);
  process.exit(1);
});
