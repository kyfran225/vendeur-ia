import { MarketingCampaignModel } from "../modules/commerce/commerce.model.js";

export class BroadcastLimiterService {
  private DAILY_LIMIT = 500;

  async checkQuota(merchantId: string, requestedCount: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const campaignsToday = await MarketingCampaignModel.find({
      merchantId,
      createdAt: { $gte: today }
    });

    const totalSentToday = campaignsToday.reduce((acc, c) => acc + (c.targetCount || 0), 0);

    if (totalSentToday + requestedCount > this.DAILY_LIMIT) {
      const remaining = this.DAILY_LIMIT - totalSentToday;
      throw new Error(`Quota quotidien dépassé. Il vous reste ${Math.max(0, remaining)} messages pour aujourd'hui.`);
    }

    return true;
  }
}

export const broadcastLimiter = new BroadcastLimiterService();
