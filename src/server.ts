import dotenv from "dotenv";

dotenv.config();

import http, { Server } from "http";
import app from "./app";
import { seedSuperAdmin } from "./app/utility/seedSuperAdmin";
import { connectRedis } from "./app/config/radis.config";
import { prisma } from "./app/config/prisma";
import { startGmailWatch } from "./app/lib/gmail.client";
// import ".src/app/bullMQ/workers/mailWorker";
// import "./app/bullMQ/init";

let server: Server | null = null;
async function connectDb() {
  try {
    await prisma.$connect();

    console.log("* Database connected successfully!!");
  } catch (error) {
    console.log("* Database connection failed!!");
    process.exit(1);
  }
}

async function startServer() {
  try {
    await connectDb();
    server = http.createServer(app);
    await startGmailWatch();
    server.listen(process.env.PORT, () => {
      console.log(
        `Database connected successfully.${process.env.DATABASE_URL}`,
      );
      console.log(`🚀 Server is running on port ${process.env.PORT}`);
    });

    handleProcessEvents();
  } catch (error) {
    console.error("❌ Error during server startup:", error);
    process.exit(1);
  }
}

/**
 * Gracefully shutdown the server and close database connections.
 * @param {string} signal - The termination signal received.
 */
async function gracefulShutdown(signal: string) {
  console.warn(`🔄 Received ${signal}, shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      console.log("✅ HTTP server closed.");

      try {
        console.log("Server shutdown complete.");
      } catch (error) {
        console.error("❌ Error during shutdown:", error);
      }

      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

/**
 * Handle system signals and unexpected errors.
 */
function handleProcessEvents() {
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  process.on("uncaughtException", (error) => {
    console.error("💥 Uncaught Exception:", error);
    gracefulShutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled Rejection:", reason);
    gracefulShutdown("unhandledRejection");
  });
}
async function bootstrap() {
  await connectRedis(); // ✅ first
  await seedSuperAdmin(); // optional

  await import("./app/bullMQ/init"); // ✅ AFTER Redis is ready
}

bootstrap();
// Start the application
startServer();
