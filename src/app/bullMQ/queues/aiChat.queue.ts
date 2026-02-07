
import { Queue } from "bullmq";
import { redisOptions } from "../../config/radis.config";




export const aiChatQueue = new Queue("ai-chat-queue", { connection: redisOptions });


