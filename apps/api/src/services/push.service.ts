import webpush from 'web-push';
import { env } from '../config/env.js';
import mongoose from 'mongoose';
import { SystemSettingsModel } from '../modules/commerce/admin.model.js';

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
  private isConfigured = false;
  private currentPublicKey: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    const publicKey = env.VAPID_PUBLIC_KEY;
    const privateKey = env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
      try {
        webpush.setVapidDetails(
          'mailto:support@vendeur-ia.com',
          publicKey,
          privateKey
        );
        this.isConfigured = true;
        this.currentPublicKey = publicKey;
        console.log("[Push Service] VAPID keys configured from env successfully. ✅");
      } catch (err: any) {
        console.warn("[Push Service] Error configuring VAPID from env:", err.message);
      }
    }
  }

  async ensureVapidConfigured(): Promise<string | null> {
    if (this.isConfigured && this.currentPublicKey) {
      return this.currentPublicKey;
    }

    let pub = env.VAPID_PUBLIC_KEY;
    let priv = env.VAPID_PRIVATE_KEY;

    if (!pub || !priv) {
      try {
        const settings = await SystemSettingsModel.findOne();
        if (settings?.pushConfig?.vapidPublicKey && settings?.pushConfig?.vapidPrivateKey) {
          pub = settings.pushConfig.vapidPublicKey;
          priv = settings.pushConfig.vapidPrivateKey;
        } else {
          // Generate a resilient VAPID keypair
          const keys = webpush.generateVAPIDKeys();
          pub = keys.publicKey;
          priv = keys.privateKey;
          await SystemSettingsModel.findOneAndUpdate(
            {},
            { $set: { "pushConfig.vapidPublicKey": pub, "pushConfig.vapidPrivateKey": priv } },
            { upsert: true }
          );
          console.log("[Push Service] Auto-generated and persisted new VAPID keys ✅");
        }
      } catch (err: any) {
        console.error("[Push Service] Failed to load/generate VAPID keys:", err.message);
      }
    }

    if (pub && priv) {
      try {
        webpush.setVapidDetails('mailto:support@vendeur-ia.com', pub, priv);
        this.isConfigured = true;
        this.currentPublicKey = pub;
        console.log("[Push Service] VAPID configured successfully ✅");
        return pub;
      } catch (err: any) {
        console.error("[Push Service] Failed to set VAPID details:", err.message);
      }
    }
    return null;
  }

  async getPublicKey(): Promise<string | null> {
    return this.ensureVapidConfigured();
  }

  async subscribe(userId: string, subscription: any) {
    const existing = await PushSubscriptionModel.findOne({
      userId,
      'subscription.endpoint': subscription.endpoint
    });

    await PushSubscriptionModel.findOneAndUpdate(
      { userId, 'subscription.endpoint': subscription.endpoint },
      { userId, subscription },
      { upsert: true, new: true }
    );

    // Send Welcome Notification only when first registering this subscription endpoint
    if (!existing) {
      this.sendNotification(userId, {
        title: "Vendeur IA OS 🚀",
        body: "Alertes activées ! Vous recevrez désormais vos notifications ici.",
      }).catch(err => console.error("[Push Service] Welcome notification failed:", err));
    }
  }

  async sendNotification(userId: string, payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    vibrate?: number[];
    tag?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    actions?: Array<{ action: string; title: string; icon?: string }>;
    data?: any;
  }) {
    await this.ensureVapidConfigured();
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
