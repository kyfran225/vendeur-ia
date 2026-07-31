import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import { env } from "../../config/env.js";
import { commerceService } from "../commerce/commerce.service.js";
import { CommerceMerchantModel, CommerceConversationModel, CommerceMessageModel, CommerceCustomerModel, CommerceProductModel, CommerceKnowledgeModel } from "../commerce/commerce.model.js";
import { emitToUser } from "../../realtime/socketServer.js";
import axios from "axios";
import { addAIJob } from "../../services/ai-queue.service.js";

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
        emitToUser(userId, "whatsapp:connected", {});
        console.log(`[WhatsApp] User ${userId} connected`);
      }

      if (connection === "close") {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) this.initSession(userId);
        else this.activeSessions.delete(userId);
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

  async handleIncomingMessage(userId: string, msg: any) {
    const from = msg.key.remoteJid;
    let text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

    // Vocal Support: Handle Audio Messages
    if (!text && (msg.message?.audioMessage || msg.message?.videoMessage)) {
        console.log("[WhatsApp] Audio/Video message received, attempting transcription...");
        // In a real scenario, we would download the media and use aiProvider.transcribeAudio
        // For now, we'll use a placeholder to show the "brain" is aware of vocal inputs
        text = "[Message Vocal Reçu]";
    }

    if (!text) return;

    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
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

    // Save customer message
    const customerMsg = await CommerceMessageModel.create({ conversationId: conversation._id, sender: "customer", content: text });

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
      customerPhone: from
    });
  }

  async sendMetaMessage(merchant: any, to: string, text: string) {
    if (!env.WHATSAPP_PHONE_ID || !env.WHATSAPP_ACCESS_TOKEN) {
      console.warn("[Meta WhatsApp] API Credentials missing");
      return;
    }

    try {
      await axios.post(
        `https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_ID}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`[Meta WhatsApp] Message sent to ${to}`);
    } catch (error: any) {
      console.error("[Meta WhatsApp] Error sending message:", error.response?.data || error.message);
    }
  }
}

export const whatsappService = new WhatsAppService();
