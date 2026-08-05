import webpush from 'web-push';
import { env } from '../config/env.js';
import mongoose from 'mongoose';

// Define Push Subscription Schema
const PushSubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  subscription: {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  }
}, { timestamps: true });

export const PushSubscriptionModel = mongoose.model('PushSubscription', PushSubscriptionSchema);

export class PushService {
  constructor() {
    this.init();
  }

  private init() {
    const publicKey = env.VAPID_PUBLIC_KEY;
    const privateKey = env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
      webpush.setVapidDetails(
        'mailto:support@vendeur-ia.com',
        publicKey,
        privateKey
      );
      console.log("[Push Service] VAPID keys configured successfully. ✅");
    } else {
      console.warn("[Push Service] VAPID keys missing. Push notifications will not be sent. ⚠️");
    }
  }

  async subscribe(userId: string, subscription: any) {
    await PushSubscriptionModel.findOneAndUpdate(
      { userId, 'subscription.endpoint': subscription.endpoint },
      { userId, subscription },
      { upsert: true, new: true }
    );
  }

  async sendNotification(userId: string, payload: { title: string; body: string; icon?: string; data?: any }) {
    const subscriptions = await PushSubscriptionModel.find({ userId });

    const notifications = subscriptions.map(sub =>
      webpush.sendNotification(sub.subscription as any, JSON.stringify(payload))
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired or no longer valid
            return PushSubscriptionModel.deleteOne({ _id: sub._id });
          }
          console.error(`[Push] Error sending to ${userId}:`, err);
        })
    );

    await Promise.all(notifications);
  }
}

export const pushService = new PushService();
