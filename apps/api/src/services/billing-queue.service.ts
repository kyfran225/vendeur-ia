import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env.js';
import { CommerceMerchantModel } from '../modules/commerce/commerce.model.js';
import { UserModel } from '../modules/auth/user.model.js';
import { messagingService } from './messaging.service.js';
import { pushService } from './push.service.js';
import { billingEmailService } from './billing-email.service.js';
import { paystackService } from './paystack.service.ts';
import { logger } from './logger.service.js';
import { marketingService } from './marketing.service.js';
import { SystemSettingsModel } from '../modules/commerce/admin.model.js';

const REDIS_URL = env.REDIS_URL || 'redis://localhost:6379';

export const billingQueue = new Queue('billing-tasks', {
  connection: { url: REDIS_URL },
});

export const billingWorker = new Worker(
  'billing-tasks',
  async (job: Job) => {
    const { action, merchantId, daysLeft } = job.data;

    try {
      const merchant = await CommerceMerchantModel.findById(merchantId);
      if (!merchant) return;

      const user = await UserModel.findOne({ ownerId: merchant.ownerId });
      const businessName = merchant.businessName;
      const isMobileMoney = merchant.subscription?.paymentMethod === 'mobile_money';

      if (action === 'send-reminder') {
        logger.info(`[BillingQueue] Sending D-${daysLeft} reminder to ${businessName}`);

        let renewalLink = "";
        if (isMobileMoney) {
          // 1. Fetch Regional Pricing
          const settings = await SystemSettingsModel.findOne();
          const currency = merchant.currency || "XOF";
          const regionalPricing = settings?.pricing?.regional?.find((r: any) => r.currency === currency);

          let amount = merchant.subscription?.plan === 'business' ? 25000 : 5000;
          if (regionalPricing) {
            amount = merchant.subscription?.plan === 'business' ? regionalPricing.businessMonthly : regionalPricing.premiumMonthly;
          }

          // 2. Generate a payment link for Mobile Money users
          const paymentData = await paystackService.initializeSubscription(
            user?.email || "billing@vendeur-ia.com",
            amount,
            {
              type: "subscription",
              plan: merchant.subscription?.plan,
              userId: merchant.ownerId,
              currency: currency
            }
          );
          renewalLink = paymentData.authorization_url;
        }

        // 1. WhatsApp Notification
        const waMessage = `⚠️ *Rappel Réabonnement - ${businessName}*\n\n` +
          `Votre abonnement expire dans *${daysLeft} jour(s)*.\n\n` +
          (isMobileMoney
            ? `Cliquez ici pour renouveler par Mobile Money (${merchant.currency || "XOF"}) :\n👉 ${renewalLink}`
            : `Votre prélèvement automatique par carte aura lieu le ${merchant.subscription?.expiresAt?.toLocaleDateString()}.`);

        await messagingService.sendMessage(merchant, 'whatsapp', merchant.whatsappNumber || "", waMessage);

        // 2. Push Notification
        await pushService.sendNotification(merchant.ownerId, {
          title: "Réabonnement imminent ⏳",
          body: `Votre abonnement expire dans ${daysLeft} jour(s). Cliquez pour renouveler.`,
          data: { type: "billing", url: renewalLink || "/settings?tab=billing" }
        });

        // 3. Email
        if (user?.email) {
          await billingEmailService.sendExpirationReminder(user.email, user.displayName || businessName, daysLeft);
        }
      }

      if (action === 'suspend-merchant') {
        logger.warn(`[BillingQueue] Suspending merchant ${businessName}`);

        merchant.subscription.status = "past_due";
        await merchant.save();

        const waMessage = `🛑 *Service Suspendu - ${businessName}*\n\n` +
          `Votre abonnement a expiré. Votre IA est désormais inactive.\n\n` +
          `Pour réactiver immédiatement votre service, cliquez ici :\n👉 ${env.CLIENT_URL}/settings?tab=billing`;

        await messagingService.sendMessage(merchant, 'whatsapp', merchant.whatsappNumber || "", waMessage);

        await pushService.sendNotification(merchant.ownerId, {
          title: "Service Suspendu 🛑",
          body: "Votre abonnement a expiré. Réactivez pour relancer votre IA.",
          data: { type: "billing", action: "renew" }
        });

        if (user?.email) {
          await billingEmailService.sendSuspensionNotice(user.email, user.displayName || businessName);
        }
      }

      if (action === 'marketing-reconquest') {
        logger.info(`[BillingQueue] Triggering marketing reconquest for ${businessName}`);
        await marketingService.sendReconquestNotification(merchantId);
      }
    } catch (err) {
      logger.error(`[BillingQueue] Error in job ${job.id}:`, err);
      throw err;
    }
  },
  {
    connection: { url: REDIS_URL },
    concurrency: 2,
  }
);
