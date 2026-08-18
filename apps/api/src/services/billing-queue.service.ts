import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env.js';
import { CommerceMerchantModel } from '../modules/commerce/commerce.model.js';
import { SubscriptionModel } from '../modules/commerce/subscription.model.js';
import { UserModel } from '../modules/auth/user.model.js';
import { messagingService } from './messaging.service.js';
import { pushService } from './push.service.js';
import { smsService } from './sms.service.js';
import { billingEmailService } from './billing-email.service.js';
import { paystackService } from './paystack.service.js';
import { logger } from './logger.service.js';
import { marketingService } from './marketing.service.js';
import { SystemSettingsModel } from '../modules/commerce/admin.model.js';

const REDIS_URL = env.REDIS_URL || 'redis://localhost:6379';

export const billingQueue = new Queue('billing-tasks', {
  connection: { url: REDIS_URL },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5s delay, then 10s, 20s...
    },
    removeOnComplete: { count: 100 }, // Keep last 100 for debugging
    removeOnFail: { count: 500 },
  }
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
          const currency = merchant.billingCurrency || merchant.currency || "XOF";
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
            `Votre abonnement a expiré, mais nous avons maintenu votre Vendeur IA actif pour *24h supplémentaires* afin de ne pas interrompre vos ventes.\n\n` +
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
            if (merchant.whatsappNumber) {
              logger.warn(`[BillingQueue] WhatsApp session down for ${businessName}. Falling back to SMS.`);
              const smsMessage = `VENDEUR IA: Rappel abonnement - ${daysLeft} jour(s). Renouvelez ici: ${renewalLink || env.CLIENT_URL + '/settings?tab=billing'}`;
              await smsService.sendAlert(merchant.whatsappNumber, smsMessage);
            } else {
              logger.warn(`[BillingQueue] WhatsApp session down for ${businessName}, but no phone number available for SMS fallback.`);
            }
          } else {
            logger.error(`[BillingQueue] Failed to send WhatsApp reminder to ${businessName}:`, waErr);
          }
        }

        // 2. Push Notification
        await pushService.sendNotification(merchant.ownerId, {
          title: isGracePeriod ? "Délai de Grâce Offert ! 🎁" : "Réabonnement imminent ⏳",
          body: isGracePeriod
            ? "Votre abonnement est fini, mais Vendeur IA reste actif encore 24h pour vous. Cliquez ici pour recharger."
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

        await SubscriptionModel.findOneAndUpdate(
          { userId: merchant.ownerId },
          { $set: { status: "past_due" } }
        );

        const waMessage = `🛑 *Service Suspendu - ${businessName}*\n\n` +
          `Votre abonnement a expiré. Votre Vendeur IA est désormais inactive.\n\n` +
          `Pour réactiver immédiatement votre service, cliquez ici :\n👉 ${env.CLIENT_URL}/settings?tab=billing`;

        try {
          await messagingService.sendMessage(merchant, 'whatsapp', merchant.whatsappNumber || "", waMessage);
        } catch (waErr: any) {
          if (waErr.message === "WhatsApp session not active") {
            if (merchant.whatsappNumber) {
              logger.warn(`[BillingQueue] WhatsApp session down for ${businessName}. Falling back to SMS suspension notice.`);
              const smsMessage = `VENDEUR IA: Service Suspendu pour ${businessName}. Votre abonnement a expiré. Réactivez ici: ${env.CLIENT_URL}/settings?tab=billing`;
              await smsService.sendAlert(merchant.whatsappNumber, smsMessage);
            } else {
              logger.warn(`[BillingQueue] WhatsApp session down for ${businessName}, but no phone number available for SMS suspension notice fallback.`);
            }
          } else {
            logger.error(`[BillingQueue] Failed to send WhatsApp suspension notice to ${businessName}:`, waErr);
          }
        }

        await pushService.sendNotification(merchant.ownerId, {
          title: "Service Suspendu 🛑",
          body: "Votre abonnement a expiré. Réactivez pour relancer votre Vendeur IA.",
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
    concurrency: 1, // Process one by one to avoid hitting Paystack rate limits
    limiter: {
      max: 5, // Max 5 jobs per second
      duration: 1000,
    }
  }
);

billingQueue.on('error', (err) => {
  logger.error('[Billing Queue Error]', { message: err.message });
});

billingWorker.on('error', (err) => {
  logger.error('[Billing Worker Error]', { message: err.message });
});

