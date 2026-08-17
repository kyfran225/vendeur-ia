import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import { SystemSettingsModel } from "../modules/commerce/admin.model.js";
import { UserModel } from "../modules/auth/user.model.js";
import { messagingService } from "./messaging.service.js";
import { pushService } from "./push.service.js";
import { logger } from "./logger.service.js";

export class BillingReceiptService {
  async sendDigitalReceipt(merchantId: string, transaction: any) {
    try {
      const merchant = await CommerceMerchantModel.findById(merchantId);
      if (!merchant) return;

      const date = new Date(transaction.paidAt || transaction.createdAt).toLocaleDateString('fr-FR');
      const amount = transaction.amount.toLocaleString();
      const currency = transaction.currency || "XOF";
      const planName = merchant.subscription?.plan === 'pro' ? 'Vendeur IA Pro' : 'Vendeur IA Essentiel';
      const intervalLabel = merchant.subscription?.billingInterval === 'yearly' ? 'Annuel (12 mois)' : 'Mensuel';
      const expiresAtStr = merchant.subscription?.expiresAt
        ? new Date(merchant.subscription.expiresAt).toLocaleDateString('fr-FR')
        : 'Actif';

      const message = `🧾 *REÇU DE PAIEMENT - VENDEUR IA*\n\n` +
        `Merci pour votre confiance, *${merchant.businessName}* ! ✨\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📅 *Date* : ${date}\n` +
        `💳 *Forfait* : ${planName} (${intervalLabel})\n` +
        `💰 *Montant* : ${amount} ${currency}\n` +
        `🔖 *Réf* : ${transaction.reference?.substring(0, 14)}...\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ Votre service est actif jusqu'au *${expiresAtStr}*.\n\n` +
        `Une question ? Répondez directement ou contactez votre support dédié.`;

      if (merchant.whatsappNumber) {
        await messagingService.sendMessage(merchant, 'whatsapp', merchant.whatsappNumber, message).catch(err => {
          logger.warn(`[BillingReceipt] WhatsApp message not sent:`, err.message);
        });
      }

      // Send Push notification to merchant
      if (merchant.ownerId) {
        await pushService.sendNotification(merchant.ownerId, {
          title: `Abonnement ${intervalLabel} Confirmé ! 🚀`,
          body: `Votre forfait ${planName} est actif jusqu'au ${expiresAtStr}.`,
          data: { url: "/settings?tab=billing" }
        }).catch(err => {
          logger.warn(`[BillingReceipt] Push notification not sent:`, err.message);
        });
      }

      logger.info(`[BillingReceipt] Digital receipt sent to ${merchant.businessName}`);
    } catch (error) {
      logger.error(`[BillingReceipt] Failed to send receipt:`, error);
    }
  }

  /**
   * Dispatches instant notifications to the technical team and the merchant
   * when a Pack Pro Expert (onboarding VIP) is ordered.
   */
  async notifyExpertSetupOrdered(merchantId: string, transaction: any) {
    try {
      const merchant = await CommerceMerchantModel.findByIdAndUpdate(
        merchantId,
        {
          $set: {
            "expertSetup.status": "pending",
            "expertSetup.orderedAt": new Date(),
            "whatsappConfig.packProAssistance": true,
            "whatsappConfig.provider": "meta"
          }
        },
        { new: true }
      );
      if (!merchant) return;

      const user = await UserModel.findOne({ ownerId: merchant.ownerId });
      const settings = await SystemSettingsModel.findOne();
      const adminWhatsApp = settings?.supportWhatsApp || "+2250700000000";

      logger.info(`[PackProExpert] New VIP Onboarding Order for ${merchant.businessName}!`);

      // 1. Instant WhatsApp Alert to Technical Team / Admins
      const adminAlertMessage = `🚨 *NOUVELLE COMMANDE PACK PRO EXPERT !*\n\n` +
        `Un marchand a commandé l'installation VIP Clé en main.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🏪 *Boutique* : ${merchant.businessName}\n` +
        `📞 *WhatsApp* : ${merchant.whatsappNumber || 'À contacter via email'}\n` +
        `📧 *Email* : ${user?.email || 'N/A'}\n` +
        `💰 *Montant* : ${transaction.amount?.toLocaleString()} ${transaction.currency || 'XOF'}\n` +
        `🔖 *Réf* : ${transaction.reference}\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `👉 Connectez-vous au Back-Office Admin pour assigner le technicien.`;

      await messagingService.sendMessage(merchant, 'whatsapp', adminWhatsApp, adminAlertMessage).catch(err => {
        logger.warn(`[PackProExpert] Admin WhatsApp alert not sent:`, err.message);
      });

      // 2. Confirmation WhatsApp to Merchant
      const merchantConfirmMessage = `⭐ *CONFIRMATION PACK PRO EXPERT - VENDEUR IA*\n\n` +
        `Félicitations *${merchant.businessName}* ! Votre commande d'installation VIP clé en main a été validée avec succès. ✨\n\n` +
        `Notre équipe technique prend en charge votre dossier. Un expert dédié va vous contacter sous 2h ouvrées pour :\n` +
        `1️⃣ Configurer votre API WhatsApp Meta Cloud officielle\n` +
        `2️⃣ Importer et optimiser votre catalogue\n` +
        `3️⃣ Planifier votre session de formation de 30 min\n\n` +
        `Votre statut est consultable en temps réel dans vos réglages.`;

      if (merchant.whatsappNumber) {
        await messagingService.sendMessage(merchant, 'whatsapp', merchant.whatsappNumber, merchantConfirmMessage).catch(err => {
          logger.warn(`[PackProExpert] Merchant confirmation WhatsApp not sent:`, err.message);
        });
      }

      // 3. Push notification to Merchant
      if (merchant.ownerId) {
        await pushService.sendNotification(merchant.ownerId, {
          title: "Pack Pro VIP Activé ! ⭐",
          body: "Notre équipe prépare votre installation Meta Cloud WhatsApp. Suivez l'avancement dans vos réglages.",
          data: { url: "/settings?tab=connexions" }
        }).catch(err => {
          logger.warn(`[PackProExpert] Push notification not sent:`, err.message);
        });
      }
    } catch (error) {
      logger.error(`[PackProExpert] Failed to notify expert setup order:`, error);
    }
  }
}

export const billingReceiptService = new BillingReceiptService();
