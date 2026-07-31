import { createClient } from "redis";
import { env } from "./env.js";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function connectRedis() {
  if (!env.REDIS_URL) {
    console.log("Redis not configured, skipping.");
    return null;
  }

  redisClient = createClient({ url: env.REDIS_URL });
  redisClient.on("error", (err) => console.error("Redis Error:", err));

  try {
    await redisClient.connect();
    console.log("Redis connected.");
    return redisClient;
  } catch (err) {
    console.error("Redis connection failed:", err);
    return null;
  }
}

export function getRedisClient() {
  return redisClient;
}
