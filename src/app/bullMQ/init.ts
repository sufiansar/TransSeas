
import { messagePersistenceWorker } from "./workers/messagePersistenceWorkers";
import { aiChatWorker } from "./workers/aiChat.worker";
import { mailWorker } from "./workers/mailWorkers";

// 🟢 Workers automatically start when imported

console.log("🚀 BullMQ workers running...");

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🚨 Gracefully shutting down workers...");

  await Promise.all([
    messagePersistenceWorker.close(),
    mailWorker.close(),
    aiChatWorker.close(),
  ]);

  console.log("✅ All BullMQ workers closed");
  process.exit(0);
});
