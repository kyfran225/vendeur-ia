import { makeWASocket, DisconnectReason, fetchLatestBaileysVersion, Browsers } from "@whiskeysockets/baileys";
import { useMongoAuthState, clearMongoAuthState } from "./mongo-auth-state.js";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { env } from "../../config/env.js";
import { commerceService } from "../commerce/commerce.service.js";
import { CommerceMerchantModel, CommerceConversationModel, CommerceMessageModel, CommerceCustomerModel, CommerceProductModel, CommerceKnowledgeModel } from "../commerce/commerce.model.js";
import { WhatsAppConnectionModel } from "../commerce/whatsapp-connection.model.js";
import { emitToUser } from "../../realtime/socketServer.js";
import axios from "axios";
import { addAIJob } from "../../services/ai-queue.service.js";
import { scheduleRecovery } from "../../services/marketing-queue.service.js";
import { marketingService } from "../../services/marketing.service.js";
import { pushService } from "../../services/push.service.js";
import { whatsappMediaService } from "./whatsapp-media.service.js";
import { aiProvider } from "../../services/ai-provider.js";
import { smsService } from "../../services/sms.service.js";
import { SystemSettingsModel } from "../commerce/admin.model.js";

class WhatsAppService {
  private activeSessions: Map<string, any> = new Map();
  private pendingInitializations: Map<string, Promise<void>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private processedMessageIds: Set<string> = new Set();

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) return;

    // Check sessions every 30 minutes
    this.heartbeatInterval = setInterval(async () => {
      console.log("[WhatsApp Heartbeat] Checking session health...");
      await this.checkSessionsHealth();
    }, 30 * 60 * 1000);
  }

  async checkSessionsHealth() {
    for (const [userId, sock] of this.activeSessions.entries()) {
      try {
        const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
        if (!merchant) continue;

        // Skip if not Baileys or already marked as error/disconnected
        if (merchant.whatsappConfig?.provider !== 'baileys' || merchant.whatsappConfig?.status !== 'connected') {
          continue;
        }

        // Test the socket with a simple presence check or by checking if the state is still valid
        // onWhatsApp check is a good way to verify if the connection is really alive
        const testNumber = merchant.whatsappNumber?.replace(/\+/g, '') || "123456789";
        const [result] = await sock.onWhatsApp(testNumber);

        if (!result) {
          console.warn(`[WhatsApp Heartbeat] Session for ${userId} seems stale. Reconnecting...`);
          await this.repairSession(userId);
        }
      } catch (err: any) {
        console.error(`[WhatsApp Heartbeat] Error checking session for ${userId}:`, err.message);
        // If the error indicates a closed connection, repair it
        if (err.message?.includes("closed") || err.message?.includes("connection")) {
          await this.repairSession(userId);
        }
      }
    }
  }

  async repairSession(userId: string) {
    console.log(`[WhatsApp Repair] Attempting to fix session for ${userId}...`);
    this.activeSessions.delete(userId);
    try {
      await this.initSession(userId);
      console.log(`[WhatsApp Repair] Session for ${userId} restored successfully.`);
    } catch (err) {
      console.error(`[WhatsApp Repair] Failed to restore session for ${userId}:`, err);
    }
  }

  async bootSessions() {
    console.log("[WhatsApp] Booting sessions for active merchants...");
    try {
      const activeMerchants = await CommerceMerchantModel.find({
        "whatsappConfig.status": "connected",
        "whatsappConfig.provider": "baileys",
        ownerId: { $nin: ["recurring-test-user", "load-test-user"] } // Exclude test accounts
      });

      const bootPromises = activeMerchants.map(merchant => {
        console.log(`[WhatsApp] Auto-reconnecting session for user: ${merchant.ownerId}`);
        return this.initSession(merchant.ownerId).catch(err =>
          console.error(`[WhatsApp] Failed to boot session for ${merchant.ownerId}:`, err)
        );
      });

      await Promise.allSettled(bootPromises);
    } catch (err) {
      console.error("[WhatsApp] Error during bootSessions:", err);
    }
  }

  async initSession(userId: string, force: boolean = false): Promise<void> {
    if (force) {
      const existingSock = this.activeSessions.get(userId);
      if (existingSock) {
        try {
          existingSock.end(undefined);
        } catch (e) {}
        this.activeSessions.delete(userId);
      }
      this.pendingInitializations.delete(userId);

      await clearMongoAuthState(userId);
    }

    if (this.activeSessions.has(userId)) return;
    if (this.pendingInitializations.has(userId)) return this.pendingInitializations.get(userId);

    const initPromise = (async () => {
      try {
        const { state, saveCreds } = await useMongoAuthState(userId);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
          version,
          auth: state,
          printQRInTerminal: false,
          browser: Browsers.ubuntu("Chrome"),
        });

        this.activeSessions.set(userId, sock);

        sock.ev.on("connection.update", async (update) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            const qrCodeData = await QRCode.toDataURL(qr);
            emitToUser(userId, "whatsapp:qr", { qrCodeData });
            console.log(`[WhatsApp] QR Code generated for user ${userId}`);
          }

          if (connection === "connecting") {
            emitToUser(userId, "whatsapp:connecting", {});
          }

            if (connection === "open") {
              await CommerceMerchantModel.findOneAndUpdate(
                { ownerId: userId },
                {
                  $set: {
                    "whatsappConfig.status": "connected",
                    "whatsappConfig.provider": "baileys",
                    "whatsappConfig.reconnectAttempts": 0 // Reset attempts on success
                  }
                }
              );

              await WhatsAppConnectionModel.findOneAndUpdate(
                { userId },
                {
                  $set: {
                    status: 'CONNECTED',
                    connectionType: 'baileys',
                    connectedAt: new Date(),
                    disconnectedAt: null
                  }
                },
                { upsert: true }
              );

              emitToUser(userId, "whatsapp:connected", {});
              console.log(`[WhatsApp] User ${userId} connected`);
            }

            if (connection === "close") {
              const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
              const errMessage = (lastDisconnect?.error as Error)?.message || "";
              const isQrExpired = errMessage.includes("QR refs attempts ended") || statusCode === DisconnectReason.timedOut;

              if (isQrExpired) {
                console.log(`[WhatsApp] QR Code expiré pour l'utilisateur ${userId} (non scanné sous 2 minutes). Nettoyage de la session.`);
                this.activeSessions.delete(userId);
                this.pendingInitializations.delete(userId);
                emitToUser(userId, "whatsapp:disconnected", {
                  reason: "qr_expired",
                  shouldReconnect: false
                });
                return;
              }

              const isReplaced = statusCode === DisconnectReason.connectionReplaced;
              const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== DisconnectReason.connectionClosed && !isReplaced;

              await CommerceMerchantModel.findOneAndUpdate(
                { ownerId: userId },
                { $set: { "whatsappConfig.status": shouldReconnect ? "error" : "disconnected" } }
              );

              await WhatsAppConnectionModel.findOneAndUpdate(
                { userId },
                {
                  $set: {
                    status: shouldReconnect ? 'RECONNECTING' : 'DISCONNECTED',
                    disconnectedAt: new Date()
                  }
                },
                { upsert: true }
              );

              // Notify front-end in real-time about disconnection/error status
              emitToUser(userId, "whatsapp:disconnected", {
                reason: isReplaced ? "connection_replaced" : (statusCode === DisconnectReason.loggedOut ? "logged_out" : "error"),
                statusCode,
                shouldReconnect
              });

              // Trigger push notification to merchant
              pushService.sendNotification(userId, {
                title: "⚠️ WhatsApp Déconnecté !",
                body: "La connexion WhatsApp de votre assistant IA s'est interrompue. Cliquez ici pour la rétablir.",
                data: { url: "/settings?tab=connexions" }
              }).catch(err => console.error("[WhatsApp] Push notification send failed:", err));

              if (shouldReconnect) {
                console.warn(`[WhatsApp] Critical disconnection for user ${userId}. Reconnecting...`);

                const merchant = await CommerceMerchantModel.findOneAndUpdate(
                  { ownerId: userId },
                  { $inc: { "whatsappConfig.reconnectAttempts": 1 } },
                  { new: true }
                );

                const attempts = merchant?.whatsappConfig?.reconnectAttempts || 0;

                if (attempts <= 3) {
                  this.activeSessions.delete(userId);
                  console.log(`[WhatsApp] Reconnection attempt ${attempts}/3 for ${userId}`);
                  this.initSession(userId).catch(err => console.error(`[WhatsApp] Auto-reconnect failed for ${userId}:`, err));
                } else {
                  console.error(`[WhatsApp] Max reconnection attempts reached for ${userId}. Alerting merchant.`);
                  this.activeSessions.delete(userId);
                  await CommerceMerchantModel.findOneAndUpdate(
                    { ownerId: userId },
                    { $set: { "whatsappConfig.status": "error" } }
                  );

                  if (merchant?.whatsappNumber) {
                    smsService.sendAlert(
                      merchant.whatsappNumber,
                      `🛑 Chef, votre Vendeur IA a un problème de connexion persistant. Veuillez vous reconnecter manuellement sur votre tableau de bord.`
                    );
                  }
                }
              } else {
                this.activeSessions.delete(userId);
                await CommerceMerchantModel.findOneAndUpdate(
                  { ownerId: userId },
                  { $set: { "whatsappConfig.reconnectAttempts": 0 } }
                );
              }

              if (statusCode === DisconnectReason.badSession || statusCode === DisconnectReason.connectionClosed || isReplaced) {
                  console.log(`[WhatsApp] Stale/replaced session detected for ${userId} (status ${statusCode}), clearing storage.`);
                  await clearMongoAuthState(userId);
              }

              this.activeSessions.delete(userId);
              this.pendingInitializations.delete(userId);
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
      } finally {
        this.pendingInitializations.delete(userId);
      }
    })();

    this.pendingInitializations.set(userId, initPromise);
    return initPromise;
  }

  async requestPairingCode(userId: string, phoneNumber: string): Promise<string> {
    let sock = this.activeSessions.get(userId);
    const normalized = phoneNumber.replace(/[\s\-\+]/g, "");

    // If socket doesn't exist or its WS connection is not OPEN (readyState !== 1)
    if (!sock || (sock as any).ws?.readyState !== 1) {
      console.log(`[WhatsApp] Socket not connected for ${userId}. Forcing fresh pairing session...`);
      this.activeSessions.delete(userId);
      this.pendingInitializations.delete(userId);

      try {
        await this.initSession(userId, true); // Force clean auth state
      } catch (err: any) {
        console.error(`[WhatsApp] Pairing session init error for ${userId}:`, err);
        this.activeSessions.delete(userId);
        this.pendingInitializations.delete(userId);
        await clearMongoAuthState(userId).catch(() => {});
        throw new Error(`La connexion WhatsApp a échoué. Veuillez réessayer dans un instant (${err.message || err}).`);
      }

      // Wait up to 10 seconds for socket WS connection to open
      for (let i = 0; i < 50; i++) {
        await new Promise(r => setTimeout(r, 200));
        sock = this.activeSessions.get(userId);
        if (sock && (sock as any).ws?.readyState === 1) break;
      }
    }

    sock = this.activeSessions.get(userId);
    if (!sock) {
      this.activeSessions.delete(userId);
      this.pendingInitializations.delete(userId);
      await clearMongoAuthState(userId).catch(() => {});
      throw new Error("La session n'a pas pu s'initialiser à temps. Veuillez récliquer sur Générer le code.");
    }

    try {
      const code = await sock.requestPairingCode(normalized);
      console.log(`[WhatsApp] Pairing code generated for user ${userId}: ${code}`);
      return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
    } catch (err: any) {
      console.error(`[WhatsApp] requestPairingCode failed for ${userId}:`, err);
      this.activeSessions.delete(userId);
      this.pendingInitializations.delete(userId);
      await clearMongoAuthState(userId).catch(() => {});
      throw new Error(`Impossible de générer le code d'appairage: ${err.message || err}`);
    }
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
    if (!msg?.key) return;

    // Deduplication check
    const messageId = msg.key.id;
    if (messageId) {
      if (this.processedMessageIds.has(messageId)) {
        return;
      }
      this.processedMessageIds.add(messageId);
      // Keep bounded memory cache size
      if (this.processedMessageIds.size > 5000) {
        const firstKey = this.processedMessageIds.values().next().value;
        if (firstKey) this.processedMessageIds.delete(firstKey);
      }
    }

    // Extract phone or normalized remoteJid
    let rawFrom = msg.key.remoteJid || "";
    let from = rawFrom;

    // Ignore status broadcast messages & newsletter/channels
    if (from.includes("@broadcast") || rawFrom.includes("@broadcast") || from.includes("@newsletter")) {
      return;
    }

    // Ignore WhatsApp group messages
    if (from.endsWith("@g.us") || rawFrom.endsWith("@g.us")) {
      return;
    }

    // Ignore historical/backlog messages received upon reconnection (> 2 minutes old)
    const msgTimestamp = typeof msg.messageTimestamp === "number"
      ? msg.messageTimestamp
      : (typeof msg.messageTimestamp?.low === "number" ? msg.messageTimestamp.low : Number(msg.messageTimestamp || 0));

    if (msgTimestamp > 0 && (Date.now() / 1000 - msgTimestamp) > 120) {
      console.log(`[WhatsApp] Ignored stale historical message from sync (${Math.round(Date.now() / 1000 - msgTimestamp)}s old)`);
      return;
    }
    
    // If Baileys uses LID (@lid), try to get the real phone number (sender_pn or remoteJidAlt)
    if (msg.key?.remoteJidAlt && msg.key.remoteJidAlt.includes('@s.whatsapp.net')) {
      from = msg.key.remoteJidAlt;
    } else if (msg.key?.sender_pn) {
      from = msg.key.sender_pn;
    }

    let text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    const imageMsg = msg.message?.imageMessage;

    // WhatsApp Service: handleIncomingMessage
    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    if (!merchant) return;

    // --- HUMAN TAKEOVER LOGIC ---
    let conversation = await CommerceConversationModel.findOne({
      merchantId: merchant._id,
      customerId: (await CommerceCustomerModel.findOne({ phone: from, merchantId: merchant._id }))?._id
    });

    if (conversation?.status === 'needs_human') {
      console.log(`[WhatsApp] Human takeover active for conversation ${conversation._id}. AI skipped.`);
      return;
    }
    // ----------------------------

    const isAudioMsg = !text && (msg.message?.audioMessage || msg.message?.videoMessage);

    // Vocal Support: Handle Audio Messages
    if (isAudioMsg) {
      console.log("[WhatsApp] Audio/Video message received, attempting transcription...");
      try {
        const type = msg.message?.audioMessage ? 'audio' : 'video';
        const buffer = await whatsappMediaService.downloadBaileysMedia(msg, type);
        const merchantContext = merchant ? `Boutique: ${merchant.businessName}, Ville: ${merchant.city}` : "";

        const transcription = await aiProvider.transcribeAudio(
          buffer,
          msg.message?.[`${type}Message`]?.mimetype || 'audio/ogg',
          merchantContext
        );

        text = `[Message Vocal]: ${transcription}`;
        console.log(`[WhatsApp] Transcription result: ${text}`);
      } catch (err) {
        console.error("Error handling audio/video transcription:", err);
        text = "[Message Vocal Reçu (Transcription indisponible)]";
      }
    }

    if (!text && !imageMsg) return;

    if (!merchant) return;

    // Find or create customer
    const pushName = msg.pushName || undefined;
    let customer = await CommerceCustomerModel.findOne({ merchantId: merchant._id, phone: from });
    if (!customer && rawFrom !== from) {
      // Fallback: check if customer exists under rawFrom
      customer = await CommerceCustomerModel.findOne({ merchantId: merchant._id, phone: rawFrom });
    }

    if (!customer) {
      customer = await CommerceCustomerModel.create({ merchantId: merchant._id, phone: from, name: pushName });
    } else if (pushName && !customer.name) {
      customer.name = pushName;
      await customer.save();
    }

    // Find or create conversation
    conversation = await CommerceConversationModel.findOne({ merchantId: merchant._id, customerId: customer._id, status: "active" });
    if (!conversation) {
      conversation = await CommerceConversationModel.create({ merchantId: merchant._id, customerId: customer._id });
    } else if (conversation.followUpSent) {
      // Reset followUpSent when customer replies to allow new follow-ups later
      // and to track recovery correctly in reporting
      conversation.followUpSent = false;
      conversation.isRecoveryPending = true; // Mark that the next order from this conv is a recovery
      await conversation.save();
      console.log(`[WhatsApp] Follow-up reset and recovery pending for conversation ${conversation._id}`);
    }

    // Handle Image / Payment Proof
    if (imageMsg) {
      console.log("[WhatsApp] Image received, checking for payment proof...");
      try {
        const buffer = await whatsappMediaService.downloadBaileysMedia(msg, 'image');
        const auditResult = await commerceService.auditAndLinkPaymentToOrder({
          merchant,
          customer,
          imageBuffer: buffer,
          mimeType: 'image/jpeg'
        });

        if (auditResult && auditResult.extraction?.isPaymentProof) {
          emitToUser(userId, "payment:detected", {
            conversationId: conversation._id,
            auditResult,
            ...auditResult.extraction
          });

          if (auditResult.decision === "AUTO_APPROVED") {
            pushService.sendNotification(userId, {
              title: "💰 Paiement Validé par Shield OCR !",
              body: `Reçu authentifié (${auditResult.confidenceScore}%). ${customer.phone} a payé ${auditResult.amount} XOF via ${auditResult.platform}.`,
              data: { conversationId: conversation._id.toString(), orderId: auditResult.orderId?.toString() }
            }).catch((err: any) => console.error("[WhatsApp] Push notification error:", err));

            text = `[PAIEMENT SHIELD VALIDÉ AUTOMATIQUEMENT: ${auditResult.platform} - ${auditResult.amount} XOF (Score: ${auditResult.confidenceScore}%)]`;

            // Send digital receipt automatically
            if (auditResult.orderId) {
              const receipt = await commerceService.generateDigitalReceipt(auditResult.orderId.toString());
              const sock = this.activeSessions.get(userId);
              if (sock) {
                await sock.sendMessage(from, { text: receipt });
              }
            }
          } else if (auditResult.decision === "FLAGGED_FOR_REVIEW") {
            pushService.sendNotification(userId, {
              title: "⚠️ Preuve Suspecte à Vérifier",
              body: `Capture de ${auditResult.amount} XOF reçue mais nécessite votre confirmation manuelle (Score: ${auditResult.confidenceScore}%).`,
              data: { conversationId: conversation._id.toString() }
            }).catch((err: any) => console.error("[WhatsApp] Push notification error:", err));

            text = `[PREUVE SUSPECTE - VÉRIFICATION MANUELLE REQUISE: ${auditResult.platform} ${auditResult.amount} XOF (Alertes: ${auditResult.flags.join(", ")})]`;
          } else {
            pushService.sendNotification(userId, {
              title: "🚨 Alerte Fraude / Fausse Preuve",
              body: `Tentative de fausse capture d'écran détectée pour ${customer.phone} (${auditResult.flags.join(", ")}).`,
              data: { conversationId: conversation._id.toString() }
            }).catch((err: any) => console.error("[WhatsApp] Push notification error:", err));

            text = `[ALERTE SHIELD FRAUDE DÉTECTÉE: Reçu rejeté (${auditResult.flags.join(", ")})]`;
          }
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
      type: isAudioMsg ? "audio" : imageMsg ? "image" : "text",
      content: text
    });

    // Update conversation metadata
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // --- SCHEDULE MARKETING RELANCE (2h) ---
    scheduleRecovery(conversation._id.toString(), merchant._id.toString(), customer._id.toString()).catch(err =>
      console.error("[Marketing] Failed to schedule recovery:", err)
    );

    // --- TRACK MARKETING CAMPAIGN ENGAGEMENT ---
    marketingService.recordCustomerReply(merchant._id.toString(), customer._id.toString()).catch(err =>
      console.error("[Marketing] Failed to record customer reply:", err)
    );

    // --- AUTO-EXTRACT CUSTOMER LOCATION FROM CONVERSATION ---
    if (text) {
      commerceService.extractCustomerLocation(customer._id.toString(), text).catch(err =>
        console.error("[Location Extraction Error]:", err)
      );
    }

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
      merchant: merchant.toObject() as any,
      products: products.map(p => p.toObject()),
      knowledge: knowledge ? (knowledge.toObject() as any) : {},
      history: formattedHistory,
      message: text,
      customerPhone: from,
      customerLoyalty: customer ? {
        points: customer.loyaltyPoints || 0,
        isVIP: (customer.loyaltyPoints || 0) >= (merchant.loyaltySettings?.threshold || 50),
        threshold: merchant.loyaltySettings?.enabled ? merchant.loyaltySettings.threshold : undefined,
        rewardDescription: merchant.loyaltySettings?.rewardDescription
      } : undefined,
      aiSummary: (conversation as any).aiSummary || "",
      platform: "whatsapp"
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
          to: to.replace(/\+/g, ""),
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
      const errData = error.response?.data || {};
      if (errData?.error?.code === 131030) {
        console.warn(`[Meta WhatsApp Warning] Le numéro ${to} n'est pas dans la liste des destinataires autorisés du mode Sandbox Meta. Ajoutez-le sur developers.facebook.com ou passez l'app Meta en Production.`);
      }
      console.error("[Meta WhatsApp] Error sending message:", errData || error.message);
    }
  }

  async sendAuthMagicLink(to: string, loginUrl: string, otpCode: string) {
    // Get Global System Settings for Meta
    const settings = await SystemSettingsModel.findOne();
    const config = settings?.metaConfig?.whatsappDefaults;

    const phoneNumberId = config?.phoneNumberId || env.WHATSAPP_PHONE_ID;
    const accessToken = config?.accessToken || env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.warn("[WhatsApp Auth] WhatsApp System credentials not configured. SMS fallback might be needed or error generated.");
      throw new Error("Le service d'authentification WhatsApp n'est pas configuré.");
    }

    const cleanTo = to.replace(/[\s\-\+\(\)]/g, "");
    const text = `🚀 *Bienvenue sur Vendeur IA !*\n\nPour accéder à votre espace :\n\n🔗 Touchez ce lien : ${loginUrl}\n\n🔢 Ou saisissez ce code : *${otpCode}*\n\n_Valable pendant 15 minutes._`;

    try {
      await axios.post(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanTo,
          type: "text",
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`[WhatsApp Auth] Magic Link sent to ${to}`);
    } catch (error: any) {
      console.error("[WhatsApp Auth] Failed to send Magic Link:", error.response?.data || error.message);
      throw new Error("Échec de l'envoi du message WhatsApp. Vérifiez que votre numéro est correct.");
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
    // 1. Find the merchant associated with this Phone ID (Dedicated number) or phone/whatsappNumber
    let merchant = await CommerceMerchantModel.findOne({
      $or: [
        { "whatsappConfig.meta.phoneNumberId": phoneId },
        { whatsappNumber: phoneId },
        { phone: phoneId },
        { whatsappNumber: `+${phoneId}` },
        { "whatsappConfig.provider": "meta" }
      ]
    });
    let latestConversation: any = null;

    // 2. If not found, it might be a shared system number
    if (!merchant) {
      console.log(`[Meta WhatsApp] No dedicated merchant for PhoneID ${phoneId}, searching via conversation history...`);

      // Find the most recent active conversation with this customer phone number
      latestConversation = await CommerceConversationModel.findOne({
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
    } else {
       // Merchant found directly by PhoneID, fetch latest conversation for payment events
       latestConversation = await CommerceConversationModel.findOne({
         merchantId: merchant._id,
         status: { $in: ["active", "needs_human"] },
         platform: "whatsapp"
       }).populate({
         path: "customerId",
         match: { phone: from }
       }).sort({ lastMessageAt: -1 });
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
          msg.message.imageMessage = true;

          // Find or create customer to get the ID for linking
          let customer = await CommerceCustomerModel.findOne({ merchantId: merchant._id, phone: from });
          if (!customer) {
            customer = await CommerceCustomerModel.create({ merchantId: merchant._id, phone: from });
          }

          const auditResult = await commerceService.auditAndLinkPaymentToOrder({
            merchant,
            customer,
            imageBuffer: buffer,
            mimeType: 'image/jpeg'
          });

          if (auditResult && auditResult.extraction?.isPaymentProof) {
            emitToUser(merchant.ownerId, "payment:detected", {
               conversationId: latestConversation?._id,
               auditResult,
               ...auditResult.extraction
            });

            if (auditResult.decision === "AUTO_APPROVED") {
              pushService.sendNotification(merchant.ownerId, {
                title: "💰 Paiement Validé par Shield OCR ! (API)",
                body: `Reçu authentifié (${auditResult.confidenceScore}%). ${customer.phone} a payé ${auditResult.amount} XOF via ${auditResult.platform}.`,
                data: { conversationId: latestConversation?._id?.toString(), orderId: auditResult.orderId?.toString() }
              }).catch((err: any) => console.error("[WhatsApp Meta] Push notification error:", err));

              text = `[PAIEMENT SHIELD VALIDÉ AUTOMATIQUEMENT: ${auditResult.platform} - ${auditResult.amount} XOF (Score: ${auditResult.confidenceScore}%)]`;

              // Send digital receipt automatically via Meta
              if (auditResult.orderId) {
                const receipt = await commerceService.generateDigitalReceipt(auditResult.orderId.toString());
                await this.sendMetaMessage(merchant, from, receipt);
              }
            } else if (auditResult.decision === "FLAGGED_FOR_REVIEW") {
              pushService.sendNotification(merchant.ownerId, {
                title: "⚠️ Preuve Suspecte à Vérifier (API)",
                body: `Capture de ${auditResult.amount} XOF reçue mais nécessite votre confirmation manuelle (Score: ${auditResult.confidenceScore}%).`,
                data: { conversationId: latestConversation?._id?.toString() }
              }).catch((err: any) => console.error("[WhatsApp Meta] Push notification error:", err));

              text = `[PREUVE SUSPECTE - VÉRIFICATION MANUELLE REQUISE: ${auditResult.platform} ${auditResult.amount} XOF (Alertes: ${auditResult.flags.join(", ")})]`;
            } else {
              pushService.sendNotification(merchant.ownerId, {
                title: "🚨 Alerte Fraude / Fausse Preuve (API)",
                body: `Tentative de fausse capture d'écran détectée pour ${customer.phone} (${auditResult.flags.join(", ")}).`,
                data: { conversationId: latestConversation?._id?.toString() }
              }).catch((err: any) => console.error("[WhatsApp Meta] Push notification error:", err));

              text = `[ALERTE SHIELD FRAUDE DÉTECTÉE: Reçu rejeté (${auditResult.flags.join(", ")})]`;
            }
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
    if (sock && sock.user && (sock.user.id || (sock.user as any).lid)) {
      try {
        await sock.sendPresenceUpdate(presence, remoteJid);
      } catch (err) {
        console.error(`[WhatsApp] Failed to send presence for user ${userId}:`, err);
      }
    } else {
      console.warn(`[WhatsApp] Skipping presence update for ${userId}: socket not fully authenticated`);
    }
  }

  async sendMessage(userId: string, to: string, text: string, options?: { type?: 'text' | 'audio' }) {
    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    if (!merchant) throw new Error("Merchant not found");

    const useAudio = options?.type === 'audio' || (merchant.aiSettings?.voiceMode && text.length < 300);

    if (merchant.whatsappConfig?.provider === 'meta') {
      if (useAudio) {
        try {
          const audioBuffer = await aiProvider.generateSpeech(text);
          return this.sendMetaAudio(merchant, to, audioBuffer);
        } catch (err) {
          console.warn("[WhatsApp Meta] Failed to generate speech, falling back to text:", err);
          return this.sendMetaMessage(merchant, to, text);
        }
      }
      return this.sendMetaMessage(merchant, to, text);
    } else {
      let sock = this.activeSessions.get(userId);

      // Wait for pending initialization if any
      const pending = this.pendingInitializations.get(userId);
      if (pending) {
        console.log(`[WhatsApp] Waiting for pending session init for ${userId}...`);
        await Promise.race([
          pending,
          new Promise(resolve => setTimeout(resolve, 10000)) // 10s timeout
        ]).catch(() => {});
        sock = this.activeSessions.get(userId);
      }

      if (!sock && (merchant.whatsappConfig?.status === 'connected' || merchant.whatsappConfig?.status === 'error')) {
        console.log(`[WhatsApp] On-demand session init for ${userId}`);
        await this.initSession(userId);
        sock = this.activeSessions.get(userId);
      }

      if (sock && sock.user) {
        if (useAudio) {
          try {
            const audioBuffer = await aiProvider.generateSpeech(text);
            // Baileys audio message: we need to handle the conversion if needed or send as PTT
            return await sock.sendMessage(to, {
              audio: audioBuffer,
              mimetype: 'audio/mp4',
              ptt: true
            });
          } catch (err) {
            console.warn("[WhatsApp Baileys] Failed to generate speech, falling back to text:", err);
            return await sock.sendMessage(to, { text });
          }
        }
        return await sock.sendMessage(to, { text });
      } else {
        throw new Error("WhatsApp session not active or authenticated");
      }
    }
  }

  getActiveSocket(userId: string) {
    return this.activeSessions.get(userId);
  }

  async postStatus(userId: string, content: { text?: string; imageBuffer?: Buffer; caption?: string }) {
    const sock = this.activeSessions.get(userId);
    if (!sock) {
      throw new Error("Session WhatsApp non connectée");
    }

    const statusJid = "status@broadcast";

    if (content.imageBuffer) {
      return await sock.sendMessage(statusJid, {
        image: content.imageBuffer,
        caption: content.caption || content.text || ""
      });
    } else if (content.text) {
      return await sock.sendMessage(statusJid, {
        text: content.text
      });
    }
  }

  async getSessionStatus(userId: string) {
    const session = this.activeSessions.get(userId);
    if (!session) return "disconnected";

    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    return merchant?.whatsappConfig?.status || "disconnected";
  }

  async disconnectSession(userId: string) {
    const sock = this.activeSessions.get(userId);
    if (sock) {
      try {
        await sock.logout();
      } catch (e) {}
      this.activeSessions.delete(userId);
    }
    this.pendingInitializations.delete(userId);

    await clearMongoAuthState(userId);

    await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: userId },
      { $set: { "whatsappConfig.status": "disconnected" } }
    );
  }
}

export const whatsappService = new WhatsAppService();
