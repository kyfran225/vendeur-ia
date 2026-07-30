import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Database connected successfully.");
  } catch (error) {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  }
}
