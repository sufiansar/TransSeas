import { prisma } from "../../config/prisma";

import { Worker } from "bullmq";
import { redisOptions } from "../../config/radis.config";


export const aiChatWorker = new Worker(
    "ai-chat-queue",
    async (job) => {
        const { userId, type, user_query, ai_answer, sessionId } = job.data;

        // await prisma.chattingWithAI.create({
        //     data: {
        //         userId,
        //         sessionId,
        //         query_type: type,
        //         user_query,
        //         ai_answer,
        //     },
        // });

        console.log("✅ Chat saved in DB");
    },
    { connection: redisOptions }
);


aiChatWorker.on("failed", (job, err) => {
    console.log(`❌ AI Chat job failed: ${job?.id}`, err);
});

aiChatWorker.on("completed", (job) => {
    console.log(`✅ AI Chat job completed: ${job.id}`);
});


