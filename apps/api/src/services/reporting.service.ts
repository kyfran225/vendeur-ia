import {
  CommerceMerchantModel,
  CommerceConversationModel,
  CommerceOrderModel,
  CommerceProductModel
} from "../modules/commerce/commerce.model.js";
import { messagingService } from "./messaging.service.js";
import { logger } from "./logger.service.js";
import mongoose from "mongoose";

class ReportingService {
  /**
   * Runs the weekly report process for all eligible merchants.
   * Usually called every Monday.
   */
  async runScheduledReports() {
    const today = new Date();
    // Monday is 1 in JS Date (0 is Sunday)
    const isMonday = today.getDay() === 1;

    if (!isMonday) {
      logger.info("[Reporting] Today is not Monday, skipping scheduled reports.");
      return;
    }

    logger.info("[Reporting] Starting weekly performance reports...");

    // Find merchants who want weekly reports and haven't received one today
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const merchants = await CommerceMerchantModel.find({
      "aiSettings.weeklyReport": true,
      $or: [
        { lastWeeklyReportDate: { $lt: startOfToday } },
        { lastWeeklyReportDate: null }
      ]
    });

    for (const merchant of merchants) {
      try {
        await this.generateAndSendReport(merchant);
      } catch (err: any) {
        logger.error(`[Reporting] Failed for ${merchant.businessName}:`, err.message);
      }
    }
  }

  async generateAndSendReport(merchant: any) {
    const metrics = await this.calculateWeeklyMetrics(merchant._id);
    const reportText = this.formatReportMessage(merchant.businessName, metrics);

    logger.info(`[Reporting] Sending report to ${merchant.businessName} (${merchant.whatsappNumber})`);

    // Send via WhatsApp
    // We try the merchant's own connection first
    try {
      await messagingService.sendMessage(merchant, "whatsapp", merchant.whatsappNumber, reportText);

      // Mark as sent
      await CommerceMerchantModel.findByIdAndUpdate(merchant._id, {
        $set: { lastWeeklyReportDate: new Date() }
      });

      logger.info(`[Reporting] Report sent successfully to ${merchant.businessName}`);
    } catch (err: any) {
      logger.error(`[Reporting] Could not send WhatsApp to ${merchant.businessName}:`, err.message);
    }
  }

  private async calculateWeeklyMetrics(merchantId: string | mongoose.Types.ObjectId) {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // 1. Unique clients served
    const clientsCount = await CommerceConversationModel.countDocuments({
      merchantId,
      lastMessageAt: { $gte: lastWeek }
    });

    // 2. Recovered sales (Paid orders explicitly marked as recovered by AI follow-up)
    const recoveredSales = await CommerceOrderModel.countDocuments({
      merchantId,
      status: "paid",
      recoveredByAi: true,
      createdAt: { $gte: lastWeek }
    });

    // Better logic for recovered sales: count orders where an 'ai' follow-up
    // exists in the conversation history before the order.
    // (Actual implementation might be complex, so let's stick to a reliable metric:
    // "Relances envoyées" vs "Ventes après relance")

    const followUpsSent = await CommerceConversationModel.countDocuments({
        merchantId,
        updatedAt: { $gte: lastWeek },
        followUpSent: true // Conversations currently waiting for response after follow-up
    });

    // 3. Top Product
    const topProducts = await CommerceOrderModel.aggregate([
      { $match: {
          merchantId: new mongoose.Types.ObjectId(merchantId.toString()),
          status: "paid",
          createdAt: { $gte: lastWeek }
      } },
      { $unwind: "$items" },
      { $group: {
        _id: "$items.name",
        totalSold: { $sum: "$items.quantity" }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 1 }
    ]);

    const topProduct = topProducts[0] ? topProducts[0]._id : "Aucun";

    return {
      clientsCount,
      recoveredSales,
      followUpsSent,
      topProduct
    };
  }

  private formatReportMessage(businessName: string, metrics: any) {
    return `
📊 *VOTRE RAPPORT HEBDOMADAIRE IA* 🚀
━━━━━━━━━━━━━━━━━━━━━
Boutique : *${businessName}*
Période : 7 derniers jours
━━━━━━━━━━━━━━━━━━━━━

📈 *PERFORMANCE :*
👥 *Clients servis :* ${metrics.clientsCount}
✨ *Relances envoyées :* ${metrics.followUpsSent}
💰 *Ventes récupérées :* ${metrics.recoveredSales} (est.)

📦 *TOP PRODUIT :*
🏆 *${metrics.topProduct}*

💡 *CONSEIL DU PATRON :*
"L'IA a travaillé dur pour vous cette semaine ! Continuez à charger vos nouveaux produits pour maximiser vos ventes."

━━━━━━━━━━━━━━━━━━━━━
_Envoyé avec ❤️ par Vendeur IA_
    `.trim();
  }
}

export const reportingService = new ReportingService();
