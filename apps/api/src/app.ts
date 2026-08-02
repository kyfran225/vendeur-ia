import express from "express";
import cors from "cors";
import helmet from "helmet";
import sanitize from "mongo-sanitize";
import { createServer } from "http";
import { initSocketServer } from "./realtime/socketServer.js";
import authRoutes from "./modules/auth/auth.routes.js";
import commerceRoutes from "./modules/commerce/commerce.routes.js";
import adminRoutes from "./modules/commerce/admin.routes.js";
import marketingRoutes from "./modules/commerce/marketing.routes.js";
import whatsappRoutes from "./modules/whatsapp/whatsapp.routes.js";
import instagramRoutes from "./modules/instagram/instagram.routes.js";
import tiktokRoutes from "./modules/tiktok/tiktok.routes.js";
import mediaRoutes from "./modules/media/media.routes.js";
import "./services/ai-queue.service.js";
import { globalLimiter } from "./middleware/rate-limiter.js";
import mongoose from "mongoose";
import { getRedisClient } from "./config/redis.js";
import { whatsappService } from "./modules/whatsapp/whatsapp.service.js";

const app = express();
const httpServer = createServer(app);

// Initialize Sockets
initSocketServer(httpServer);

app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());

// NoSQL Injection Protection
app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
});

app.use(globalLimiter);
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Vendeur IA OS API",
    status: "online",
    docs: "/health"
  });
});

app.get("/health", async (req, res) => {
  let dbStatus = "disconnected";
  try {
    // Active ping to MongoDB
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      dbStatus = "connected";
    }
  } catch (err) {
    dbStatus = "error";
  }

  let redisStatus = "disconnected";
  const redis = getRedisClient();
  try {
    // ioredis status check + active ping
    if (redis && (redis.status === 'ready' || redis.status === 'connect')) {
      await redis.ping();
      redisStatus = "connected";
    }
  } catch (err) {
    redisStatus = "error";
  }

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

export { app, httpServer };
