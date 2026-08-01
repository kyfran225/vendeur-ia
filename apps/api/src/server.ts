import express from "express";
import cors from "cors";
import helmet from "helmet";
import sanitize from "mongo-sanitize";
import { createServer } from "http";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import { initSocketServer } from "./realtime/socketServer.js";
import authRoutes from "./modules/auth/auth.routes.js";
import commerceRoutes from "./modules/commerce/commerce.routes.js";
import adminRoutes from "./modules/commerce/admin.routes.js";
import marketingRoutes from "./modules/commerce/marketing.routes.js";
import whatsappRoutes from "./modules/whatsapp/whatsapp.routes.js";
import instagramRoutes from "./modules/instagram/instagram.routes.js";
import tiktokRoutes from "./modules/tiktok/tiktok.routes.js";
import mediaRoutes from "./modules/media/media.routes.js";
import "./services/ai-queue.service.js"; // Import workers and queue

import { globalLimiter } from "./middleware/rate-limiter.js";
import { logger } from "./services/logger.service.js";

const app = express();
const httpServer = createServer(app);

// Initialize Sockets
initSocketServer(httpServer);

app.use(helmet()); // Secure HTTP headers
app.use(cors());
app.use(express.json());

// NoSQL Injection Protection
app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
});

app.use(globalLimiter); // Apply global rate limit to all routes
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Vendeur IA OS API",
    status: "online",
    docs: "/health"
  });
});

import mongoose from "mongoose";
import { getRedisClient } from "./config/redis.js";
import { whatsappService } from "./modules/whatsapp/whatsapp.service.js";

app.get("/health", async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const redis = getRedisClient();
  const redisStatus = redis?.isOpen ? "connected" : "disconnected";
  const waSessions = (whatsappService as any).activeSessions?.size || 0;

  const isHealthy = dbStatus === "connected" && redisStatus === "connected";

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    version: "1.0.0-hardened",
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
      whatsapp_active_sessions: waSessions
    }
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/commerce", commerceRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/instagram", instagramRoutes);
app.use("/api/tiktok", tiktokRoutes);
app.use("/api/media", mediaRoutes);

async function start() {
  await connectDatabase();
  await connectRedis();

  const port = parseInt(env.PORT, 10);
  httpServer.listen(port, "0.0.0.0", () => {
    logger.info(`🚀 Vendeur IA OS API running on http://localhost:${port}`);
  });
}

start().catch(console.error);
