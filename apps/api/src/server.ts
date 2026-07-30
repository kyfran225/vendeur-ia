import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import authRoutes from "./modules/auth/auth.routes.js";
import commerceRoutes from "./modules/commerce/commerce.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

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

async function start() {
  await connectDatabase();

  const port = parseInt(env.PORT, 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Vendeur IA OS API running on http://localhost:${port}`);
  });
}

start().catch(console.error);
