import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import { httpServer } from "./app.js";
import { logger } from "./services/logger.service.js";

async function start() {
  await connectDatabase();
  await connectRedis();

  const port = parseInt(env.PORT, 10);
  httpServer.listen(port, "0.0.0.0", async () => {
    logger.info(`🚀 Vendeur IA OS API running on http://localhost:${port}`);

    // Boot WhatsApp Sessions
    try {
      const { whatsappService } = await import("./modules/whatsapp/whatsapp.service.js");
      await whatsappService.bootSessions();
    } catch (err) {
      logger.error("[Server] WhatsApp boot sessions failed:", err);
    }

    // Run Billing Check daily (or every 12h)
    setTimeout(async () => {
      try {
        const { billingService } = await import("./services/billing.service.js");
        // Run once at startup
        billingService.checkExpirations().catch(err => logger.error("[Server] Initial billing check failed:", err));

        // Schedule every 24 hours
        setInterval(() => {
          billingService.checkExpirations().catch(err => logger.error("[Server] Scheduled billing check failed:", err));
        }, 24 * 60 * 60 * 1000);
      } catch (err) {
        logger.error("[Server] Billing service setup failed:", err);
      }
    }, 5000); // Wait 5 seconds after WhatsApp boot for stability

    // Run Follow-Up Check every 1 hour
    setInterval(async () => {
      try {
        const { followUpService } = await import("./services/followup.service.js");
        await followUpService.checkPendingFollowUps();
      } catch (err) {
        logger.error("[Server] Follow-up check failed:", err);
      }
    }, 60 * 60 * 1000);

    // Run Weekly Reporting Check every 24 hours
    setInterval(async () => {
      try {
        const { reportingService } = await import("./services/reporting.service.js");
        await reportingService.runScheduledReports();
      } catch (err) {
        logger.error("[Server] Weekly report check failed:", err);
      }
    }, 24 * 60 * 60 * 1000);
  });
}

start().catch(console.error);
