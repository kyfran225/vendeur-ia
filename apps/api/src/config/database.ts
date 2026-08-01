import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../services/logger.service.js";

export async function connectDatabase() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("✅ MongoDB connected successfully.");
  } catch (error) {
    logger.error("❌ Database connection error:", error);
    // We don't process.exit(1) anymore to allow Render to see the app starting
    // even if the first DB attempt fails (it will retry via mongoose internally)
  }
}
