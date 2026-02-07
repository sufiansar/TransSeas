import { Queue } from "bullmq";
import { redisOptions } from "../../config/radis.config";


const persistenceQueue = new Queue("messagePersistenceQueue", {
    connection: redisOptions
});



export const messagePersistenceQueue = {
    queue: persistenceQueue
}