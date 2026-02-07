



import { createClient } from "redis";
import dbConfig from "./db.config";


export const redisClient = createClient({
  username: dbConfig.REDIS.REDIS_USERNAME,
  password: dbConfig.REDIS.REDIS_PASS,
  socket: {
    host: dbConfig.REDIS.REDIS_HOST,
    port: dbConfig.REDIS.REDIS_PORT,
  },
});

redisClient.on("error", (err: any) => console.log("Redis Client Error", err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("redisConnected");
  }
};









export const redisOptions = {
  host: dbConfig.REDIS.REDIS_HOST,
  port: dbConfig.REDIS.REDIS_PORT,
  username: dbConfig.REDIS.REDIS_USERNAME,
  password: dbConfig.REDIS.REDIS_PASS,
  maxRetriesPerRequest: null, 
  enableReadyCheck: false,
};

 