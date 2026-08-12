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

    // Send Welcome Notification
    this.sendNotification(userId, {
      title: "Vendeur IA OS 🚀",
      body: "Alertes activées ! Vous recevrez désormais vos notifications ici.",
    }).catch(err => console.error("[Push Service] Welcome notification failed:", err));
  }

  async sendNotification(userId: string, payload: { title: string; body: string; icon?: string; data?: any }) {
    const subscriptions = await PushSubscriptionModel.find({ userId });

    const notifications = subscriptions.map(async (sub) => {
      const maxRetries = 2;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await webpush.sendNotification(sub.subscription as any, JSON.stringify(payload));
          return;
        } catch (err: any) {
          const isTransient500 = err.statusCode === 500 || err.statusCode === 502 || err.statusCode === 503;
          if (isTransient500 && attempt < maxRetries) {
            // Transient error from push service (FCM), retry with exponential backoff
            await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt)));
            continue;
          }

          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired or invalid
            await PushSubscriptionModel.deleteOne({ _id: sub._id });
            return;
          }

          console.warn(`[Push] Could not deliver to subscription for user ${userId} (Status ${err.statusCode || 'Unknown'}): ${err.message || err.body || err}`);
          return;
        }
      }
    });

    await Promise.all(notifications);
  }
}

export const pushService = new PushService();
