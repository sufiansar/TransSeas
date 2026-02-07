import { Worker, Job } from "bullmq";
import { redisClient, redisOptions } from "../../config/radis.config";


interface PersistenceJob {
  conversationId: string;
}

interface RedisMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  read?: boolean;
  conversationId: string;
}

export const messagePersistenceWorker = new Worker(
  "messagePersistenceQueue",
  async (job: Job<PersistenceJob>) => {
    const { conversationId } = job.data;

    const redisKey = `chat:messages:${conversationId}`;
    const backupKey = `chat:messages:backup:${conversationId}`;

    let rawMessagesWithScores: (string | number)[] = [];

    // ✅ use node-redis client for data ops
    const backupExists = await redisClient.exists(backupKey);

    if (backupExists) {
      const results = await redisClient.zRangeWithScores(
        backupKey,
        0,
        -1,
        { REV: true }
      );
      rawMessagesWithScores = results.flatMap(item => [item.value, item.score]);
    } else {
      const results = await redisClient.zRangeWithScores(
        redisKey,
        0,
        -1,
        { REV: true }
      );
      rawMessagesWithScores = results.flatMap(item => [item.value, item.score]);

      if (rawMessagesWithScores.length) {
        const args: (string | number)[] = [];

        for (let i = 0; i < rawMessagesWithScores.length; i += 2) {
          const member = rawMessagesWithScores[i];
          const score = rawMessagesWithScores[i + 1];
          args.push(score, member);
        }

        await redisClient.zAdd(backupKey, args as any);
      }
    }

    if (!rawMessagesWithScores.length) {
      return `No messages to persist for ${conversationId}`;
    }

    const rawMessages: string[] = [];

    for (let i = 0; i < rawMessagesWithScores.length; i += 2) {
      rawMessages.push(rawMessagesWithScores[i] as string);
    }

    const parsed: RedisMessage[] = rawMessages.map(msg => JSON.parse(msg));

   

    /*
    try {
      await prisma.$transaction(
        parsed.map((m) =>
          prisma.privateMessage.upsert({
            where: { id: m.id },
            update: {},
            create: {
              id: m.id!,
              senderId: m.senderId,
              receiverId: m.receiverId,
              content: m.content,
              imageUrl: m.imageUrl || null,
              createdAt: new Date(m.createdAt),
              updatedAt: new Date(m.createdAt),
              read: m.read || false,
              conversationId: m.conversationId,
            },
          })
        )
      );

      await Promise.all([
        redisClient.del(redisKey),
        redisClient.del(backupKey),
      ]);

      return `✅ Persisted ${parsed.length} messages for ${conversationId}`;
    } catch (error: any) {
      throw new Error(error.message || error);
    }
    */
  },
  {
    connection: redisOptions, // ✅ BullMQ connection
    concurrency: 3,
  }
);


// Optional logging

messagePersistenceWorker.on("completed", job => {
  console.log(`✅ Persistence done for ${job.data.conversationId}`);
});

messagePersistenceWorker.on("failed", (job, err) => {
  console.error(`❌ Persistence failed`, err);
});
