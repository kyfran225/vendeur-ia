import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
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
}

export const billingReceiptService = new BillingReceiptService();
