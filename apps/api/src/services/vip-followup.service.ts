import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import { SystemSettingsModel } from "../modules/commerce/admin.model.js";
import { UserModel } from "../modules/auth/user.model.js";
import { messagingService } from "./messaging.service.js";
import { pushService } from "./push.service.js";
import { env } from "../config/env.js";
import { logger } from "./logger.service.js";

/**
 * VIPFollowUpService handles automated checks, escalation alerts,
 * and re-engagement messages for Pack Pro VIP onboarding dossiers.
 */
class VIPFollowUpService {
  /**
   * Scans for pending or stuck VIP onboarding dossiers.
   */
  async checkPendingVIPOnboardings() {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const settings = await SystemSettingsModel.findOne();
      const adminWhatsApp = settings?.supportWhatsApp || (env as any).ADMIN_WHATSAPP_PHONE || "+2250700000000";

      logger.info("[VIPFollowUp] Scanning for pending and stuck VIP onboarding dossiers...");

      // 1. Find all merchants with active VIP setup needing attention
      const merchants = await CommerceMerchantModel.find({
        $or: [
          { "expertSetup.status": { $in: ["pending", "in_progress"] } },
          { "whatsappConfig.packProAssistance": true, "expertSetup.status": { $ne: "completed" } }
        ]
      });

      for (const merchant of merchants) {
        const status = merchant.expertSetup?.status || "pending";
        const orderedAt = merchant.expertSetup?.orderedAt || merchant.createdAt;
        const lastFollowUpAt = merchant.expertSetup?.lastFollowUpAt;
        const followUpCount = merchant.expertSetup?.followUpCount || 0;

        // Condition A: Pending > 24h with NO technician assigned -> ESCALATE TO ADMIN
        if ((status === "pending" || status === "none") && orderedAt < twentyFourHoursAgo && !merchant.expertSetup?.assignedTo) {
          await this.notifyAdminEscalation(merchant, adminWhatsApp, "non_assigne_24h");
        }

        // Condition B: In Progress > 48h with no completion -> Escalate to Admin
        if (status === "in_progress" && orderedAt < fortyEightHoursAgo) {
          const hoursSinceLastAlert = lastFollowUpAt ? (now.getTime() - new Date(lastFollowUpAt).getTime()) / (1000 * 60 * 60) : 999;
          if (hoursSinceLastAlert >= 24) {
            await this.notifyAdminEscalation(merchant, adminWhatsApp, "bloque_48h");
          }
        }

        // Condition C: Merchant re-engagement reminder (Max 3 follow-ups, at least 24h apart)
        const canSendMerchantReminder =
          status === "in_progress" &&
          merchant.whatsappNumber &&
          followUpCount < 3 &&
          (!lastFollowUpAt || new Date(lastFollowUpAt) < twentyFourHoursAgo);

        if (canSendMerchantReminder) {
          await this.sendMerchantReminder(merchant);
        }
      }
    } catch (error: any) {
      logger.error("[VIPFollowUp] Periodic check failed:", error.message);
    }
  }

  /**
   * Sends an automated, polite WhatsApp re-engagement message to the merchant.
   */
  async sendMerchantReminder(merchant: any, isManual = false) {
    if (!merchant.whatsappNumber) return;

    try {
      const user = await UserModel.findOne({ ownerId: merchant.ownerId });
      const contactName = user?.displayName || merchant.businessName;
      const technician = merchant.expertSetup?.assignedTo || "l'équipe technique";

      const reminderMessage =
        `Bonjour *${contactName}* ! ✨\n\n` +
        `C'est *${technician}* de *Vendeur IA*.\n` +
        `Votre installation VIP *Pack Pro* est en cours et nous souhaitons finaliser la mise en ligne de votre Vendeur IA officiel.\n\n` +
        `Êtes-vous disponible aujourd'hui pour 5 à 10 minutes d'échange ? Répondez simplement à ce message. 🚀`;

      await messagingService.sendMessage(merchant, "whatsapp", merchant.whatsappNumber, reminderMessage);

      // Update follow-up tracker
      await CommerceMerchantModel.findByIdAndUpdate(merchant._id, {
        $set: { "expertSetup.lastFollowUpAt": new Date() },
        $inc: { "expertSetup.followUpCount": 1 }
      });

      if (merchant.ownerId) {
        await pushService.sendNotification(merchant.ownerId, {
          title: "Assistance VIP Pack Pro 🚀",
          body: "Votre expert technique attend vos disponibilités pour finaliser l'installation.",
          data: { url: "/dashboard" }
        }).catch(() => {});
      }

      logger.info(`[VIPFollowUp] Reminder sent to merchant ${merchant.businessName} (${merchant.whatsappNumber}) [Manual: ${isManual}]`);
    } catch (err: any) {
      logger.warn(`[VIPFollowUp] Failed to send reminder to ${merchant.businessName}:`, err.message);
    }
  }

  /**
   * Notifies the admin WhatsApp and push notifications about an onboarding blocker.
   */
  private async notifyAdminEscalation(merchant: any, adminWhatsApp: string, reason: "non_assigne_24h" | "bloque_48h") {
    try {
      const cleanAdminNumber = adminWhatsApp.replace(/[^0-9]/g, "");
      if (!cleanAdminNumber) return;

      let message = "";
      if (reason === "non_assigne_24h") {
        message = `⚠️ *[ALERTE VIP 24H - DOSSIER EN ATTENTE]*\n\n` +
          `La boutique *${merchant.businessName}* (+${merchant.whatsappNumber || "N/A"}) a commandé le Pack Pro il y a plus de 24h et n'a pas encore de technicien assigné.\n\n` +
          `👉 Rendez-vous sur le MasterControl Admin pour attribuer ce dossier en priorité : /admin (Onglet VIP Onboarding).`;
      } else {
        message = `ℹ️ *[SUIVI VIP 48H - DOSSIER EN COURS]*\n\n` +
          `Le dossier Pack Pro de *${merchant.businessName}* (Assigné à: *${merchant.expertSetup?.assignedTo || "Inconnu"}*) est en cours depuis plus de 48h sans clôture.\n\n` +
          `Vérifiez l'avancement avec le marchand.`;
      }

      await messagingService.sendMessage(merchant, "whatsapp", cleanAdminNumber, message);

      logger.info(`[VIPFollowUp] Escalation alert sent to admin (${cleanAdminNumber}) for ${merchant.businessName} (${reason})`);
    } catch (err: any) {
      logger.warn("[VIPFollowUp] Failed to send admin escalation alert:", err.message);
    }
  }
}

export const vipFollowUpService = new VIPFollowUpService();
