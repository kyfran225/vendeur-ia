import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import { env } from "../../config/env.js";
import { commerceService } from "../commerce/commerce.service.js";
import { CommerceMerchantModel, CommerceConversationModel, CommerceMessageModel, CommerceCustomerModel, CommerceProductModel, CommerceKnowledgeModel } from "../commerce/commerce.model.js";
import { emitToUser } from "../../realtime/socketServer.js";
import axios from "axios";
import { addAIJob } from "../../services/ai-queue.service.js";
import { whatsappMediaService } from "./whatsapp-media.service.js";
import { aiProvider } from "../../services/ai-provider.js";
import { SystemSettingsModel } from "../commerce/admin.model.js";

class WhatsAppService {
  private activeSessions: Map<string, any> = new Map();

  async initSession(userId: string) {
    if (this.activeSessions.has(userId)) return;

    const { state, saveCreds } = await useMultiFileAuthState(`storage/whatsapp/session-${userId}`);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
    });

    this.activeSessions.set(userId, sock);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrCodeData = await QRCode.toDataURL(qr);
        emitToUser(userId, "whatsapp:qr", { qrCodeData });
        console.log(`[WhatsApp] QR Code generated for user ${userId}`);
      }

      if (connection === "open") {
        await CommerceMerchantModel.findOneAndUpdate(
          { ownerId: userId },
          {
            $set: {
              "whatsappConfig.status": "connected",
              "whatsappConfig.provider": "baileys"
            }
          }
        );
        emitToUser(userId, "whatsapp:connected", {});
        console.log(`[WhatsApp] User ${userId} connected`);
      }

      if (connection === "close") {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

        await CommerceMerchantModel.findOneAndUpdate(
          { ownerId: userId },
          { $set: { "whatsappConfig.status": shouldReconnect ? "error" : "disconnected" } }
        );

        if (shouldReconnect) {
          this.initSession(userId);
        } else {
          this.activeSessions.delete(userId);
        }
      }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (m) => {
      if (m.type === "notify") {
        for (const msg of m.messages) {
          if (!msg.key.fromMe) {
            await this.handleIncomingMessage(userId, msg);
          }
        }
      }
    });
  }

  private async getMetaConfig(merchant: any) {
    // 1. Merchant-specific credentials
    if (merchant.whatsappConfig?.meta?.phoneNumberId && merchant.whatsappConfig?.meta?.accessToken) {
      return {
        phoneNumberId: merchant.whatsappConfig.meta.phoneNumberId,
        accessToken: merchant.whatsappConfig.meta.accessToken
      };
    }

    // 2. Global System Settings
    const settings = await SystemSettingsModel.findOne();
    if (settings?.metaConfig?.whatsappDefaults?.phoneNumberId && settings?.metaConfig?.whatsappDefaults?.accessToken) {
      return {
        phoneNumberId: settings.metaConfig.whatsappDefaults.phoneNumberId,
        accessToken: settings.metaConfig.whatsappDefaults.accessToken
      };
    }

    // 3. Fallback to Env
    return {
      phoneNumberId: env.WHATSAPP_PHONE_ID,
      accessToken: env.WHATSAPP_ACCESS_TOKEN
    };
  }

  async handleIncomingMessage(userId: string, msg: any) {
    const from = msg.key.remoteJid;
    let text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    const imageMsg = msg.message?.imageMessage;

    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });

    // Vocal Support: Handle Audio Messages
    if (!text && (msg.message?.audioMessage || msg.message?.videoMessage)) {
      console.log("[WhatsApp] Audio/Video message received, attempting transcription...");
      try {
        const type = msg.message?.audioMessage ? 'audio' : 'video';
        const buffer = await whatsappMediaService.downloadBaileysMedia(msg, type);
        const merchantContext = merchant ? `Boutique: ${merchant.businessName}, Ville: ${merchant.city}` : "";

        text = await aiProvider.transcribeAudio(
          buffer,
          msg.message?.[`${type}Message`]?.mimetype || 'audio/ogg',
          merchantContext
        );

        console.log(`[WhatsApp] Transcription result: ${text}`);
      } catch (err) {
        console.error("Error handling audio/video transcription:", err);
        text = "[Message Vocal Reçu (Transcription échouée)]";
      }
    }

    if (!text && !imageMsg) return;

    if (!merchant) return;

    // Find or create customer
    let customer = await CommerceCustomerModel.findOne({ merchantId: merchant._id, phone: from });
    if (!customer) {
      customer = await CommerceCustomerModel.create({ merchantId: merchant._id, phone: from });
    }

    // Find or create conversation
    let conversation = await CommerceConversationModel.findOne({ merchantId: merchant._id, customerId: customer._id, status: "active" });
    if (!conversation) {
      conversation = await CommerceConversationModel.create({ merchantId: merchant._id, customerId: customer._id });
    }

    // Handle Image / Payment Proof
    if (imageMsg) {
      console.log("[WhatsApp] Image received, checking for payment proof...");
      try {
        const buffer = await whatsappMediaService.downloadBaileysMedia(msg, 'image');
        const paymentInfo = await commerceService.validatePaymentProof(buffer, 'image/jpeg');

        if (paymentInfo && paymentInfo.isPaymentProof) {
          emitToUser(userId, "payment:detected", {
            conversationId: conversation._id,
            ...paymentInfo
          });
          text = `[PREUVE DE PAIEMENT DÉTECTÉE: ${paymentInfo.platform} - ${paymentInfo.amount} XOF]`;
        } else {
          text = "[Image / Capture d'écran reçue]";
        }
      } catch (err) {
        console.error("Error handling image:", err);
        text = "[Image / Capture d'écran reçue]";
      }
    }

    // Save customer message
    const customerMsg = await CommerceMessageModel.create({
      conversationId: conversation._id,
      sender: "customer",
      content: text
    });

    // Update conversation metadata
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Fetch conversation history
    const historyMessages = await CommerceMessageModel.find({ conversationId: conversation._id })
      .sort({ timestamp: -1 })
      .limit(10);

    const history = historyMessages.reverse().map(m => ({
      sender: m.sender,
      content: m.content
    }));

    // Emit to frontend
    emitToUser(userId, "conversation:update", {
      conversationId: conversation._id,
      message: customerMsg
    });

    // --- DELEGATE TO QUEUE ---
    if (conversation.status === "needs_human") {
      console.log(`[WhatsApp] Skipping AI for conversation ${conversation._id} (Status: needs_human)`);
      return;
    }

    const products = await CommerceProductModel.find({ merchantId: merchant._id });
    const knowledge = await CommerceKnowledgeModel.findOne({ merchantId: merchant._id });

    const formattedHistory = history.map(h => ({
      role: (h.sender === "customer" ? "customer" : "ai") as "customer" | "ai",
      text: h.content
    }));

    await addAIJob({
      userId,
      conversationId: conversation._id.toString(),
      remoteJid: from,
      merchant: merchant.toObject(),
      products: products.map(p => p.toObject()),
      knowledge: knowledge ? (knowledge.toObject() as any) : {},
      history: formattedHistory,
      message: text,
      customerPhone: from,
      customerLoyalty: {
        points: customer.loyaltyPoints || 0,
        isVIP: (customer.loyaltyPoints || 0) >= 50
      }
    });
  }

  async sendMetaMessage(merchant: any, to: string, text: string) {
    const config = await this.getMetaConfig(merchant);

    if (!config.phoneNumberId || !config.accessToken) {
      console.warn(`[Meta WhatsApp] API Credentials missing for merchant ${merchant.businessName}`);
      return;
    }

    try {
      await axios.post(
        `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`[Meta WhatsApp] Message sent to ${to} (Merchant: ${merchant.businessName})`);
    } catch (error: any) {
      console.error("[Meta WhatsApp] Error sending message:", error.response?.data || error.message);
    }
  }

  async sendMetaAudio(merchant: any, to: string, audioBuffer: Buffer) {
    const config = await this.getMetaConfig(merchant);

    if (!config.phoneNumberId || !config.accessToken) return;

    try {
      // 1. Upload Media
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/ogg" });
      formData.append("file", blob, "voice.ogg");
      formData.append("type", "audio/ogg");
      formData.append("messaging_product", "whatsapp");

      const uploadRes = await axios.post(
        `https://graph.facebook.com/v20.0/${config.phoneNumberId}/media`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
          },
        }
      );

      const mediaId = uploadRes.data.id;

      // 2. Send Audio Message
      await axios.post(
        `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "audio",
          audio: { id: mediaId },
        },
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`[Meta WhatsApp] Audio sent to ${to}`);
    } catch (error: any) {
      console.error("[Meta WhatsApp] Error sending audio:", error.response?.data || error.message);
    }
  }

  async handleMetaIncomingMessage(from: string, text: string, phoneId: string, media?: { mediaId: string, mediaType: string }) {
    // 1. Find the merchant associated with this Phone ID (Dedicated number)
    let merchant = await CommerceMerchantModel.findOne({ "whatsappConfig.meta.phoneNumberId": phoneId });

    // 2. If not found, it might be a shared system number
    if (!merchant) {
      console.log(`[Meta WhatsApp] No dedicated merchant for PhoneID ${phoneId}, searching via conversation history...`);

      // Find the most recent active conversation with this customer phone number
      const latestConversation = await CommerceConversationModel.findOne({
        status: { $in: ["active", "needs_human"] },
        platform: "whatsapp"
      })
      .populate({
        path: "customerId",
        match: { phone: from }
      })
      .sort({ lastMessageAt: -1 });

      if (latestConversation && latestConversation.customerId) {
        merchant = await CommerceMerchantModel.findById(latestConversation.merchantId);
        console.log(`[Meta WhatsApp] Routed shared message to merchant: ${merchant?.businessName}`);
      }
    }

    if (!merchant) {
      console.error(`[Meta WhatsApp] No merchant found for incoming message from ${from} on PhoneID ${phoneId}`);
      return;
    }

    // 2. Prepare message object for handleIncomingMessage
    const msg: any = {
      key: { remoteJid: from, fromMe: false },
      message: { conversation: text }
    };

    // 3. Handle Media if present
    if (media) {
      try {
        console.log(`[Meta WhatsApp] Downloading ${media.mediaType} ${media.mediaId}...`);
        const buffer = await whatsappMediaService.downloadMetaMedia(media.mediaId);

        if (media.mediaType === 'image') {
          // Mocking Baileys-like structure for handleIncomingMessage compatibility
          msg.message.imageMessage = true;

          const paymentInfo = await commerceService.validatePaymentProof(buffer, 'image/jpeg');
          if (paymentInfo && paymentInfo.isPaymentProof) {
            text = `[PREUVE DE PAIEMENT DÉTECTÉE: ${paymentInfo.platform} - ${paymentInfo.amount} XOF]`;
            msg.message.conversation = text;
          }
        } else if (media.mediaType === 'audio') {
          console.log("[Meta WhatsApp] Audio received, attempting transcription...");
          const merchantContext = merchant ? `Boutique: ${merchant.businessName}, Ville: ${merchant.city}` : "";

          text = await aiProvider.transcribeAudio(
            buffer,
            'audio/ogg', // Meta usually sends ogg
            merchantContext
          );

          msg.message.conversation = text;
          console.log(`[Meta WhatsApp] Transcription result: ${text}`);
        }
      } catch (error) {
        console.error("[Meta WhatsApp] Error processing media:", error);
      }
    }

    await this.handleIncomingMessage(merchant.ownerId, msg);
  }

  async sendPresence(userId: string, remoteJid: string, presence: 'composing' | 'available' | 'paused') {
    const sock = this.activeSessions.get(userId);
    if (sock) {
      try {
        await sock.sendPresenceUpdate(presence, remoteJid);
      } catch (err) {
        console.error(`[WhatsApp] Failed to send presence for user ${userId}:`, err);
      }
    }
  }

  async getSessionStatus(userId: string) {
    const session = this.activeSessions.get(userId);
    if (!session) return "disconnected";
    // Baileys doesn't have a simple 'isConnected' property, but the presence of the socket
    // and the last known state in DB is usually enough.
    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    return merchant?.whatsappConfig?.status || "disconnected";
  }

  async disconnectSession(userId: string) {
    const sock = this.activeSessions.get(userId);
    if (sock) {
      await sock.logout();
      this.activeSessions.delete(userId);
    }
    await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: userId },
      { $set: { "whatsappConfig.status": "disconnected" } }
    );
  }
}

export const whatsappService = new WhatsAppService();
