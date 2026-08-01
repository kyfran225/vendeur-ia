import { createClient } from "redis";
import { env } from "./env.js";
import { logger } from "../services/logger.service.js";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function connectRedis() {
  if (!env.REDIS_URL) {
    logger.warn("Redis URL not configured, skipping connection.");
    return null;
  }

  redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        const delay = Math.min(retries * 100, 3000);
        logger.warn(`[Redis] Reconnecting... (Attempt ${retries}, Delay ${delay}ms)`);
        return delay;
      }
    }
  });

  redisClient.on("error", (err) => logger.error("[Redis Error]", { message: err.message }));
  redisClient.on("connect", () => logger.info("✅ Redis Connected"));

  try {
    await redisClient.connect();
    return redisClient;
  } catch (err: any) {
    logger.error("[Redis Critical] Connection failed", { message: err.message });
    return null;
  }
}

export function getRedisClient() {
  return redisClient;
}
