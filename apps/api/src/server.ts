import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import { httpServer } from "./app.js";
import { logger } from "./services/logger.service.js";

async function start() {
  await connectDatabase();
  await connectRedis();

  const port = parseInt(env.PORT, 10);
  httpServer.listen(port, "0.0.0.0", () => {
    logger.info(`🚀 Vendeur IA OS API running on http://localhost:${port}`);

    // Boot WhatsApp Sessions
    import("./modules/whatsapp/whatsapp.service.js").then(({ whatsappService }) => {
      whatsappService.bootSessions();
    });
  });
}

start().catch(console.error);
