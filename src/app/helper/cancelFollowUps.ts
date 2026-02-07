import { mailQueue } from "../bullMQ/queues/mailQueues";


export const cancelFollowUps = async (userId: string) => {
  await Promise.all([
    mailQueue.remove(`followup1:${userId}`),
    mailQueue.remove(`followup2:${userId}`),
    mailQueue.remove(`followup3:${userId}`),
  ]);
};
