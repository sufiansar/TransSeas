import { Queue } from "bullmq";
import { redisOptions } from "../../config/radis.config";




export const conversationListQueue = new Queue("conversationList", {
    connection: redisOptions
});