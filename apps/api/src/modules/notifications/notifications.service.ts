import { emitToUser } from "../../realtime/socketServer.js";
import { messagingService } from "../../services/messaging.service.js";

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
  async notifyOrderCreated(merchant: any, order: any, customer?: any, source: "web_shop" | "ai_chat" | "manual" = "web_shop") {
    const ownerId = merchant?.ownerId?.toString() || merchant?.ownerId;
    if (!ownerId) return;

    const currency = merchant.currency || "XOF";
    const totalFormatted = (order.totalAmount || 0).toLocaleString();
    const customerName = customer?.name || order.shippingAddress || "Client";
    const customerPhone = customer?.phone || customer?.platformId || "Non renseigné";
    
    // 1. In-App Realtime Socket event
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

    // 2. WhatsApp Notification to Merchant
    const merchantPhone = merchant.phone || merchant.whatsappNumber;
    if (merchantPhone) {
      try {
        const itemsList = Array.isArray(order.items)
          ? order.items.map((i: any) => `• ${i.name || "Article"} (x${i.quantity || 1}) - ${((i.price || 0) * (i.quantity || 1)).toLocaleString()} ${currency}`).join("\n")
          : "• Articles sélectionnés";

        const sourceLabel = source === "web_shop" ? "🛒 Vitrine Panier Web" : source === "ai_chat" ? "🤖 Discussion Vendeur IA" : "📝 Saisie Manuelle";

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
  async notifyPaymentReceived(merchant: any, order: any, customer?: any, amount?: number, method?: string) {
    const ownerId = merchant?.ownerId?.toString() || merchant?.ownerId;
    if (!ownerId) return;

    const currency = merchant.currency || "XOF";
    const totalFormatted = (amount || order?.totalAmount || 0).toLocaleString();
    const customerName = customer?.name || "Client";

    // 1. In-App Realtime Socket event
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

    // 2. WhatsApp alert to merchant
    const merchantPhone = merchant.phone || merchant.whatsappNumber;
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
  async notifyHumanEscalation(merchant: any, customer: any, reason: string) {
    const ownerId = merchant?.ownerId?.toString() || merchant?.ownerId;
    if (!ownerId) return;

    // In-App Socket
    emitToUser(ownerId, "takeover:requested", {
      customer: customer?.toObject ? customer.toObject() : customer,
      reason,
      timestamp: new Date()
    });
    emitToUser(ownerId, "notification:new", {
      title: "🚨 Intervention humaine requise",
      body: `Client ${customer?.name || customer?.phone || 'Inconnu'} : ${reason}`,
      data: { customerId: customer?._id, priority: "high" }
    });

    // WhatsApp
    const merchantPhone = merchant.phone || merchant.whatsappNumber;
    if (merchantPhone) {
      try {
        const msg = `🚨 *ALERTE REPRISE EN MAIN - VENDEUR IA*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `Le client *${customer?.name || 'Client'}* (${customer?.phone || ''}) a besoin d'un conseiller humain.\n\n` +
          `📝 *Motif* : ${reason}\n\n` +
          `👉 *Rendez-vous sur l'application pour répondre au client.*`;
        await messagingService.sendMessage(merchant, "whatsapp", merchantPhone, msg);
      } catch (err: any) {
        console.warn("[NotificationsService] Failed to send escalation alert to WhatsApp:", err?.message);
      }
    }
  }
}

export const notificationsService = new NotificationsService();
