import mongoose from "mongoose";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../services/logger.service.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "../../");

async function clearDirectory(dirPath: string) {
  try {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      if (file === ".gitkeep") continue;
      const fullPath = path.join(dirPath, file);
      await fs.rm(fullPath, { recursive: true, force: true });
    }
    logger.info(`Cleared directory: ${dirPath}`);
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
        logger.info(`Directory ${dirPath} does not exist, skipping.`);
    } else {
        logger.warn(`Could not clear directory ${dirPath}:`, error);
    }
  }
}

async function reset() {
  if (env.NODE_ENV === "production") {
    console.error("❌ CRITICAL: Cannot reset database in production!");
    process.exit(1);
  }

  console.log("⚠️  RESETTING DEVELOPMENT DATABASE...");

  // 1. MongoDB
  try {
    await mongoose.connect(env.MONGODB_URI);
    await mongoose.connection.db?.dropDatabase();
    logger.info("✅ MongoDB database dropped.");
    await mongoose.disconnect();
  } catch (error) {
    logger.error("❌ MongoDB reset failed:", error);
  }

  // 2. Redis
  if (env.REDIS_URL) {
    try {
      const redis = new Redis(env.REDIS_URL);
      await redis.flushall();
      logger.info("✅ Redis flushed.");
      await redis.quit();
    } catch (error) {
      logger.error("❌ Redis reset failed:", error);
    }
  }

  // 3. Files
  const directoriesToClear = [
    path.join(ROOT_DIR, "uploads/audio"),
    path.join(ROOT_DIR, "uploads/media"),
    path.join(ROOT_DIR, "uploads/temp"),
    path.join(ROOT_DIR, "storage/whatsapp")
  ];

  for (const dir of directoriesToClear) {
    await clearDirectory(dir);
  }

  console.log("✨ Development environment is now clean!");
  process.exit(0);
}

reset();
