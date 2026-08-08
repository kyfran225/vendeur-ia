import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import { messagingService } from "./messaging.service.js";
import { logger } from "./logger.service.js";

export class BillingReceiptService {
  async sendDigitalReceipt(merchantId: string, transaction: any) {
    try {
      const merchant = await CommerceMerchantModel.findById(merchantId);
      if (!merchant) return;

      const date = new Date(transaction.paidAt || transaction.createdAt).toLocaleDateString('fr-FR');
      const amount = transaction.amount.toLocaleString();
      const currency = transaction.currency || "XOF";
      const plan = transaction.type === "subscription" ? (merchant.subscription?.plan || "Premium") : transaction.type;

      const message = `🧾 *REÇU DE PAIEMENT - VENDEUR IA*\n\n` +
        `Merci pour votre confiance, *${merchant.businessName}* ! ✨\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📅 *Date* : ${date}\n` +
        `💳 *Type* : ${plan.toUpperCase()}\n` +
        `💰 *Montant* : ${amount} ${currency}\n` +
        `🔖 *Réf* : ${transaction.reference.substring(0, 12)}...\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ Votre service est actif jusqu'au *${merchant.subscription?.expiresAt?.toLocaleDateString('fr-FR')}*.\n\n` +
        `Une question ? Répondez "Aide" ou contactez le support.`;

      await messagingService.sendMessage(merchant, 'whatsapp', merchant.whatsappNumber || "", message);
      logger.info(`[BillingReceipt] Digital receipt sent to ${merchant.businessName}`);
    } catch (error) {
      logger.error(`[BillingReceipt] Failed to send receipt:`, error);
    }
  }
}

export const billingReceiptService = new BillingReceiptService();
