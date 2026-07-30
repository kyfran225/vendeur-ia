import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "vendeur-ia-api" });
});

async function start() {
  await connectDatabase();

  const port = parseInt(env.PORT, 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Vendeur IA API running on http://localhost:${port}`);
  });
}

start().catch(console.error);
