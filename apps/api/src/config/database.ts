import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../services/logger.service.js";

export async function connectDatabase() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 45000,
    });
    logger.info(`✅ MongoDB connected successfully to ${env.MONGODB_URI.includes("mongodb+srv") ? "MongoDB Atlas Cloud" : "Local MongoDB"}.`);
  } catch (error) {
    if (env.PREVIEW_MONGODB_URI && env.MONGODB_URI.includes("localhost")) {
      logger.warn("⚠️ Local MongoDB offline, connecting to MongoDB Atlas Cloud (Preview)...");
      try {
        await mongoose.connect(env.PREVIEW_MONGODB_URI, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        logger.info("✅ MongoDB connected successfully to MongoDB Atlas Cloud (Preview).");
        return;
      } catch (atlasErr) {
        logger.error("❌ MongoDB Atlas connection error:", atlasErr);
      }
    } else {
      logger.error("❌ Database connection error:", error);
    }
  }
}
