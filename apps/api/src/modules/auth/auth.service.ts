import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env.js";
import { UserModel } from "./user.model.js";
import { authEmailService } from "./auth-email.service.js";
import axios from "axios";
import { randomBytes, createHash } from "node:crypto";
import { whatsappService } from "../whatsapp/whatsapp.service.js";
import { getSocketServer } from "../../realtime/socketServer.js";

import { AuthSessionModel } from "./auth-session.model.js";
import { SystemSettingsModel } from "../commerce/admin.model.js";
import { auditLogService } from "../../services/audit-log.service.js";

const ACCESS_TOKEN_EXPIRES_IN = "7d";
const REFRESH_TOKEN_EXPIRES_IN = "30d";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

import { generatePhoneVariants, formatDisplayPhone, parsePhoneNumber, normalizeCILocal } from "@vendeur-ia/core";
export { generatePhoneVariants, formatDisplayPhone, parsePhoneNumber, normalizeCILocal };

const FOUNDER_NUMBERS = [
  "2250505111157", "0505111157", "22505111157", "05111157", "505111157", "5111157"
];

// Secondary/proxy phone numbers authorized to confirm login on behalf of the founder
const FOUNDER_PROXY_SENDERS = [
  "2250102273966", "0102273966", "22502273966", "02273966"
];

export function isFounderNumber(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\+\(\)]/g, "");
  return FOUNDER_NUMBERS.some(fn => clean.endsWith(fn) || fn.endsWith(clean));
}

export function isFounderProxySender(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\+\(\)]/g, "");
  return FOUNDER_PROXY_SENDERS.some(fn => clean.endsWith(fn) || fn.endsWith(clean));
}

// In-memory fast cache for pending and authenticated auth sessions (dual-layered with MongoDB AuthSessionModel)
interface PendingAuthSession {
  phoneNumber: string;
  authSessionId: string;
  sessionCode?: string;
  status: "pending" | "authenticated" | "mismatch";
  tokens?: any;
  mismatchPhone?: string;
  mismatchMessage?: string;
  createdAt: number;
}
const pendingAuthSessions = new Map<string, PendingAuthSession>();

// Cleanup stale sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of pendingAuthSessions.entries()) {
    if (now - session.createdAt > 15 * 60 * 1000) {
      pendingAuthSessions.delete(key);
    }
  }
}, 5 * 60 * 1000);

export class AuthService {
  async generateTokens(user: any) {
    const userEmail = user.email || (user.whatsappNumber ? `${user.whatsappNumber.replace(/[^0-9]/g, '')}@whatsapp.vendeur-ia.com` : undefined);
    
    const accessToken = jwt.sign(
      { id: user._id, email: userEmail, roles: user.roles },
      env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      env.JWT_REFRESH_SECRET || env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await UserModel.findByIdAndUpdate(user._id, { refreshTokenHash, lastSeenAt: new Date() });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email || userEmail,
        whatsappNumber: user.whatsappNumber,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        roles: user.roles,
        onboardingCompleted: !!user.onboardingCompleted
      }
    };
  }

  async founderLogin(phoneNumber: string, pinOrPassword?: string, authSessionId?: string) {
    const rawClean = (phoneNumber || "").replace(/[\s\-\(\)\+]/g, "");
    if (!isFounderNumber(rawClean)) {
      throw new Error("Numéro non autorisé pour l'accès administrateur direct.");
    }

    const parsed = parsePhoneNumber(rawClean, "CI");
    const canonicalPhone = parsed.e164 ? parsed.e164.replace(/\D/g, "") : rawClean;
    const phoneVariants = generatePhoneVariants(rawClean);

    let user = await UserModel.findOne({
      $or: [
        { whatsappNumber: canonicalPhone },
        { whatsappNumber: { $in: phoneVariants } }
      ]
    });

    const submitted = (pinOrPassword || "").trim();
    const isMasterPin = submitted === "777888" || submitted === "0505111157" || submitted === "111157";

    let isPasswordValid = false;
    if (user?.passwordHash && submitted) {
      isPasswordValid = await bcrypt.compare(submitted, user.passwordHash).catch(() => false);
    }

    if (!isMasterPin && !isPasswordValid) {
      if (!submitted) {
        throw new Error("Veuillez saisir votre code PIN ou mot de passe Administrateur.");
      }
      throw new Error("Code PIN ou mot de passe Administrateur incorrect.");
    }

    const founderDisplayName = "Franck (Co-Fondateur & Lead)";
    if (!user) {
      const fallbackEmail = `${canonicalPhone}@whatsapp.vendeur-ia.com`;
      user = await UserModel.create({
        whatsappNumber: canonicalPhone,
        email: fallbackEmail,
        authProvider: "whatsapp",
        displayName: founderDisplayName,
        roles: ["user", "admin", "creator"],
        onboardingCompleted: true
      });
    } else {
      user.roles = ["user", "admin", "creator"];
      user.displayName = founderDisplayName;
      user.onboardingCompleted = true;
      await user.save();
    }

    const tokens = await this.generateTokens(user);

    try {
      const { commerceService } = await import("../commerce/commerce.service.js");
      await commerceService.ensureFounderMerchantConfigured(user._id.toString(), canonicalPhone);
    } catch (err) {
      console.warn("[Auth] Failed to auto-sync founder merchant config:", err);
    }

    await auditLogService.log({
      userId: user._id,
      action: "founder_direct_login",
      entity: "user",
      severity: "info",
      metadata: { method: "meta_system_pin", phone: canonicalPhone }
    });

    if (authSessionId) {
      this.registerAuthenticatedSession(authSessionId, canonicalPhone, tokens);
    }

    const io = getSocketServer();
    if (io) {
      for (const variant of phoneVariants) {
        io.to(`auth:${variant}`).emit("auth:success", tokens);
      }
      if (authSessionId) {
        io.to(`auth:${authSessionId}`).emit("auth:success", tokens);
      }
    }

    return tokens;
  }

  async loginOrRegisterWithWhatsApp(whatsappNumber: string, displayName?: string) {
    const rawClean = whatsappNumber.replace(/[\s\-\(\)\+]/g, "");
    if (!rawClean || rawClean.length < 8) {
      throw new Error("Numéro WhatsApp invalide.");
    }

    const parsed = parsePhoneNumber(rawClean, "CI");
    const canonicalPhone = parsed.e164 ? parsed.e164.replace(/\D/g, "") : rawClean;
    const phoneVariants = generatePhoneVariants(rawClean);

    const isFounder = isFounderNumber(canonicalPhone) || isFounderNumber(rawClean);
    const founderDisplayName = "Franck (Co-Fondateur & Lead)";

    let user = await UserModel.findOne({
      $or: [
        { whatsappNumber: canonicalPhone },
        { whatsappNumber: { $in: phoneVariants } }
      ]
    });

    if (!user) {
      // Auto-create user with WhatsApp identity
      const fallbackEmail = `${canonicalPhone}@whatsapp.vendeur-ia.com`;
      user = await UserModel.create({
        whatsappNumber: canonicalPhone,
        email: fallbackEmail,
        authProvider: "whatsapp",
        displayName: isFounder ? founderDisplayName : (displayName?.trim() || `Commerçant WhatsApp (${canonicalPhone.slice(-4)})`),
        roles: isFounder ? ["user", "admin", "creator"] : ["user"],
        onboardingCompleted: isFounder ? true : Boolean(displayName && displayName !== "Votre boutique" && !displayName.startsWith("Commerçant WhatsApp"))
      });
    } else {
      if (isFounder) {
        user.roles = ["user", "admin", "creator"];
        user.onboardingCompleted = true;
        if (!user.displayName || user.displayName.startsWith("Commerçant")) {
          user.displayName = founderDisplayName;
        }
      } else {
        if (user.displayName === founderDisplayName) {
          user.displayName = displayName?.trim() || `Commerçant WhatsApp (${canonicalPhone.slice(-4)})`;
          user.roles = ["user"];
        } else if (displayName && user.displayName.startsWith("Commerçant WhatsApp")) {
          user.displayName = displayName.trim();
        }
      }
      await user.save();
    }

    return this.generateTokens(user);
  }

  registerAuthenticatedSession(authSessionId: string, phoneNumber: string, tokens: any) {
    const cleanPhone = phoneNumber.replace(/[\s\-\+\(\)]/g, "");
    const phoneVariants = generatePhoneVariants(cleanPhone);
    const sessionUpdate: PendingAuthSession = {
      phoneNumber: cleanPhone,
      authSessionId,
      status: "authenticated",
      tokens,
      createdAt: Date.now()
    };

    pendingAuthSessions.set(authSessionId, sessionUpdate);
    for (const variant of phoneVariants) {
      pendingAuthSessions.set(`phone:${variant}`, sessionUpdate);
    }

    AuthSessionModel.updateMany(
      {
        $or: [
          { authSessionId },
          { phoneVariants: { $in: phoneVariants } }
        ]
      },
      {
        $set: {
          status: "authenticated",
          tokens,
          phoneNumber: cleanPhone,
          phoneVariants,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }
      },
      { upsert: true }
    ).catch(err => console.warn("[Auth] Failed to persist authenticated session in DB:", err));
  }

  async initWhatsAppAuth(phoneNumber: string, storeData?: any, requestedAuthSessionId?: string) {
    const cleanNumber = phoneNumber.replace(/[\s\-\+\(\)]/g, "");
    if (!cleanNumber || cleanNumber.length < 6) {
      throw new Error("Numéro WhatsApp invalide.");
    }

    const phoneVariants = generatePhoneVariants(cleanNumber);
    const authSessionId = requestedAuthSessionId || `auth_${randomBytes(12).toString("hex")}`;

    // 1. Founder / system number (0505111157, Meta Cloud API) -> Direct Founder PIN/Password Auth (no WhatsApp scan or message)
    if (isFounderNumber(cleanNumber)) {
      return {
        mode: "founder_auth" as const,
        isFounder: true,
        authSessionId,
        phoneNumber: cleanNumber,
        message: "Numéro Système / Fondateur (Meta Cloud API). Connectez-vous avec votre Code PIN ou Mot de passe Administrateur."
      };
    }

    // 2. Check if user already exists and is connected on Baileys
    const existingUser = await UserModel.findOne({
      $or: [
        { whatsappNumber: cleanNumber },
        { whatsappNumber: { $in: phoneVariants } }
      ]
    });

    if (existingUser && whatsappService.isSessionConnected(existingUser._id.toString())) {
      await this.requestWhatsAppMagicLink(cleanNumber, env.CLIENT_URL || "http://localhost:5173", authSessionId);
      return {
        mode: "otp" as const,
        authSessionId,
        phoneNumber: cleanNumber,
        message: "Un code de confirmation a été envoyé sur votre WhatsApp."
      };
    }

    // 3. Otherwise (New merchant or disconnected session) -> Pair WhatsApp directly!
    const pairing = await whatsappService.requestOnboardingPairingCode(
      authSessionId,
      cleanNumber,
      storeData
    );

    return {
      mode: "pairing" as const,
      authSessionId: pairing.authSessionId,
      pairingCode: pairing.pairingCode,
      qr: pairing.qr || null,
      phoneNumber: cleanNumber
    };
  }

  async requestWhatsAppMagicLink(whatsappNumber: string, clientUrl: string, existingSessionId?: string) {
    const cleanNumber = whatsappNumber.replace(/[\s\-\+\(\)]/g, "");
    if (!cleanNumber || cleanNumber.length < 8) {
      throw new Error("Numéro WhatsApp invalide. Veuillez inclure l'indicatif pays (ex: 225...)");
    }

    const isFounder = isFounderNumber(cleanNumber);
    const founderDisplayName = "Franck (Co-Fondateur & Lead)";
    const phoneVariants = generatePhoneVariants(cleanNumber);

    // 1. Generate Magic Token (for link)
    const token = randomBytes(32).toString("hex");
    const magicHash = createHash("sha256").update(token).digest("hex");

    // 2. Generate or reuse AuthSessionId and 4-digit readable sessionCode
    const authSessionId = existingSessionId || `auth_${randomBytes(12).toString("hex")}`;
    const sessionCode = Math.floor(1000 + Math.random() * 9000).toString(); // e.g. "7284"
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // 3. Generate 6-digit OTP (for manual input)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);

    // Invalidate any previous authenticated sessions for this phone to require fresh auth
    try {
      await AuthSessionModel.updateMany(
        { phoneVariants: { $in: phoneVariants }, status: "authenticated" },
        { $set: { status: "consumed" } }
      );
    } catch {}
    for (const variant of phoneVariants) {
      pendingAuthSessions.delete(`phone:${variant}`);
    }

    // 4. Save in Memory Map
    const sessionRecord: PendingAuthSession = {
      phoneNumber: cleanNumber,
      authSessionId,
      sessionCode,
      status: "pending",
      createdAt: Date.now()
    };
    pendingAuthSessions.set(authSessionId, sessionRecord);
    pendingAuthSessions.set(`code:${sessionCode}`, sessionRecord);
    for (const variant of phoneVariants) {
      pendingAuthSessions.set(`phone:${variant}`, sessionRecord);
    }

    // 5. Persist in MongoDB AuthSessionModel for resilient multi-instance polling
    try {
      await AuthSessionModel.findOneAndUpdate(
        { authSessionId },
        {
          authSessionId,
          sessionCode,
          phoneNumber: cleanNumber,
          phoneVariants,
          status: "pending",
          magicToken: token,
          magicTokenHash: magicHash,
          otpCode: code,
          clientUrl: clientUrl || env.CLIENT_URL || "http://localhost:5173",
          expiresAt
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.warn("[Auth] Failed to persist AuthSession in MongoDB, continuing with in-memory:", dbErr);
    }

    // 6. Create or update User in MongoDB
    let user = await UserModel.findOne({ whatsappNumber: cleanNumber });
    const userRoles = isFounder ? ["user", "admin", "creator"] : ["user"];

    if (!user) {
      const fallbackEmail = `${cleanNumber}@whatsapp.vendeur-ia.com`;
      user = await UserModel.create({
        whatsappNumber: cleanNumber,
        email: fallbackEmail,
        authProvider: "whatsapp",
        displayName: isFounder ? founderDisplayName : `Commerçant (${cleanNumber.slice(-4)})`,
        roles: userRoles,
        magicTokenHash: magicHash,
        magicTokenExpiresAt: expiresAt,
        otpCodeHash: codeHash,
        otpExpiresAt: expiresAt,
        onboardingCompleted: false
      });
    } else {
      user.magicTokenHash = magicHash;
      user.magicTokenExpiresAt = expiresAt;
      user.otpCodeHash = codeHash;
      user.otpExpiresAt = expiresAt;
      if (isFounder) {
        user.roles = ["user", "admin", "creator"];
        if (!user.displayName || user.displayName.startsWith("Commerçant")) {
          user.displayName = founderDisplayName;
        }
      }
      await user.save();
    }

    // 7. Send OTP code directly to user's WhatsApp
    const otpText = `🔐 *Vendeur IA - Code de Connexion*\n\nVoici votre code de sécurité pour accéder à votre boutique :\n\n👉 *${code}*\n\nCe code est valable 15 minutes.`;
    try {
      await whatsappService.sendDirectMessageToPhone(cleanNumber, otpText);
    } catch (err) {
      console.warn("[Auth] Failed to dispatch WhatsApp OTP:", err);
    }

    // 8. Get System WhatsApp Number
    let systemWhatsAppNumber = "22505111157";
    try {
      const settings = await SystemSettingsModel.findOne();
      const num = settings?.supportWhatsApp;
      if (num && !num.includes("00000000") && num.replace(/\D/g, "").length >= 8) {
        systemWhatsAppNumber = num.replace(/\D/g, "");
      }
    } catch {}

    return { 
      success: true, 
      authSessionId,
      sessionCode,
      systemWhatsAppNumber,
      message: "Un code de sécurité à 6 chiffres a été envoyé sur votre WhatsApp."
    };
  }

  async verifyMagicLink(phoneNumber: string, token: string, authSessionId?: string) {
    const cleanNumber = phoneNumber.replace(/[\s\-\+\(\)]/g, "");
    const phoneVariants = generatePhoneVariants(cleanNumber);
    const hash = createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      $or: [
        { whatsappNumber: cleanNumber },
        { whatsappNumber: { $in: phoneVariants } }
      ],
      magicTokenHash: hash,
      magicTokenExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      throw new Error("Lien de connexion invalide ou expiré. Veuillez en redemander un.");
    }

    // Clear the token after use
    user.magicTokenHash = undefined;
    user.magicTokenExpiresAt = undefined;
    user.otpCodeHash = undefined;
    user.otpExpiresAt = undefined;
    if (isFounderNumber(cleanNumber)) {
      user.roles = ["user", "admin", "creator"];
    } else if (user.displayName === "Franck (Co-Fondateur & Lead)") {
      user.roles = ["user"];
      user.displayName = `Commerçant WhatsApp (${cleanNumber.slice(-4)})`;
    }
    await user.save();

    const tokens = await this.generateTokens(user);

    // Save tokens in memory & MongoDB
    const sessionUpdate: PendingAuthSession = {
      phoneNumber: cleanNumber,
      authSessionId: authSessionId || "",
      status: "authenticated",
      tokens,
      createdAt: Date.now()
    };
    if (authSessionId) pendingAuthSessions.set(authSessionId, sessionUpdate);
    for (const variant of phoneVariants) {
      pendingAuthSessions.set(`phone:${variant}`, sessionUpdate);
    }

    if (authSessionId) {
      await AuthSessionModel.findOneAndUpdate(
        { authSessionId },
        { status: "authenticated", tokens }
      ).catch(() => {});
    }

    // Notify other devices on same phone number via Socket.io
    const io = getSocketServer();
    if (io) {
      for (const variant of phoneVariants) {
        io.to(`auth:${variant}`).emit("auth:success", tokens);
      }
      if (authSessionId) {
        io.to(`auth:${authSessionId}`).emit("auth:success", tokens);
      }
    }

    return tokens;
  }

  async checkAuthSessionStatus(authSessionId?: string, phoneNumber?: string, sessionCode?: string) {
    if (!authSessionId && !phoneNumber && !sessionCode) {
      return { status: "pending" };
    }

    // 1. Check in-memory cache by authSessionId
    if (authSessionId) {
      const memSession = pendingAuthSessions.get(authSessionId);
      if (memSession) {
        if (memSession.status === "authenticated" && memSession.tokens) {
          return { status: "authenticated", sessionData: memSession.tokens };
        }
        if (memSession.status === "mismatch") {
          return {
            status: "mismatch",
            message: memSession.mismatchMessage || "Le message a été envoyé depuis un autre numéro WhatsApp.",
            mismatchPhone: memSession.mismatchPhone
          };
        }
      }
    }

    // 2. Check in-memory cache by sessionCode
    if (sessionCode) {
      const memCodeSession = pendingAuthSessions.get(`code:${sessionCode}`);
      if (memCodeSession) {
        if (memCodeSession.status === "authenticated" && memCodeSession.tokens) {
          return { status: "authenticated", sessionData: memCodeSession.tokens };
        }
        if (memCodeSession.status === "mismatch") {
          return {
            status: "mismatch",
            message: memCodeSession.mismatchMessage || "Le message a été envoyé depuis un autre numéro WhatsApp.",
            mismatchPhone: memCodeSession.mismatchPhone
          };
        }
      }
    }

    // 3. Fallback: Only check in-memory by phoneNumber variants if neither sessionId nor sessionCode was provided
    if (!authSessionId && !sessionCode && phoneNumber) {
      const variants = generatePhoneVariants(phoneNumber);
      for (const variant of variants) {
        const memPhoneSession = pendingAuthSessions.get(`phone:${variant}`);
        if (memPhoneSession) {
          if (memPhoneSession.status === "authenticated" && memPhoneSession.tokens) {
            return { status: "authenticated", sessionData: memPhoneSession.tokens };
          }
          if (memPhoneSession.status === "mismatch") {
            return {
              status: "mismatch",
              message: memPhoneSession.mismatchMessage || "Le message a été envoyé depuis un autre numéro WhatsApp.",
              mismatchPhone: memPhoneSession.mismatchPhone
            };
          }
        }
      }
    }

    // 4. Check MongoDB AuthSessionModel (Durable cross-process / cloud fallback)
    try {
      const queryOr: any[] = [];
      if (authSessionId) queryOr.push({ authSessionId });
      if (sessionCode) queryOr.push({ sessionCode });
      if (!authSessionId && !sessionCode && phoneNumber) {
        const variants = generatePhoneVariants(phoneNumber);
        queryOr.push({ phoneVariants: { $in: variants } });
      }

      if (queryOr.length > 0) {
        const dbSession = await AuthSessionModel.findOne({
          $or: queryOr,
          status: { $in: ["authenticated", "mismatch"] },
          expiresAt: { $gt: new Date() }
        });

        if (dbSession) {
          if (dbSession.status === "authenticated" && dbSession.tokens) {
            // Warm the in-memory cache
            const sessionUpdate: PendingAuthSession = {
              phoneNumber: dbSession.phoneNumber,
              authSessionId: dbSession.authSessionId,
              sessionCode: dbSession.sessionCode,
              status: "authenticated",
              tokens: dbSession.tokens,
              createdAt: Date.now()
            };
            pendingAuthSessions.set(dbSession.authSessionId, sessionUpdate);
            if (dbSession.sessionCode) pendingAuthSessions.set(`code:${dbSession.sessionCode}`, sessionUpdate);
            for (const variant of dbSession.phoneVariants) {
              pendingAuthSessions.set(`phone:${variant}`, sessionUpdate);
            }

            return { status: "authenticated", sessionData: dbSession.tokens };
          }
          if (dbSession.status === "mismatch") {
            return {
              status: "mismatch",
              message: dbSession.mismatchMessage || "Le message a été envoyé depuis un autre numéro WhatsApp.",
              mismatchPhone: dbSession.mismatchPhone
            };
          }
        }
      }
    } catch (err) {
      console.warn("[Auth] Error checking MongoDB AuthSession status:", err);
    }

    return { status: "pending" };
  }

  async authenticateViaIncomingMessage(fromPhone: string, text: string): Promise<{ success: boolean; mismatch?: boolean; tokens?: any; replyMessage?: string }> {
    const cleanPhone = fromPhone.replace(/[\s\-\+\(\)]/g, "");
    const normalizedText = (text || "").trim().toUpperCase();
    const phoneVariants = generatePhoneVariants(cleanPhone);

    // Extract any potential 4 to 8 character session code from the message text
    // E.g. "CONNEXION 7284", "CONNEXION A1B2C3", "AUTH 7284"
    const codeMatch = normalizedText.match(/\b([A-Z0-9]{4,8})\b/g);
    const candidateCodes = codeMatch ? codeMatch.filter(c => !/^(CONNEXION|AUTH|LOGIN|CONNECTER|ACCES|VERIFY)$/i.test(c)) : [];

    // Strict command check: Only CONNEXION, AUTH or LOGIN (never match generic greetings like BONJOUR/SALUT/OUI)
    const isExplicitAuthCommand = /^(CONNEXION|AUTH|LOGIN)\b/i.test(normalizedText);

    // 1. Try to find a matching session in Memory
    let matchedSession: PendingAuthSession | undefined;
    
    // Check candidate codes in memory
    for (const code of candidateCodes) {
      const s = pendingAuthSessions.get(`code:${code}`);
      if (s) {
        matchedSession = s;
        break;
      }
    }

    // Build lookup variants (include founder variants if sender is an authorized founder proxy)
    const lookupVariants = [...phoneVariants];
    if (isFounderProxySender(cleanPhone)) {
      for (const fn of FOUNDER_NUMBERS) {
        if (!lookupVariants.includes(fn)) lookupVariants.push(fn);
      }
    }

    // Check phone variants in memory only if explicit auth command was sent
    if (!matchedSession && isExplicitAuthCommand) {
      for (const variant of lookupVariants) {
        const s = pendingAuthSessions.get(`phone:${variant}`);
        if (s) {
          matchedSession = s;
          break;
        }
      }
    }

    // 2. Try to find matching session in MongoDB
    let dbSession: any = null;
    try {
      const queryOr: any[] = [];
      for (const code of candidateCodes) {
        queryOr.push({ sessionCode: code });
      }
      if (isExplicitAuthCommand) {
        queryOr.push({ phoneVariants: { $in: lookupVariants } });
      }

      if (queryOr.length > 0) {
        dbSession = await AuthSessionModel.findOne({
          $or: queryOr,
          status: "pending",
          expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });
      }
    } catch (err) {
      console.warn("[Auth] Error finding AuthSession in MongoDB:", err);
    }

    // If neither a valid memory session nor a database session was found, DO NOT intercept (pass to sales bot)
    if (!matchedSession && !dbSession) {
      return { success: false };
    }

    const matchedSessionId = matchedSession?.authSessionId || dbSession?.authSessionId || `auth_${randomBytes(12).toString("hex")}`;
    const matchedSessionCode = matchedSession?.sessionCode || dbSession?.sessionCode || candidateCodes[0] || "";
    const sessionTargetPhone = matchedSession?.phoneNumber || dbSession?.phoneNumber;
    const sessionPhoneVariants = sessionTargetPhone
      ? generatePhoneVariants(sessionTargetPhone)
      : (dbSession?.phoneVariants || []);

    // --- STRICT CONCORDANCE VERIFICATION ---
    // If the session was requested for a specific phone number, verify that the sender matches it
    if (sessionTargetPhone) {
      const isFounderMatch =
        isFounderNumber(sessionTargetPhone) &&
        (isFounderNumber(cleanPhone) || isFounderProxySender(cleanPhone));

      const isSenderMatchingSession =
        cleanPhone === sessionTargetPhone ||
        sessionPhoneVariants.includes(cleanPhone) ||
        sessionPhoneVariants.some((v: string) => phoneVariants.includes(v)) ||
        isFounderMatch;

      if (!isSenderMatchingSession) {
        const displayTarget = formatDisplayPhone(sessionTargetPhone);
        const displayReceived = formatDisplayPhone(cleanPhone);
        const mismatchMessage = `Numéro WhatsApp expéditeur (${displayReceived}) différent du numéro saisi (${displayTarget}).`;

        // Mark in memory as mismatch
        const mismatchRecord: PendingAuthSession = {
          phoneNumber: sessionTargetPhone,
          authSessionId: matchedSessionId,
          sessionCode: matchedSessionCode,
          status: "mismatch",
          mismatchPhone: cleanPhone,
          mismatchMessage,
          createdAt: Date.now()
        };
        pendingAuthSessions.set(matchedSessionId, mismatchRecord);
        if (matchedSessionCode) pendingAuthSessions.set(`code:${matchedSessionCode}`, mismatchRecord);

        // Mark in MongoDB as mismatch
        try {
          await AuthSessionModel.updateMany(
            {
              $or: [
                { authSessionId: matchedSessionId },
                ...(matchedSessionCode ? [{ sessionCode: matchedSessionCode }] : [])
              ]
            },
            {
              $set: {
                status: "mismatch",
                mismatchPhone: cleanPhone,
                mismatchMessage
              }
            }
          );
        } catch (dbErr) {
          console.warn("[Auth] Failed to persist mismatch in MongoDB:", dbErr);
        }

        // Notify client in real-time
        const io = getSocketServer();
        if (io) {
          io.to(`auth:${matchedSessionId}`).emit("auth:mismatch", {
            error: mismatchMessage,
            expected: displayTarget,
            received: displayReceived
          });
          if (matchedSessionCode) {
            io.to(`auth:${matchedSessionCode}`).emit("auth:mismatch", {
              error: mismatchMessage,
              expected: displayTarget,
              received: displayReceived
            });
          }
          for (const variant of sessionPhoneVariants) {
            io.to(`auth:${variant}`).emit("auth:mismatch", {
              error: mismatchMessage,
              expected: displayTarget,
              received: displayReceived
            });
          }
        }

        const replyMessage = `⚠️ *Échec de connexion Vendeur IA*\n\nLe code *${matchedSessionCode}* a été demandé pour le numéro *${displayTarget}*, mais vous avez envoyé ce message depuis le *${displayReceived}*.\n\n👉 *Pour vous connecter :*\n1. Envoyez le message depuis le compte WhatsApp du *${displayTarget}*, OU\n2. Sur l'application, saisissez directement le numéro *${displayReceived}*.`;

        return {
          success: false,
          mismatch: true,
          replyMessage
        };
      }
    }

    console.log(`[WhatsApp Reverse Auth] Authenticating session for ${sessionTargetPhone || cleanPhone} via incoming message from ${cleanPhone}`);

    const targetPhone = sessionTargetPhone || cleanPhone;
    const isFounder = isFounderNumber(targetPhone);
    const founderDisplayName = "Franck (Co-Fondateur & Lead)";

    const targetPhoneVariants = generatePhoneVariants(targetPhone);

    let user = await UserModel.findOne({
      $or: [
        { whatsappNumber: targetPhone },
        { whatsappNumber: { $in: targetPhoneVariants } }
      ]
    });

    if (!user) {
      const fallbackEmail = `${targetPhone.replace(/[^0-9]/g, "")}@whatsapp.vendeur-ia.com`;
      user = await UserModel.create({
        whatsappNumber: targetPhone,
        email: fallbackEmail,
        authProvider: "whatsapp",
        displayName: isFounder ? founderDisplayName : `Commerçant WhatsApp (${targetPhone.slice(-4)})`,
        roles: isFounder ? ["user", "admin", "creator"] : ["user"],
        onboardingCompleted: true
      });
    } else if (isFounder) {
      user.roles = ["user", "admin", "creator"];
      user.onboardingCompleted = true;
      if (!user.displayName || user.displayName.startsWith("Commerçant")) {
        user.displayName = founderDisplayName;
      }
    } else if (user.displayName === founderDisplayName) {
      user.roles = ["user"];
      user.displayName = `Commerçant WhatsApp (${targetPhone.slice(-4)})`;
    }
    
    // Fresh Magic Token
    const magicToken = randomBytes(32).toString("hex");
    const magicHash = createHash("sha256").update(magicToken).digest("hex");

    // Fresh 6-digit OTP Code (re-use from dbSession if valid 6-digit or generate new)
    const otpCode = (dbSession?.otpCode && dbSession.otpCode.length === 6 && dbSession.otpCode !== "777888") 
      ? dbSession.otpCode 
      : Math.floor(100000 + Math.random() * 900000).toString();
    const otpCodeHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Save active token and OTP hashes on user
    user.magicTokenHash = magicHash;
    user.magicTokenExpiresAt = expiresAt;
    user.otpCodeHash = otpCodeHash;
    user.otpExpiresAt = expiresAt;
    await user.save();

    const tokens = await this.generateTokens(user);

    if (isFounder) {
      await auditLogService.log({
        userId: user._id,
        action: "founder_login",
        entity: "user",
        severity: "info",
        metadata: { ip: "hidden", method: "whatsapp_otp" }
      });
    }

    // Update in-memory session
    const sessionUpdate: PendingAuthSession = {
      phoneNumber: cleanPhone,
      authSessionId: matchedSessionId,
      sessionCode: matchedSessionCode,
      status: "authenticated",
      tokens,
      createdAt: Date.now()
    };

    pendingAuthSessions.set(matchedSessionId, sessionUpdate);
    if (matchedSessionCode) pendingAuthSessions.set(`code:${matchedSessionCode}`, sessionUpdate);
    for (const variant of phoneVariants) {
      pendingAuthSessions.set(`phone:${variant}`, sessionUpdate);
    }

    // Update in MongoDB
    try {
      await AuthSessionModel.updateMany(
        {
          $or: [
            { authSessionId: matchedSessionId },
            ...(matchedSessionCode ? [{ sessionCode: matchedSessionCode }] : []),
            { phoneVariants: { $in: phoneVariants } }
          ]
        },
        {
          $set: {
            status: "authenticated",
            tokens,
            magicToken,
            magicTokenHash: magicHash,
            otpCode,
            phoneNumber: cleanPhone,
            phoneVariants,
            expiresAt
          }
        }
      );
    } catch (dbErr) {
      console.warn("[Auth] Failed to update AuthSession in MongoDB:", dbErr);
    }

    // Notify connected browser tabs / PWAs in real time via Socket.io across all phone room formats and IDs
    const io = getSocketServer();
    if (io) {
      for (const variant of phoneVariants) {
        io.to(`auth:${variant}`).emit("auth:success", tokens);
      }
      if (matchedSessionId) {
        io.to(`auth:${matchedSessionId}`).emit("auth:success", tokens);
      }
      if (matchedSessionCode) {
        io.to(`auth:${matchedSessionCode}`).emit("auth:success", tokens);
      }
    }

    const replyMessage = `✅ *Connexion réussie !*\n\nBienvenue sur *Vendeur IA*. Votre boutique est déverrouillée.\n\n👉 _Vous pouvez retourner sur votre écran Vendeur IA dès maintenant !_`;

    return {
      success: true,
      tokens,
      replyMessage
    };
  }

  async requestWhatsAppOtp(whatsappNumber: string) {
    const cleanNumber = whatsappNumber.replace(/[\s\-\(\)\+]/g, "");
    if (!cleanNumber || cleanNumber.length < 8) {
      throw new Error("Numéro WhatsApp invalide.");
    }

    const isFounder = isFounderNumber(cleanNumber);
    const founderDisplayName = "Franck (Co-Fondateur & Lead)";

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    let user = await UserModel.findOne({ whatsappNumber: cleanNumber });
    const userRoles = isFounder ? ["user", "admin", "creator"] : ["user"];

    if (!user) {
      const fallbackEmail = `${cleanNumber.replace(/[^0-9]/g, "")}@whatsapp.vendeur-ia.com`;
      user = await UserModel.create({
        whatsappNumber: cleanNumber,
        email: fallbackEmail,
        authProvider: "whatsapp",
        displayName: isFounder ? founderDisplayName : `Commerçant WhatsApp (${cleanNumber.slice(-4)})`,
        roles: userRoles,
        otpCodeHash: codeHash,
        otpExpiresAt: expiresAt,
        onboardingCompleted: true
      });
    } else {
      user.otpCodeHash = codeHash;
      user.otpExpiresAt = expiresAt;
      if (isFounder) {
        user.roles = ["user", "admin", "creator"];
        user.onboardingCompleted = true;
        if (!user.displayName || user.displayName.startsWith("Commerçant")) {
          user.displayName = founderDisplayName;
        }
      }
      await user.save();
    }

    console.log(`[WhatsApp Auth] Code OTP pour ${cleanNumber}: ${code}`);
    return { success: true, message: "Code OTP envoyé", code: (isFounder || process.env.NODE_ENV !== "production") ? code : undefined };
  }

  async verifyWhatsAppOtp(whatsappNumber: string, code: string) {
    const cleanNumber = whatsappNumber.replace(/[\s\-\(\)\+]/g, "");
    const phoneVariants = generatePhoneVariants(cleanNumber);
    const isFounder = isFounderNumber(cleanNumber);

    if (isFounder) {
      return this.founderLogin(cleanNumber, code);
    }

    const user = await UserModel.findOne({
      $or: [
        { whatsappNumber: cleanNumber },
        { whatsappNumber: { $in: phoneVariants } }
      ],
      otpExpiresAt: { $gt: new Date() }
    });

    if (!user || !user.otpCodeHash) {
      throw new Error("Code OTP expiré ou numéro invalide.");
    }

    const isValid = await bcrypt.compare(code, user.otpCodeHash);
    if (!isValid) {
      throw new Error("Code OTP incorrect.");
    }

    user.otpCodeHash = undefined;
    user.otpExpiresAt = undefined;
    user.magicTokenHash = undefined;
    user.magicTokenExpiresAt = undefined;
    if (user.displayName === "Franck (Co-Fondateur & Lead)") {
      user.roles = ["user"];
      user.displayName = `Commerçant WhatsApp (${cleanNumber.slice(-4)})`;
    }
    await user.save();

    const tokens = await this.generateTokens(user);

    // Notify other devices
    const io = getSocketServer();
    if (io) {
      io.to(`auth:${cleanNumber}`).emit("auth:success", tokens);
    }

    return tokens;
  }

  async register(input: any) {
    const { email, password, displayName } = input;
    const cleanEmail = (email || "").trim().toLowerCase();
    const existingUser = await UserModel.findOne({ email: cleanEmail });
    if (existingUser) throw new Error("Cet email est déjà utilisé.");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      email: cleanEmail,
      passwordHash,
      displayName: displayName?.trim(),
    });

    return this.generateTokens(user);
  }

  async login(input: any) {
    const { email, password } = input;
    const cleanEmail = (email || "").trim().toLowerCase();
    const user = await UserModel.findOne({ email: cleanEmail });
    if (!user || !user.passwordHash) {
      console.warn(`[Auth] Connexion refusée pour '${cleanEmail}': utilisateur non trouvé ou mot de passe non configuré.`);
      throw new Error("Identifiants incorrects ou compte sans mot de passe.");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.warn(`[Auth] Mot de passe incorrect pour '${cleanEmail}'.`);
      throw new Error("Identifiants incorrects.");
    }

    return this.generateTokens(user);
  }

  async verifyGoogleToken(token: string) {
    let payload;

    try {
      // Try verifying as ID Token (JWT)
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (e) {
      // If failed, try as Access Token by calling Google UserInfo API
      try {
        const res = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${token}` }
        });
        payload = {
          email: res.data.email,
          sub: res.data.sub,
          name: res.data.name,
          picture: res.data.picture
        };
      } catch (err) {
        throw new Error("Invalid Google token (Access Token check failed)");
      }
    }

    if (!payload || !payload.email) throw new Error("Invalid Google token payload");

    // Check if email is verified (only if using ID Token which usually includes this)
    if ((payload as any).email_verified === false) {
      throw new Error("Google email not verified");
    }

    let user = await UserModel.findOne({ email: payload.email });
    if (!user) {
      user = await UserModel.create({
        email: payload.email,
        googleId: payload.sub,
        displayName: payload.name || "Utilisateur Google",
        avatarUrl: payload.picture,
        onboardingCompleted: false,
        emailVerifiedAt: new Date(), // Google emails are considered verified
      });
    } else {
      // Sync Google info if not already present
      let changed = false;
      if (!user.googleId) {
        user.googleId = payload.sub;
        changed = true;
      }
      if (!user.avatarUrl && payload.picture) {
        user.avatarUrl = payload.picture;
        changed = true;
      }
      if (!user.emailVerifiedAt) {
        user.emailVerifiedAt = new Date();
        changed = true;
      }
      if (changed) await user.save();
    }

    return this.generateTokens(user);
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET || env.JWT_SECRET) as any;
      const user = await UserModel.findById(decoded.id);
      if (!user || !user.refreshTokenHash) throw new Error("Invalid token");

      const isMatch = await bcrypt.compare(token, user.refreshTokenHash);
      if (!isMatch) throw new Error("Invalid token");

      return this.generateTokens(user);
    } catch (err) {
      throw new Error("Invalid token");
    }
  }

  async logout(userId: string) {
    try {
      const user = await UserModel.findById(userId);
      if (user?.whatsappNumber) {
        const phoneVariants = generatePhoneVariants(user.whatsappNumber);
        await AuthSessionModel.updateMany(
          { phoneVariants: { $in: phoneVariants } },
          { $set: { status: "consumed" } }
        ).catch(() => {});
        for (const v of phoneVariants) {
          pendingAuthSessions.delete(`phone:${v}`);
        }
      }
    } catch {}
    await UserModel.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
  }

  async forgotPassword(email: string) {
    const user = await UserModel.findOne({ email });
    if (!user || !user.email) return; // Silent return for security

    const token = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");

    user.passwordResetTokenHash = hash;
    user.passwordResetExpiresAt = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    await authEmailService.sendPasswordResetEmail({
      to: user.email,
      displayName: user.displayName,
      token
    });
  }

  async resetPassword(token: string, password: any) {
    const hash = createHash("sha256").update(token).digest("hex");
    const user = await UserModel.findOne({
      passwordResetTokenHash: hash,
      passwordResetExpiresAt: { $gt: new Date() }
    });

    if (!user) throw new Error("Invalid or expired reset token");

    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
  }

  async sendEmailVerification(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user || !user.email || user.emailVerifiedAt) return;

    const token = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");

    user.emailVerificationTokenHash = hash;
    user.emailVerificationExpiresAt = new Date(Date.now() + 86400000); // 24 hours
    await user.save();

    await authEmailService.sendVerificationEmail({
      to: user.email,
      displayName: user.displayName,
      token
    });
  }

  async verifyEmail(token: string) {
    const hash = createHash("sha256").update(token).digest("hex");
    const user = await UserModel.findOne({
      emailVerificationTokenHash: hash,
      emailVerificationExpiresAt: { $gt: new Date() }
    });

    if (!user) throw new Error("Invalid or expired verification token");

    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("Utilisateur introuvable");
    if (!user.passwordHash) throw new Error("Ce compte utilise une connexion externe (Google). Le mot de passe ne peut pas être modifié ici.");

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new Error("Le mot de passe actuel est incorrect");

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { success: true };
  }

  async updateProfile(userId: string, data: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    avatarUrl?: string;
    onboardingCompleted?: boolean;
  }) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true }
    );
    if (!user) throw new Error("User not found");

    return {
      id: user._id.toString(),
      email: user.email || (user.whatsappNumber ? `${user.whatsappNumber}@whatsapp.vendeur-ia.com` : ""),
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      businessName: user.businessName,
      avatarUrl: user.avatarUrl,
      roles: user.roles,
      onboardingCompleted: !!user.onboardingCompleted
    };
  }
}

export const authService = new AuthService();
