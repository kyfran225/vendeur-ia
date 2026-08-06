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

    // Run Billing Check daily (or every 12h)
    import("./services/billing.service.js").then(({ billingService }) => {
      // Run once at startup
      billingService.checkExpirations().catch(err => logger.error("[Server] Initial billing check failed:", err));

      // Schedule every 24 hours
      setInterval(() => {
        billingService.checkExpirations().catch(err => logger.error("[Server] Scheduled billing check failed:", err));
      }, 24 * 60 * 60 * 1000);
    });
  });
}

start().catch(console.error);
