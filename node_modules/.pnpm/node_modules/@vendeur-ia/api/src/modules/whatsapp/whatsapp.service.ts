import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import { env } from "../../config/env.js";
import { commerceService } from "../commerce/commerce.service.js";
import { CommerceMerchantModel, CommerceConversationModel, CommerceMessageModel, CommerceCustomerModel } from "../commerce/commerce.model.js";
import { emitToUser } from "../../realtime/socketServer.js";
import axios from "axios";

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
          if (!msg.key.fromMe && msg.message) {
            await this.handleIncomingMessage(userId, msg);
          }
        }
      }
    });
  }

  async handleIncomingMessage(userId: string, msg: any) {
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
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

    // Emit to frontend
    emitToUser(userId, "conversation:update", {
      conversationId: conversation._id,
      message: customerMsg
    });

    // Generate AI response
    const reply = await commerceService.processAiMessage(merchant._id as any, from, text, []);

    // Save and send AI message
    const aiMsg = await CommerceMessageModel.create({ conversationId: conversation._id, sender: "ai", content: reply });

    emitToUser(userId, "conversation:update", {
      conversationId: conversation._id,
      message: aiMsg
    });

    const sock = this.activeSessions.get(userId);
    if (sock) {
      await sock.sendMessage(from, { text: reply });
    }
  }

  async sendMetaMessage(merchant: any, to: string, text: string) {
    // Implementation for Cloud API (if configured)
  }
}

export const whatsappService = new WhatsAppService();
