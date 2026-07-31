import express from "express";
import cors from "cors";
import { createServer } from "http";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import { initSocketServer } from "./realtime/socketServer.js";
import authRoutes from "./modules/auth/auth.routes.js";
import commerceRoutes from "./modules/commerce/commerce.routes.js";
import whatsappRoutes from "./modules/whatsapp/whatsapp.routes.js";
import mediaRoutes from "./modules/media/media.routes.js";

const app = express();
const httpServer = createServer(app);

// Initialize Sockets
initSocketServer(httpServer);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Vendeur IA OS API",
    status: "online",
    docs: "/health"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "vendeur-ia-api",
    version: "1.0.0-standalone",
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/commerce", commerceRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/media", mediaRoutes);

async function start() {
  await connectDatabase();
  await connectRedis();

  const port = parseInt(env.PORT, 10);
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Vendeur IA OS API running on http://localhost:${port}`);
  });
}

start().catch(console.error);
