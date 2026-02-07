import { Queue } from "bullmq";
import { redisOptions } from "../../config/radis.config";




export const assignJobQueue = new Queue("assign-job-queue", { connection: redisOptions });
