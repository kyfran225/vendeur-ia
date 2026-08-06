import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import { logger } from "./logger.service.js";
import { billingQueue } from "./billing-queue.service.js";

export class BillingService {
  /**
   * Runs a daily check for subscriptions expiring soon or already expired.
   * Schedules jobs in BullMQ for each merchant.
   */
  async checkExpirations() {
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);

    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(now.getDate() + 1);

    logger.info("[BillingService] Scanning subscriptions to queue tasks...");

    // 1. D-3 Reminders
    const merchantsD3 = await CommerceMerchantModel.find({
      "subscription.status": "active",
      "subscription.expiresAt": {
        $gt: oneDayFromNow,
        $lte: threeDaysFromNow
      }
    });

    for (const merchant of merchantsD3) {
      await billingQueue.add('send-reminder', {
        action: 'send-reminder',
        merchantId: merchant._id.toString(),
        daysLeft: 3
      });
    }

    // 2. D-1 Reminders
    const merchantsD1 = await CommerceMerchantModel.find({
      "subscription.status": "active",
      "subscription.expiresAt": {
        $gt: now,
        $lte: oneDayFromNow
      }
    });

    for (const merchant of merchantsD1) {
      await billingQueue.add('send-reminder', {
        action: 'send-reminder',
        merchantId: merchant._id.toString(),
        daysLeft: 1
      });
    }

    // 3. Expiration & Suspension (D-0)
    const expiredMerchants = await CommerceMerchantModel.find({
      "subscription.status": { $in: ["active", "past_due"] },
      "subscription.expiresAt": { $lte: now }
    });

    for (const merchant of expiredMerchants) {
      if (merchant.subscription.status !== "past_due") {
        await billingQueue.add('suspend-merchant', {
            action: 'suspend-merchant',
            merchantId: merchant._id.toString()
        });
      }
    }

    // 4. Marketing Reconquest (D+7)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const eightDaysAgo = new Date(now);
    eightDaysAgo.setDate(now.getDate() - 8);

    const merchantsToReconquer = await CommerceMerchantModel.find({
      "subscription.status": "past_due",
      "subscription.expiresAt": {
        $gt: eightDaysAgo,
        $lte: sevenDaysAgo
      }
    });

    for (const merchant of merchantsToReconquer) {
      await billingQueue.add('marketing-reconquest', {
        action: 'marketing-reconquest',
        merchantId: merchant._id.toString()
      });
    }

    logger.info(`[BillingService] Queued tasks for ${merchantsD3.length + merchantsD1.length} reminders, ${expiredMerchants.length} suspensions, and ${merchantsToReconquer.length} reconquests.`);
  }
}

export const billingService = new BillingService();

