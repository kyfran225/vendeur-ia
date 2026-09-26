import { emitToUser } from "../../realtime/socketServer.js";
import { messagingService } from "../../services/messaging.service.js";
import { env } from "../../config/env.js";
import axios from "axios";

export class NotificationsService {
  /**
   * Generic notification emit
   */
  async notifyMerchant(userId: string, title: string, body: string, data?: any) {
    // 1. Real-time emit via Socket
    emitToUser(userId, "notification:new", { title, body, data });
    console.log(`[Notification] To user ${userId}: ${title} - ${body}`);
  }

  /**
   * Notifies merchant across In-App Realtime and WhatsApp when a new order is placed
   */
  async notifyOrderCreated(merchant: any, order: any, customer?: any, source: "web_shop" | "ai_chat" | "manual" = "web_shop", req?: any) {
    const ownerId = merchant?.ownerId?.toString() || merchant?.ownerId;

    const currency = merchant?.currency || "XOF";
    const totalFormatted = (order.totalAmount || 0).toLocaleString("fr-FR");
    const customerName = customer?.name || order.shippingAddress || "Client";
    const customerPhone = customer?.phone || customer?.whatsappNumber || customer?.platformId || "Non renseigné";
    
    // 1. In-App Realtime Socket event
    if (ownerId) {
      try {
        emitToUser(ownerId, "order:created", {
          order: order.toObject ? order.toObject() : order,
          customer: customer?.toObject ? customer.toObject() : customer,
          source
        });
        emitToUser(ownerId, "notification:new", {
          title: "Nouvelle commande ! 🛍️",
          body: `Commande de ${totalFormatted} ${currency} par ${customerName}`,
          data: { orderId: order._id, source }
        });
      } catch (sockErr) {
        console.warn("[NotificationsService] Socket emit error:", sockErr);
      }
    }

    const sourceLabel = source === "web_shop" ? "🛒 Vitrine Panier Web" : source === "ai_chat" ? "🤖 Discussion Vendeur IA" : "📝 Saisie Manuelle";

    // Telegram Admin Alert with phone number
    const adminMsg = `🛒 **Nouvelle Commande Passée !**\n` +
      `• **Boutique** : ${merchant?.storeName || merchant?.displayName || merchant?.name || 'Boutique'}\n` +
      `• **Client** : ${customerName}\n` +
      `• **Téléphone** : ${customerPhone}\n` +
      `• **Montant** : ${totalFormatted} ${currency}\n` +
      `• **Canal** : ${sourceLabel}\n` +
      `• **Date** : ${new Date().toLocaleString("fr-FR")}`;
    this.sendAdminAlert(adminMsg, req).catch(() => {});

    // 2. WhatsApp Notification to Merchant
    const merchantPhone = merchant?.phone || merchant?.whatsappNumber;
    if (merchantPhone) {
      try {
        const itemsList = Array.isArray(order.items)
          ? order.items.map((i: any) => `• ${i.name || "Article"} (x${i.quantity || 1}) - ${((i.price || 0) * (i.quantity || 1)).toLocaleString("fr-FR")} ${currency}`).join("\n")
          : "• Articles sélectionnés";

        const whatsappMessage = `🔔 *NOUVELLE COMMANDE REÇUE !*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📍 *Origine* : ${sourceLabel}\n` +
          `👤 *Client* : ${customerName} (${customerPhone})\n` +
          (order.shippingAddress ? `🏠 *Adresse* : ${order.shippingAddress}\n` : "") +
          (order.paymentMethod ? `💳 *Paiement* : ${order.paymentMethod === "cash_on_delivery" ? "Espèces à la livraison" : "Mobile Money"}\n` : "") +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📦 *Articles* :\n${itemsList}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💰 *Total* : *${totalFormatted} ${currency}*\n\n` +
          `👉 *Gérez cette commande dans votre tableau de bord Vendeur IA !*`;

        await messagingService.sendMessage(merchant, "whatsapp", merchantPhone, whatsappMessage);
        console.log(`[NotificationsService] Sent WhatsApp order alert to merchant ${merchantPhone}`);
      } catch (waErr: any) {
        console.warn(`[NotificationsService] Could not send WhatsApp alert to merchant (${merchantPhone}):`, waErr?.message || waErr);
      }
    }
  }

  /**
   * Notifies merchant when a payment is received / validated
   */
  async notifyPaymentReceived(merchant: any, order: any, customer?: any, amount?: number, method?: string, req?: any) {
    const ownerId = merchant?.ownerId?.toString() || merchant?.ownerId;

    const currency = merchant?.currency || "XOF";
    const totalFormatted = (amount || order?.totalAmount || 0).toLocaleString("fr-FR");
    const customerName = customer?.name || "Client";
    const customerPhone = customer?.phone || customer?.whatsappNumber || customer?.platformId || "Non renseigné";

    // Telegram Admin Alert with phone number
    const adminMsg = `💰 **Paiement Reçu & Validé !**\n` +
      `• **Boutique** : ${merchant?.storeName || merchant?.displayName || merchant?.name || 'Boutique'}\n` +
      `• **Client** : ${customerName}\n` +
      `• **Téléphone** : ${customerPhone}\n` +
      `• **Montant** : ${totalFormatted} ${currency}\n` +
      `• **Moyen** : ${method || 'Mobile Money'}\n` +
      `• **Commande** : #${order?._id?.toString().slice(-6) || ''}\n` +
      `• **Date** : ${new Date().toLocaleString("fr-FR")}`;
    this.sendAdminAlert(adminMsg, req).catch(() => {});

    // 1. In-App Realtime Socket event
    if (ownerId) {
      try {
        emitToUser(ownerId, "payment:received", {
          orderId: order?._id,
          amount,
          customer
        });
        emitToUser(ownerId, "notification:new", {
          title: "Paiement Reçu ! 💰",
          body: `${totalFormatted} ${currency} reçu pour la commande #${order?._id?.toString().slice(-6) || ''}`,
          data: { orderId: order?._id, amount }
        });
      } catch (sockErr) {
        console.warn("[NotificationsService] Socket emit error:", sockErr);
      }
    }

    // 2. WhatsApp alert to merchant
    const merchantPhone = merchant?.phone || merchant?.whatsappNumber;
    if (merchantPhone) {
      try {
        const whatsappMessage = `💰 *PAIEMENT REÇU & VALIDÉ !*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `👤 *Client* : ${customerName}\n` +
          `💵 *Montant encaissé* : *${totalFormatted} ${currency}*\n` +
          (method ? `💳 *Canal* : ${method}\n` : "") +
          `📦 *Commande* : #${order?._id?.toString().slice(-6) || ''}\n\n` +
          `✅ *Le statut de la commande a été mis à jour dans votre espace.*`;

        await messagingService.sendMessage(merchant, "whatsapp", merchantPhone, whatsappMessage);
      } catch (waErr: any) {
        console.warn(`[NotificationsService] Could not send WhatsApp payment alert to merchant:`, waErr?.message || waErr);
      }
    }
  }

  /**
   * Notifies merchant when human escalation is triggered
   */
  async notifyHumanEscalation(merchant: any, customer: any, reason: string, req?: any) {
    const ownerId = merchant?.ownerId?.toString() || merchant?.ownerId;
    const customerPhone = customer?.phone || customer?.whatsappNumber || customer?.platformId || "Non renseigné";

    // Telegram Admin Alert with phone number
    const adminMsg = `🚨 **Intervention Humaine Requise !**\n` +
      `• **Boutique** : ${merchant?.storeName || merchant?.displayName || merchant?.name || 'Boutique'}\n` +
      `• **Client** : ${customer?.name || 'Client'}\n` +
      `• **Téléphone** : ${customerPhone}\n` +
      `• **Motif** : ${reason}\n` +
      `• **Date** : ${new Date().toLocaleString("fr-FR")}`;
    this.sendAdminAlert(adminMsg, req).catch(() => {});

    // In-App Socket
    if (ownerId) {
      emitToUser(ownerId, "takeover:requested", {
        customer: customer?.toObject ? customer.toObject() : customer,
        reason,
        timestamp: new Date()
      });
      emitToUser(ownerId, "notification:new", {
        title: "🚨 Intervention humaine requise",
        body: `Client ${customer?.name || customerPhone} : ${reason}`,
        data: { customerId: customer?._id, priority: "high" }
      });
    }

    // WhatsApp
    const merchantPhone = merchant?.phone || merchant?.whatsappNumber;
    if (merchantPhone) {
      try {
        const msg = `🚨 *ALERTE REPRISE EN MAIN - VENDEUR IA*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `Le client *${customer?.name || 'Client'}* (${customerPhone}) a besoin d'un conseiller humain.\n\n` +
          `📝 *Motif* : ${reason}\n\n` +
          `👉 *Rendez-vous sur l'application pour répondre au client.*`;
        await messagingService.sendMessage(merchant, "whatsapp", merchantPhone, msg);
      } catch (err: any) {
        console.warn("[NotificationsService] Failed to send escalation alert to WhatsApp:", err?.message);
      }
    }
  }

  async sendAdminAlert(text: string, req?: any) {
    try {
      const isEnabled = env.ENABLE_ADMIN_NOTIFICATIONS;
      if (!isEnabled) return;

      // Determine category / origin tag to distinguish test/local, PC dev, and real visitors
      let originTag = "🌐 **[VRAI VISITEUR]**";

      // 1. Automated test environment (Jest / Vitest)
      if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.JEST_WORKER_ID) {
        originTag = "🧪 **[TEST & LOCAL]**";
      }
      // 2. Request object available: inspect client headers, IP, and User-Agent
      else if (req) {
        const userAgent = (req.headers?.['user-agent'] || '').toLowerCase();
        const hasDevHeader = req.headers?.['x-developer-pc'] === 'true' || req.headers?.['x-developer-pc'] === true;

        const forwarded = req.headers?.['x-forwarded-for'];
        const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || '');
        const isLocalhostIp = ip === '127.0.0.1' || ip === '::1';

        const isApiTestTool =
          userAgent.includes('postman') ||
          userAgent.includes('axios') ||
          userAgent.includes('curl') ||
          userAgent.includes('node-fetch') ||
          userAgent.includes('insomnia');

        if (hasDevHeader || isLocalhostIp || isApiTestTool) {
          originTag = "💻 **[PC / DÉVELOPPEMENT]**";
        } else {
          originTag = "🌐 **[VRAI VISITEUR]**";
        }
      }
      // 3. Fallback when no HTTP request context is available
      else if (process.env.NODE_ENV === 'development') {
        originTag = "💻 **[PC / DÉVELOPPEMENT]**";
      }

      const formattedText = `${originTag}\n${text}`;

      console.log(`[NotificationsService] Admin alert attempt (${originTag}): "${text.substring(0, 50)}..."`);

      // 1. Try Telegram (Priority)
      if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        try {
          const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
          await axios.post(url, {
            chat_id: env.TELEGRAM_CHAT_ID,
            text: formattedText,
            parse_mode: 'Markdown'
          }, { timeout: 10000 });
          console.log("[NotificationsService] Admin alert sent successfully to Telegram.");
          return; // Success, don't fallback to Discord
        } catch (tgErr: any) {
          console.error("[NotificationsService] Telegram Alert Error:", tgErr?.response?.data || tgErr?.message);
          // Fallback to Discord if Telegram fails
        }
      }

      // 2. Fallback to Discord
      let webhookUrl = env.ADMIN_NOTIFICATIONS_WEBHOOK_URL;
      if (webhookUrl) {
        // Automatically strip any accidental wrapping quotes injected by deployment environments
        if ((webhookUrl.startsWith('"') && webhookUrl.endsWith('"')) || (webhookUrl.startsWith("'") && webhookUrl.endsWith("'"))) {
          webhookUrl = webhookUrl.slice(1, -1).trim();
        }

        if (webhookUrl.startsWith("http")) {
          const payload = { content: formattedText };
          await axios.post(webhookUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          });
          console.log("[NotificationsService] Admin alert sent successfully to Discord.");
          return;
        }
      }

      console.warn("[NotificationsService] SKIPPED: No valid notification channel (Telegram or Discord) configured.");
    } catch (err: any) {
      console.error("[NotificationsService] Admin Alert Error:", err?.response?.data || err?.message || err);
    }
  }
}

export const notificationsService = new NotificationsService();
