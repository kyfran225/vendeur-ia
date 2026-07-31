import { emitToUser } from "../../realtime/socketServer.js";

export class NotificationsService {
  async notifyMerchant(userId: string, title: string, body: string, data?: any) {
    // 1. Real-time emit via Socket
    emitToUser(userId, "notification:new", { title, body, data });

    // 2. Placeholder for Web Push / Firebase
    console.log(`[Notification] To user ${userId}: ${title} - ${body}`);

    // In production, we would use web-push here:
    // const subscription = await getMerchantSubscription(userId);
    // if (subscription) {
    //   webpush.sendNotification(subscription, JSON.stringify({ title, body, data }));
    // }
  }
}

export const notificationsService = new NotificationsService();
