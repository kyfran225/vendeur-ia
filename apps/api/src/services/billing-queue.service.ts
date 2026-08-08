import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env.js';
import { CommerceMerchantModel } from '../modules/commerce/commerce.model.js';
import { UserModel } from '../modules/auth/user.model.js';
import { messagingService } from './messaging.service.js';
import { pushService } from './push.service.js';
import { billingEmailService } from './billing-email.service.js';
import { paystackService } from './paystack.service.js';
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
    const { action, merchantId, daysLeft, isGracePeriod } = job.data;

    try {
      const merchant = await CommerceMerchantModel.findById(merchantId);
      if (!merchant) return;

      const user = await UserModel.findOne({ ownerId: merchant.ownerId });
      const businessName = merchant.businessName;
      const isMobileMoney = merchant.subscription?.paymentMethod === 'mobile_money';

      if (action === 'send-reminder') {
        logger.info(`[BillingQueue] Sending D-${daysLeft} reminder to ${businessName} (Grace: ${!!isGracePeriod})`);

        let renewalLink = "";
        if (isMobileMoney || isGracePeriod) {
          // 1. Fetch Regional Pricing
          const settings = await SystemSettingsModel.findOne();
          const currency = merchant.currency || "XOF";
          const regionalPricing = settings?.pricing?.regional?.find((r: any) => r.currency === currency);

          let amount = merchant.subscription?.plan === 'business' ? 25000 : 5000;
          if (regionalPricing) {
            amount = merchant.subscription?.plan === 'business' ? regionalPricing.businessMonthly : regionalPricing.premiumMonthly;
          }

          // 2. Generate a payment link for Mobile Money / Grace Period users
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
        let waMessage = "";
        if (isGracePeriod) {
          waMessage = `🎁 *Délai de Grâce Activé - ${businessName}*\n\n` +
            `Votre abonnement a expiré, mais nous avons maintenu votre IA active pour *24h supplémentaires* afin de ne pas interrompre vos ventes.\n\n` +
            `⚠️ Réactivez maintenant pour éviter la coupure demain :\n👉 ${renewalLink || env.CLIENT_URL + '/settings?tab=billing'}`;
        } else {
          waMessage = `⚠️ *Rappel Réabonnement - ${businessName}*\n\n` +
            `Votre abonnement expire dans *${daysLeft} jour(s)*.\n\n` +
            (isMobileMoney
              ? `Cliquez ici pour renouveler par Mobile Money (${merchant.currency || "XOF"}) :\n👉 ${renewalLink}`
              : `Votre prélèvement automatique par carte aura lieu le ${merchant.subscription?.expiresAt?.toLocaleDateString()}.`);
        }

        try {
          await messagingService.sendMessage(merchant, 'whatsapp', merchant.whatsappNumber || "", waMessage);
        } catch (waErr: any) {
          if (waErr.message === "WhatsApp session not active") {
            logger.warn(`[BillingQueue] Could not send WhatsApp reminder to ${businessName}: WhatsApp session not active`);
          } else {
            logger.error(`[BillingQueue] Failed to send WhatsApp reminder to ${businessName}:`, waErr);
          }
        }

        // 2. Push Notification
        await pushService.sendNotification(merchant.ownerId, {
          title: isGracePeriod ? "Délai de Grâce Offert ! 🎁" : "Réabonnement imminent ⏳",
          body: isGracePeriod
            ? "Votre abonnement est fini, mais l'IA reste active encore 24h pour vous. Cliquez ici pour recharger."
            : `Votre abonnement expire dans ${daysLeft} jour(s). Cliquez pour renouveler.`,
          data: { type: "billing", url: renewalLink || "/settings?tab=billing" }
        });

        // 3. Email
        if (user?.email) {
          await billingEmailService.sendExpirationReminder(user.email, user.displayName || businessName, daysLeft);
        }
      }

      if (action === 'suspend-merchant') {
        logger.warn(`[BillingQueue] Suspending merchant ${businessName}`);

        if (merchant.subscription) {
          merchant.subscription.status = "past_due";
          await merchant.save();
        }

        const waMessage = `🛑 *Service Suspendu - ${businessName}*\n\n` +
          `Votre abonnement a expiré. Votre IA est désormais inactive.\n\n` +
          `Pour réactiver immédiatement votre service, cliquez ici :\n👉 ${env.CLIENT_URL}/settings?tab=billing`;

        try {
          await messagingService.sendMessage(merchant, 'whatsapp', merchant.whatsappNumber || "", waMessage);
        } catch (waErr: any) {
          if (waErr.message === "WhatsApp session not active") {
            logger.warn(`[BillingQueue] Could not send WhatsApp suspension notice to ${businessName}: WhatsApp session not active`);
          } else {
            logger.error(`[BillingQueue] Failed to send WhatsApp suspension notice to ${businessName}:`, waErr);
          }
        }

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
