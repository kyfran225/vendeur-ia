import { makeWASocket, DisconnectReason, fetchLatestBaileysVersion, Browsers } from "@whiskeysockets/baileys";
import { useMongoAuthState, clearMongoAuthState, migrateMongoAuthState, WhatsAppSessionModel } from "./mongo-auth-state.js";
import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";
import { env } from "../../config/env.js";
import { commerceService } from "../commerce/commerce.service.js";
import { CommerceMerchantModel, CommerceConversationModel, CommerceMessageModel, CommerceCustomerModel, CommerceProductModel, CommerceKnowledgeModel } from "../commerce/commerce.model.js";
import { SubscriptionModel } from "../commerce/subscription.model.js";
import { WhatsAppConnectionModel } from "../commerce/whatsapp-connection.model.js";
import { emitToUser, emitToSession, emitToAuth, getSocketServer } from "../../realtime/socketServer.js";
import axios from "axios";
import { addAIJob } from "../../services/ai-queue.service.js";
import { scheduleRecovery } from "../../services/marketing-queue.service.js";
import { marketingService } from "../../services/marketing.service.js";
import { pushService } from "../../services/push.service.js";
import { whatsappMediaService } from "./whatsapp-media.service.js";
import { aiProvider } from "../../services/ai-provider.js";
import { smsService } from "../../services/sms.service.js";
import { SystemSettingsModel } from "../commerce/admin.model.js";
import { generatePhoneVariants, isFounderNumber } from "../auth/auth.service.js";
import { parsePhoneNumber } from "@vendeur-ia/core";

class WhatsAppService {
  private activeSessions: Map<string, any> = new Map();
  private pendingInitializations: Map<string, Promise<void>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private processedMessageIds: Set<string> = new Set();
  private lastQrMap: Map<string, string> = new Map();
  private lastPairingCodeMap: Map<string, string> = new Map();

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
      const [merchants, activeConnections, storedCreds] = await Promise.all([
        CommerceMerchantModel.find({
          "whatsappConfig.status": "connected",
          "whatsappConfig.provider": "baileys",
          ownerId: { $nin: ["recurring-test-user", "load-test-user"] }
        }).select("ownerId").lean(),
        WhatsAppConnectionModel.find({
          status: { $in: ["CONNECTED", "connected"] },
          connectionType: "baileys",
          userId: { $nin: ["recurring-test-user", "load-test-user"] }
        }).select("userId").lean(),
        WhatsAppSessionModel.find({
          key: "creds",
          sessionId: { $nin: ["recurring-test-user", "load-test-user"] }
        }).select("sessionId").lean()
      ]);

      const userIdsToBoot = new Set<string>();
      merchants.forEach(m => m.ownerId && userIdsToBoot.add(m.ownerId));
      activeConnections.forEach(c => c.userId && userIdsToBoot.add(c.userId));
      storedCreds.forEach(s => {
        // Exclude temporary session IDs (like onboarding uuid timestamps)
        if (s.sessionId && !s.sessionId.startsWith("auth_") && !s.sessionId.startsWith("temp_")) {
          userIdsToBoot.add(s.sessionId);
        }
      });

      console.log(`[WhatsApp] Found ${userIdsToBoot.size} user sessions with saved WhatsApp auth state to boot.`);

      const bootPromises = Array.from(userIdsToBoot).map(userId => {
        console.log(`[WhatsApp] Auto-reconnecting session for user: ${userId}`);
        return this.initSession(userId).catch(err =>
          console.error(`[WhatsApp] Failed to boot session for ${userId}:`, err)
        );
      });

      await Promise.allSettled(bootPromises);
    } catch (err) {
      console.error("[WhatsApp] Error during bootSessions:", err);
    }
  }

  private async handleConnectionClose(userId: string, lastDisconnect: any) {
    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
    const errMessage = (lastDisconnect?.error as Error)?.message || "";

    console.log(`[WhatsApp Connection Close] User: ${userId}, StatusCode: ${statusCode}, Error: ${errMessage}`);

    // ONLY permanent unlinking / logged out from phone or corrupt credentials
    const isLoggedOut = statusCode === DisconnectReason.loggedOut;
    const isBadSession = statusCode === DisconnectReason.badSession;
    const isReplaced = statusCode === DisconnectReason.connectionReplaced;

    if (isLoggedOut || isBadSession) {
      console.log(`[WhatsApp] Session explicitement déconnectée/invalide pour ${userId}. Nettoyage.`);
      this.activeSessions.delete(userId);
      this.pendingInitializations.delete(userId);
      this.lastPairingCodeMap.delete(userId);
      this.lastQrMap.delete(userId);

      await clearMongoAuthState(userId);

      await CommerceMerchantModel.findOneAndUpdate(
        { ownerId: userId },
        { $set: { "whatsappConfig.status": "disconnected", "whatsappConfig.reconnectAttempts": 0 } }
      );

      await WhatsAppConnectionModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            status: 'DISCONNECTED',
            disconnectedAt: new Date()
          }
        },
        { upsert: true }
      );

      emitToUser(userId, "whatsapp:disconnected", {
        reason: isLoggedOut ? "logged_out" : "bad_session",
        statusCode,
        shouldReconnect: false
      });
      return;
    }

    if (isReplaced) {
      console.log(`[WhatsApp] Session remplacée sur un autre appareil pour ${userId}. Arrêt.`);
      this.activeSessions.delete(userId);
      this.pendingInitializations.delete(userId);
      emitToUser(userId, "whatsapp:disconnected", {
        reason: "connection_replaced",
        statusCode,
        shouldReconnect: false
      });
      return;
    }

    // For all transient network disconnects (connectionClosed, connectionLost, timedOut, restartRequired, etc.):
    // The session credentials in MongoDB REMAIN VALID. Do NOT clear credentials or drop merchant to disconnected.
    console.log(`[WhatsApp] Déconnexion transitoire pour ${userId} (Code ${statusCode}). Reconnexion automatique en tâche de fond...`);
    this.activeSessions.delete(userId);
    this.pendingInitializations.delete(userId);

    // Exponential backoff or rapid auto-reconnect (2s)
    setTimeout(() => {
      this.initSession(userId).catch(err => {
        console.warn(`[WhatsApp] Auto-reconnect attempt in background for ${userId}:`, err?.message || err);
      });
    }, 2000);
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
      this.lastPairingCodeMap.delete(userId);
      this.lastQrMap.delete(userId);

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
          syncFullHistory: false,
          markOnlineOnConnect: true,
          connectTimeoutMs: 60000,
          keepAliveIntervalMs: 25000,
        });

        this.activeSessions.set(userId, sock);

        sock.ev.on("connection.update", async (update) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            this.lastQrMap.set(userId, qr);
            emitToUser(userId, "whatsapp:qr", { qr });
          }

          if (connection === "connecting") {
            emitToUser(userId, "whatsapp:connecting", {});
          }

          if (connection === "open") {
            this.lastPairingCodeMap.delete(userId);
            this.lastQrMap.delete(userId);

            await CommerceMerchantModel.findOneAndUpdate(
              { ownerId: userId },
              {
                $set: {
                  "whatsappConfig.status": "connected",
                  "whatsappConfig.provider": "baileys",
                  "whatsappConfig.reconnectAttempts": 0
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
            await this.handleConnectionClose(userId, lastDisconnect);
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
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    if (!cleanNumber || cleanNumber.length < 6) {
      throw new Error("Numéro WhatsApp invalide pour le jumelage (ex: +225 07 00 00 00 00).");
    }

    // Force-clean any existing socket for fresh pairing
    const existingSock = this.activeSessions.get(userId);
    if (existingSock) {
      try { existingSock.end(undefined); } catch (e) {}
      this.activeSessions.delete(userId);
    }
    this.pendingInitializations.delete(userId);
    this.lastPairingCodeMap.delete(userId);
    this.lastQrMap.delete(userId);

    await clearMongoAuthState(userId);

    const { state, saveCreds } = await useMongoAuthState(userId);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    this.activeSessions.set(userId, sock);

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "connecting") {
        emitToUser(userId, "whatsapp:connecting", {});
      }

      if (connection === "open") {
        this.lastPairingCodeMap.delete(userId);
        this.lastQrMap.delete(userId);

        await CommerceMerchantModel.findOneAndUpdate(
          { ownerId: userId },
          {
            $set: {
              "whatsappConfig.status": "connected",
              "whatsappConfig.provider": "baileys",
              "whatsappConfig.reconnectAttempts": 0,
              "whatsappNumber": cleanNumber
            }
          }
        );

        await WhatsAppConnectionModel.findOneAndUpdate(
          { userId },
          {
            $set: {
              status: 'CONNECTED',
              connectionType: 'baileys',
              phoneNumber: cleanNumber,
              connectedAt: new Date(),
              disconnectedAt: null
            }
          },
          { upsert: true }
        );

        emitToUser(userId, "whatsapp:connected", { phoneNumber: cleanNumber });
        console.log(`[WhatsApp] User ${userId} successfully connected via Pairing Code`);
      }

      if (connection === "close") {
        await this.handleConnectionClose(userId, lastDisconnect);
      }
    });

    sock.ev.on("messages.upsert", async (m) => {
      if (m.type === "notify") {
        for (const msg of m.messages) {
          if (!msg.key.fromMe) {
            await this.handleIncomingMessage(userId, msg);
          }
        }
      }
    });

    // Wait a brief tick for Baileys handshake before requesting code
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (!sock.authState.creds.registered) {
      const rawCode = await sock.requestPairingCode(cleanNumber);
      // Format 8-char code cleanly e.g. "ABCD-1234"
      const formattedCode = rawCode?.match(/.{1,4}/g)?.join("-") || rawCode;
      this.lastPairingCodeMap.set(userId, formattedCode);
      emitToUser(userId, "whatsapp:pairing_code", { code: formattedCode });
      return formattedCode;
    } else {
      throw new Error("L'appareil est déjà enregistré ou connecté.");
    }
  }

  async requestQrCode(userId: string): Promise<string | null> {
    const existingSock = this.activeSessions.get(userId);
    if (existingSock) {
      try { existingSock.end(undefined); } catch (e) {}
      this.activeSessions.delete(userId);
    }
    this.pendingInitializations.delete(userId);
    this.lastPairingCodeMap.delete(userId);
    this.lastQrMap.delete(userId);

    await clearMongoAuthState(userId);

    const { state, saveCreds } = await useMongoAuthState(userId);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    this.activeSessions.set(userId, sock);

    sock.ev.on("creds.update", saveCreds);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(this.lastQrMap.get(userId) || null);
      }, 6000);

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.lastQrMap.set(userId, qr);
          emitToUser(userId, "whatsapp:qr", { qr });
          clearTimeout(timeout);
          resolve(qr);
        }

        if (connection === "connecting") {
          emitToUser(userId, "whatsapp:connecting", {});
        }

        if (connection === "open") {
          this.lastPairingCodeMap.delete(userId);
          this.lastQrMap.delete(userId);

          await CommerceMerchantModel.findOneAndUpdate(
            { ownerId: userId },
            {
              $set: {
                "whatsappConfig.status": "connected",
                "whatsappConfig.provider": "baileys",
                "whatsappConfig.reconnectAttempts": 0
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
          console.log(`[WhatsApp] User ${userId} successfully connected via QR Code`);
        }

        if (connection === "close") {
          await this.handleConnectionClose(userId, lastDisconnect);
        }
      });

      sock.ev.on("messages.upsert", async (m) => {
        if (m.type === "notify") {
          for (const msg of m.messages) {
            if (!msg.key.fromMe) {
              await this.handleIncomingMessage(userId, msg);
            }
          }
        }
      });
    });
  }

  isSessionConnected(userId: string): boolean {
    const sock = this.activeSessions.get(userId);
    return !!(sock && sock.authState?.creds?.registered);
  }

  getSessionPairingData(userId: string) {
    return {
      pairingCode: this.lastPairingCodeMap.get(userId) || null,
      qr: this.lastQrMap.get(userId) || null,
      isActive: this.activeSessions.has(userId)
    };
  }

  private async startOnboardingSocket(
    authSessionId: string,
    cleanNumber: string,
    storeData?: any
  ): Promise<any> {
    const { state, saveCreds, updateSessionId } = await useMongoAuthState(authSessionId);
    const { version } = await fetchLatestBaileysVersion();

    let currentOwnerId: string = authSessionId;

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    this.activeSessions.set(authSessionId, sock);
    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.lastQrMap.set(authSessionId, qr);
        emitToSession(authSessionId, "whatsapp:qr", { qr });
        emitToAuth(cleanNumber, "whatsapp:qr", { qr });
        emitToAuth(authSessionId, "whatsapp:qr", { qr });
      }

      if (connection === "connecting") {
        emitToSession(authSessionId, "whatsapp:connecting", {});
        emitToAuth(cleanNumber, "whatsapp:connecting", {});
        emitToAuth(authSessionId, "whatsapp:connecting", {});
      }

      if (connection === "open") {
        this.lastPairingCodeMap.delete(authSessionId);
        console.log(`[WhatsApp Onboarding] Pairing successful for session ${authSessionId}`);

        try {
          // Dynamic import to avoid circular dependency
          const { authService } = await import("../auth/auth.service.js");

          // 1. Extract physical connected WhatsApp phone number
          const rawJid = sock.user?.id || "";
          const rawPhone = rawJid.split("@")[0].split(":")[0].replace(/\D/g, "") || cleanNumber;
          const parsedPaired = parsePhoneNumber(rawPhone, "CI");
          const pairedPhone = parsedPaired.e164 ? parsedPaired.e164.replace(/\D/g, "") : rawPhone;

          // 2. Create or login the merchant user
          const sessionData = await authService.loginOrRegisterWithWhatsApp(
            pairedPhone,
            storeData?.businessName || storeData?.displayName
          );
          const userId = sessionData.user.id;
          currentOwnerId = userId;

          // 3. Migrate Mongo auth state from temporary authSessionId to actual userId
          await migrateMongoAuthState(authSessionId, userId);
          updateSessionId(userId);
          await saveCreds();

          // 4. Move active socket to userId in memory
          this.activeSessions.delete(authSessionId);
          this.activeSessions.set(userId, sock);

          // 5. Initialize or update Commerce Merchant profile
          await CommerceMerchantModel.findOneAndUpdate(
            { ownerId: userId },
            {
              $set: {
                "whatsappConfig.status": "connected",
                "whatsappConfig.provider": "baileys",
                "whatsappConfig.reconnectAttempts": 0,
                whatsappNumber: pairedPhone,
                ...(storeData?.businessName ? {
                  businessName: storeData.businessName,
                  category: storeData.category || "other",
                  description: storeData.description || "",
                  city: storeData.city || "",
                  address: storeData.address || "",
                  country: storeData.country || "CI",
                  currency: storeData.currency || "XOF",
                  onboardingCompleted: true
                } : {})
              }
            },
            { upsert: true, new: true }
          );

          await WhatsAppConnectionModel.findOneAndUpdate(
            { userId },
            {
              $set: {
                status: 'CONNECTED',
                connectionType: 'baileys',
                phoneNumber: pairedPhone,
                connectedAt: new Date(),
                disconnectedAt: null
              }
            },
            { upsert: true }
          );

          // 6. Register authenticated session so polling & sockets both catch it
          authService.registerAuthenticatedSession(authSessionId, pairedPhone, sessionData);

          // 7. Emit real-time auth:success & whatsapp:connected
          const io = getSocketServer();
          if (io) {
            io.to(`session:${authSessionId}`).emit("auth:success", sessionData);
            io.to(`auth:${authSessionId}`).emit("auth:success", sessionData);
            io.to(`auth:${cleanNumber}`).emit("auth:success", sessionData);
            io.to(`auth:${pairedPhone}`).emit("auth:success", sessionData);
            io.to(`user:${userId}`).emit("whatsapp:connected", { phoneNumber: pairedPhone });
          }

          // 8. Wire message processing for this newly connected user
          sock.ev.on("messages.upsert", async (m: any) => {
            if (m.type === "notify") {
              for (const msg of m.messages) {
                if (!msg.key.fromMe) {
                  await this.handleIncomingMessage(userId, msg);
                }
              }
            }
          });

          console.log(`[WhatsApp Onboarding] Merchant ${userId} (${pairedPhone}) fully initialized and logged in.`);
        } catch (err: any) {
          console.error("[WhatsApp Onboarding] Error completing auto-auth after pairing:", err);
        }
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errMessage = (lastDisconnect?.error as Error)?.message || "";
        console.log(`[WhatsApp Onboarding Close] Session: ${currentOwnerId}, StatusCode: ${statusCode}, Error: ${errMessage}`);

        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const isBadSession = statusCode === DisconnectReason.badSession;

        if (isLoggedOut || isBadSession) {
          this.activeSessions.delete(currentOwnerId);
          this.activeSessions.delete(authSessionId);
          await clearMongoAuthState(authSessionId);
          if (currentOwnerId !== authSessionId) {
            await clearMongoAuthState(currentOwnerId);
          }
          return;
        }

        // If session was already established with userId, delegate to handleConnectionClose
        if (currentOwnerId !== authSessionId) {
          await this.handleConnectionClose(currentOwnerId, lastDisconnect);
          return;
        }

        // Transient disconnect during pairing handshake (e.g. 515 restart required)
        console.log(`[WhatsApp Onboarding] Restarting connection for ${authSessionId} to finalize pairing handshake (Code ${statusCode})...`);
        this.activeSessions.delete(authSessionId);
        setTimeout(() => {
          this.startOnboardingSocket(authSessionId, cleanNumber, storeData).catch(err => {
            console.error(`[WhatsApp Onboarding] Reconnection failed for ${authSessionId}:`, err);
          });
        }, 1500);
      }
    });

    return sock;
  }

  async requestOnboardingPairingCode(
    authSessionId: string,
    phoneNumber: string,
    storeData?: any
  ): Promise<{ pairingCode: string; qr?: string | null; authSessionId: string }> {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    if (!cleanNumber || cleanNumber.length < 6) {
      throw new Error("Numéro WhatsApp invalide pour l'appairage.");
    }

    // Force-clean any existing socket for this authSessionId
    const existingSock = this.activeSessions.get(authSessionId);
    if (existingSock) {
      try { existingSock.end(undefined); } catch (e) {}
      this.activeSessions.delete(authSessionId);
    }
    this.pendingInitializations.delete(authSessionId);
    this.lastPairingCodeMap.delete(authSessionId);

    await clearMongoAuthState(authSessionId);

    const sock = await this.startOnboardingSocket(authSessionId, cleanNumber, storeData);

    // Wait a brief tick for Baileys handshake before requesting code
    await new Promise((resolve) => setTimeout(resolve, 1400));

    if (!sock.authState.creds.registered) {
      const rawCode = await sock.requestPairingCode(cleanNumber);
      const formattedCode = rawCode?.match(/.{1,4}/g)?.join("-") || rawCode;
      this.lastPairingCodeMap.set(authSessionId, formattedCode);

      emitToSession(authSessionId, "whatsapp:pairing_code", { code: formattedCode });
      emitToAuth(cleanNumber, "whatsapp:pairing_code", { code: formattedCode });
      emitToAuth(authSessionId, "whatsapp:pairing_code", { code: formattedCode });

      return {
        pairingCode: formattedCode,
        qr: this.lastQrMap.get(authSessionId) || null,
        authSessionId
      };
    } else {
      throw new Error("L'appareil est déjà enregistré ou connecté.");
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

    // Reverse WhatsApp Auth Interception (Baileys)
    if (text) {
      try {
        const { authService } = await import("../auth/auth.service.js");
        const cleanFrom = from.replace(/@.*$/, "").replace(/\D/g, "");
        const authResult = await authService.authenticateViaIncomingMessage(cleanFrom, text);
        if (authResult.success || (authResult as any).mismatch) {
          if (authResult.success) {
            console.log(`[Baileys WhatsApp] Authenticated user ${cleanFrom} via incoming message.`);
          } else {
            console.warn(`[Baileys WhatsApp] Auth mismatch for user ${cleanFrom} via incoming message.`);
          }
          if (authResult.replyMessage) {
            const sock = this.activeSessions.get(userId);
            if (sock) {
              await sock.sendMessage(from, { text: authResult.replyMessage }).catch((e: any) => console.error("[Baileys WhatsApp] Auth reply failed:", e));
            }
          }
          return;
        }
      } catch (authErr) {
        console.warn("[Baileys WhatsApp] Auth check error during incoming message:", authErr);
      }
    }

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

    // --- 1. CHECK HUMAN TAKEOVER ---
    if (conversation.status === "needs_human") {
      console.log(`[WhatsApp] Skipping AI for conversation ${conversation._id} (Status: needs_human)`);
      return;
    }

    // --- 2. CHECK SUBSCRIPTION (MODE DÉCOUVERTE) ---
    // If merchant has no active subscription (unpaid), AI is locked on WhatsApp so merchant maintains 100% manual control
    const isFounder = isFounderNumber(merchant.whatsappNumber || merchant.phone || "") || (merchant.ownerId && isFounderNumber(merchant.ownerId));
    let isSubscriptionActive = merchant.subscription?.status === "active" || isFounder;
    if (!isSubscriptionActive) {
      const sub = await SubscriptionModel.findOne({ userId });
      if (sub && sub.status === "active") {
        isSubscriptionActive = true;
      }
    }
    if (!isSubscriptionActive) {
      console.log(`[WhatsApp] Mode Découverte: AI locked on WhatsApp for unpaid merchant "${merchant.businessName}". Conversations remain 100% manual.`);
      return;
    }

    // --- 3. CHECK PAUSE MODE ---
    if (merchant.aiSettings?.autoReply === false) {
      console.log(`[WhatsApp] Mode Pause: AI autoReply is disabled for merchant "${merchant.businessName}". Manual handling.`);
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
    if (env.AI_MOCK_MODE) {
      console.log(`[AI_MOCK_MODE] Skip Meta Message to ${to}: ${text.substring(0, 50)}...`);
      return;
    }
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
    if (env.AI_MOCK_MODE) {
      console.log(`[AI_MOCK_MODE] Skip Auth Magic Link to ${to}. Code: ${otpCode}, URL: ${loginUrl}`);
      return;
    }
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
    const text = `✨ *Connexion Vendeur IA*\n\nPour accéder directement à votre boutique :\n\n🔗 *Accéder à votre boutique :*\n${loginUrl}\n\n🔢 *Code de vérification :* *${otpCode}*\n\n💡 _Cliquez sur le lien ou saisissez directement votre code._`;

    // If attempting to send to the system number itself, Meta rejects self-messaging.
    // Forward the notification to founder backup phone (2250102273966)
    const isSelfSystemNumber = cleanTo.endsWith("0505111157") || cleanTo.endsWith("05111157");
    const targetRecipient = isSelfSystemNumber ? "2250102273966" : cleanTo;

    try {
      await axios.post(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: targetRecipient,
          type: "text",
          text: { 
            body: isSelfSystemNumber 
              ? `👑 *[Accès Co-Fondateur Vendeur IA]*\nConnexion initiée pour le compte système *${cleanTo}*.\n\nCode de vérification : *${otpCode}*\nLien direct : ${loginUrl}`
              : text 
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`[WhatsApp Auth] Magic Link sent to ${targetRecipient} (Original: ${to})`);
    } catch (error: any) {
      console.error("[WhatsApp Auth] Failed to send Magic Link:", error.response?.data || error.message);
      if (!isSelfSystemNumber) {
        throw new Error("Échec de l'envoi du message WhatsApp. Vérifiez que votre numéro est correct.");
      }
    }
  }

  async sendMetaAudio(merchant: any, to: string, audioBuffer: Buffer) {
    if (env.AI_MOCK_MODE) {
      console.log(`[AI_MOCK_MODE] Skip Meta Audio to ${to}`);
      return;
    }
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

  async handleMetaIncomingMessage(from: string, text: string, phoneId: string, media?: { mediaId: string, mediaType: string }, messageId?: string) {
    // 0. Deduplication to prevent processing retries or duplicate webhook events
    const cleanPhone = from ? from.replace(/[\s\-\+\(\)]/g, "") : "";
    const dedupKey = messageId ? `wamid:${messageId}` : `${cleanPhone}:${phoneId || ""}:${text || ""}:${Math.floor(Date.now() / 3000)}`;

    if (this.processedMessageIds.has(dedupKey)) {
      console.log(`[Meta WhatsApp] Duplicate incoming message ignored: ${dedupKey}`);
      return;
    }
    this.processedMessageIds.add(dedupKey);

    if (this.processedMessageIds.size > 2000) {
      const firstItems = Array.from(this.processedMessageIds).slice(0, 500);
      firstItems.forEach(k => this.processedMessageIds.delete(k));
    }

    // 1. Intercept Reverse WhatsApp Auth (Direct Click-to-WhatsApp Login)
    try {
      const { authService } = await import("../auth/auth.service.js");
      const authResult = await authService.authenticateViaIncomingMessage(from, text);
      if (authResult.success || (authResult as any).mismatch) {
        if (authResult.success) {
          console.log(`[Meta WhatsApp] Authenticated user ${from} via incoming message.`);
        } else {
          console.warn(`[Meta WhatsApp] Auth mismatch for user ${from} via incoming message.`);
        }
        
        // Send confirmation or mismatch reply back to user (24h window is open now!)
        const settings = await SystemSettingsModel.findOne();
        const config = settings?.metaConfig?.whatsappDefaults;
        const accessToken = config?.accessToken || env.WHATSAPP_ACCESS_TOKEN;
        const activePhoneId = phoneId || config?.phoneNumberId || env.WHATSAPP_PHONE_ID;

        if (accessToken && activePhoneId && authResult.replyMessage) {
          await axios.post(
            `https://graph.facebook.com/v20.0/${activePhoneId}/messages`,
            {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: from.replace(/\+/g, ""),
              type: "text",
              text: { body: authResult.replyMessage },
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          ).catch(err => console.error("[Meta WhatsApp] Error sending auth confirmation reply:", err.message));
        }

        // Return immediately so we don't treat this as an e-commerce sale
        return;
      }
    } catch (authErr) {
      console.warn("[Meta WhatsApp] Auth check error during incoming message:", authErr);
    }

    // 1. Find the merchant associated with this Phone ID (Dedicated number) or phone/whatsappNumber
    const phoneVariants = phoneId ? generatePhoneVariants(phoneId) : [];
    let merchant = await CommerceMerchantModel.findOne({
      $or: [
        { "whatsappConfig.meta.phoneNumberId": phoneId },
        { "whatsappConfig.phoneNumberId": phoneId },
        { whatsappNumber: phoneId },
        { phone: phoneId },
        { whatsappNumber: `+${phoneId}` },
        ...(phoneVariants.length > 0 ? [{ whatsappNumber: { $in: phoneVariants } }, { phone: { $in: phoneVariants } }] : [])
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

  async getSessionStatus(userId: string): Promise<string> {
    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    const connection = await WhatsAppConnectionModel.findOne({ userId });

    const isConnected =
      merchant?.whatsappConfig?.status === "connected" ||
      connection?.status === "CONNECTED" ||
      (merchant?.whatsappConfig?.provider === "meta" && Boolean(merchant?.whatsappConfig?.meta?.phoneNumberId));

    if (isConnected) {
      return "connected";
    }

    const session = this.activeSessions.get(userId);
    if (session && session.user) {
      return "connected";
    }

    if (connection?.status === "CONNECTING") {
      return "connecting";
    }

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
    this.lastPairingCodeMap.delete(userId);
    this.lastQrMap.delete(userId);

    await clearMongoAuthState(userId);

    await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: userId },
      { $set: { "whatsappConfig.status": "disconnected" } }
    );

    await WhatsAppConnectionModel.findOneAndUpdate(
      { userId },
      { $set: { status: "DISCONNECTED", disconnectedAt: new Date() } },
      { upsert: true }
    );
  }
}

export const whatsappService = new WhatsAppService();
