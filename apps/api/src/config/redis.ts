import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "../services/logger.service.js";

let redisClient: Redis | null = null;

export async function connectRedis() {
  if (!env.REDIS_URL) {
    logger.warn("Redis URL not configured, skipping connection.");
    return null;
  }

  try {
    // ioredis handles rediss:// and TLS automatically
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // Essential for Upstash TLS
      tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined
    });

    redisClient.on("error", (err) => {
      logger.error("[Redis Error]", { message: err.message });
    });

    redisClient.on("connect", () => {
      logger.info("✅ Redis Connected (ioredis)");
    });

    return redisClient;
  } catch (err: any) {
    logger.error("[Redis Critical] Initialization failed", { message: err.message });
    return null;
  }
}

export function getRedisClient() {
  return redisClient;
}
