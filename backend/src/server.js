import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";
import { validateEnvironment } from "./config/env.js";

const port = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    validateEnvironment();

    await connectDB();

    const server = app.listen(port, () => {
      console.log(
        `SkillCert AI backend running on port ${port}`
      );

      console.log(
        `Health API: http://localhost:${port}/api/health`
      );
    });

    process.on("unhandledRejection", (error) => {
      console.error(
        "Unhandled rejection:",
        error
      );

      server.close(() => {
        process.exit(1);
      });
    });

    process.on("SIGTERM", () => {
      console.log("SIGTERM received");

      server.close(() => {
        process.exit(0);
      });
    });
  } catch (error) {
    console.error(
      "Backend start nahi hua:",
      error.message
    );

    process.exit(1);
  }
}

startServer();