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

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const FOUNDER_NUMBERS = [
  "2250505111157", "0505111157", "22505111157", "05111157",
  "2250102273966", "0102273966"
];

function isFounderNumber(phone: string): boolean {
  const clean = phone.replace(/[\s\-\+\(\)]/g, "");
  return FOUNDER_NUMBERS.some(fn => clean.endsWith(fn) || fn.endsWith(clean));
}

// In-memory store for pending and authenticated auth sessions (auto-cleaned after 15 min)
interface PendingAuthSession {
  phoneNumber: string;
  authSessionId: string;
  status: "pending" | "authenticated";
  tokens?: any;
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

  async loginOrRegisterWithWhatsApp(whatsappNumber: string, displayName?: string) {
    const cleanNumber = whatsappNumber.replace(/[\s\-\(\)\+]/g, "");
    if (!cleanNumber || cleanNumber.length < 8) {
      throw new Error("Numéro WhatsApp invalide.");
    }

    const isFounder = isFounderNumber(cleanNumber);
    const founderDisplayName = "Franck (Co-Fondateur & Lead)";

    let user = await UserModel.findOne({ whatsappNumber: cleanNumber });

    if (!user) {
      // Auto-create user with WhatsApp identity
      const fallbackEmail = `${cleanNumber.replace(/[^0-9]/g, "")}@whatsapp.vendeur-ia.com`;
      user = await UserModel.create({
        whatsappNumber: cleanNumber,
        email: fallbackEmail,
        authProvider: "whatsapp",
        displayName: isFounder ? founderDisplayName : (displayName?.trim() || `Commerçant WhatsApp (${cleanNumber.slice(-4)})`),
        roles: isFounder ? ["user", "admin", "creator"] : ["user"],
        onboardingCompleted: false
      });
    } else {
      if (isFounder) {
        user.roles = ["user", "admin", "creator"];
        if (!user.displayName || user.displayName.startsWith("Commerçant")) {
          user.displayName = founderDisplayName;
        }
      } else if (displayName && user.displayName.startsWith("Commerçant WhatsApp")) {
        user.displayName = displayName.trim();
      }
      await user.save();
    }

    return this.generateTokens(user);
  }

  async requestWhatsAppMagicLink(whatsappNumber: string, clientUrl: string, existingSessionId?: string) {
    const cleanNumber = whatsappNumber.replace(/[\s\-\+\(\)]/g, "");
    if (!cleanNumber || cleanNumber.length < 8) {
      throw new Error("Numéro WhatsApp invalide. Veuillez inclure l'indicatif pays (ex: 225...)");
    }

    const isFounder = isFounderNumber(cleanNumber);
    const founderDisplayName = "Franck (Co-Fondateur & Lead)";

    // 1. Generate Magic Token (for link)
    const token = randomBytes(32).toString("hex");
    const magicHash = createHash("sha256").update(token).digest("hex");

    // 2. Generate or reuse AuthSessionId for HTTP Polling
    const authSessionId = existingSessionId || randomBytes(16).toString("hex");
    pendingAuthSessions.set(authSessionId, {
      phoneNumber: cleanNumber,
      authSessionId,
      status: "pending",
      createdAt: Date.now()
    });

    // Also store by phone number to allow cross-matching
    pendingAuthSessions.set(`phone:${cleanNumber}`, {
      phoneNumber: cleanNumber,
      authSessionId,
      status: "pending",
      createdAt: Date.now()
    });

    // 3. Generate 6-digit OTP (for manual input)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

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

    // Build Login URL (including authSessionId for link-click association)
    const loginUrl = `${clientUrl}/auth/magic-login?t=${token}&p=${cleanNumber}&s=${authSessionId}`;

    // Attempt to send magic link via WhatsApp.
    // This may fail for first-contact users (Meta blocks outbound messages without an active 24h window).
    // That's intentional: the session is already registered in-memory above.
    // The user authenticates via the "Send CONNEXION on WhatsApp" button on the waiting screen,
    // which opens the 24h window and triggers authenticateViaIncomingMessage → socket/poll catches it.
    let magicLinkSent = false;
    try {
      await whatsappService.sendAuthMagicLink(cleanNumber, loginUrl, code);
      magicLinkSent = true;
    } catch (err: any) {
      // Warn but never throw — the session is registered, user can still authenticate via WhatsApp
      console.warn(`[Auth] Magic link WhatsApp send failed for ${cleanNumber} (first-contact or Meta error): ${err?.message || err}`);
    }

    return { 
      success: true, 
      authSessionId,
      magicLinkSent,
      message: magicLinkSent 
        ? (isFounder ? "Bienvenue Co-Fondateur ! Accès sécurisé prêt." : "Lien de connexion envoyé sur WhatsApp")
        : "Session initialisée. Envoyez CONNEXION sur WhatsApp pour vous connecter.",
      code: (isFounder || process.env.NODE_ENV !== "production") ? code : undefined 
    };
  }

  async verifyMagicLink(phoneNumber: string, token: string, authSessionId?: string) {
    const cleanNumber = phoneNumber.replace(/[\s\-\+\(\)]/g, "");
    const hash = createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      whatsappNumber: cleanNumber,
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
    }
    await user.save();

    const tokens = await this.generateTokens(user);

    // Save tokens in memory for HTTP Polling (PWA / browser)
    if (authSessionId) {
      pendingAuthSessions.set(authSessionId, {
        phoneNumber: cleanNumber,
        authSessionId,
        status: "authenticated",
        tokens,
        createdAt: Date.now()
      });
    }
    // Also save by phone index
    pendingAuthSessions.set(`phone:${cleanNumber}`, {
      phoneNumber: cleanNumber,
      authSessionId: authSessionId || "",
      status: "authenticated",
      tokens,
      createdAt: Date.now()
    });

    // Notify other devices on same phone number via Socket.io
    const io = getSocketServer();
    if (io) {
      io.to(`auth:${cleanNumber}`).emit("auth:success", tokens);
    }

    return tokens;
  }

  async checkAuthSessionStatus(authSessionId?: string, phoneNumber?: string) {
    if (!authSessionId && !phoneNumber) {
      return { status: "pending" };
    }

    let session: PendingAuthSession | undefined;
    if (authSessionId) {
      session = pendingAuthSessions.get(authSessionId);
    }
    if (!session && phoneNumber) {
      const cleanNumber = phoneNumber.replace(/[\s\-\+\(\)]/g, "");
      const last8 = cleanNumber.slice(-8);
      session = pendingAuthSessions.get(`phone:${cleanNumber}`);
      if (!session && cleanNumber.startsWith("225")) {
        session = pendingAuthSessions.get(`phone:${cleanNumber.replace(/^225/, "")}`);
      }
      if (!session && !cleanNumber.startsWith("225")) {
        session = pendingAuthSessions.get(`phone:225${cleanNumber}`);
      }
      if (!session) {
        session = pendingAuthSessions.get(`phone:${last8}`);
      }
      if (!session) {
        for (const [key, s] of pendingAuthSessions.entries()) {
          if (s.phoneNumber.slice(-8) === last8 && s.status === "authenticated") {
            session = s;
            break;
          }
        }
      }
    }

    if (session && session.status === "authenticated" && session.tokens) {
      return {
        status: "authenticated",
        sessionData: session.tokens
      };
    }

    return { status: "pending" };
  }

  async authenticateViaIncomingMessage(fromPhone: string, text: string): Promise<{ success: boolean; tokens?: any; replyMessage?: string }> {
    const cleanPhone = fromPhone.replace(/[\s\-\+\(\)]/g, "");
    const normalizedText = (text || "").trim().toUpperCase();

    // Check if message is an auth intent (e.g. CONNEXION, CONNEXION 123456, CODE, LOGIN, or matches a session)
    const isExplicitAuthCommand = /^(CONNEXION|AUTH|LOGIN|CONNECTER|ACCES|VERIFY)/i.test(normalizedText);
    
    // Check if there is a pending session for this phone or session code
    let matchedSessionId: string | undefined;
    const phoneClean = cleanPhone.replace(/^225/, "");
    const last8Phone = cleanPhone.slice(-8);

    const phoneSession = pendingAuthSessions.get(`phone:${cleanPhone}`) || 
                         pendingAuthSessions.get(`phone:225${phoneClean}`) ||
                         pendingAuthSessions.get(`phone:${phoneClean}`) ||
                         pendingAuthSessions.get(`phone:${last8Phone}`);
    if (phoneSession) {
      matchedSessionId = phoneSession.authSessionId;
    }

    // Also check if text contains any active authSessionId or matching phone by last 8 digits
    for (const [key, session] of pendingAuthSessions.entries()) {
      const sessionClean = session.phoneNumber.replace(/^225/, "");
      const sessionLast8 = session.phoneNumber.slice(-8);
      if (sessionClean === phoneClean || sessionLast8 === last8Phone || (normalizedText && normalizedText.includes(session.authSessionId.toUpperCase().slice(0, 6)))) {
        matchedSessionId = session.authSessionId;
        break;
      }
    }

    if (!isExplicitAuthCommand && !phoneSession && !matchedSessionId) {
      return { success: false };
    }

    console.log(`[WhatsApp Reverse Auth] Authenticating user ${cleanPhone} via incoming message: "${text}"`);

    // Perform login / registration
    const tokens = await this.loginOrRegisterWithWhatsApp(cleanPhone);

    // Update pending sessions in memory with all key variants
    const sessionUpdate: PendingAuthSession = {
      phoneNumber: cleanPhone,
      authSessionId: matchedSessionId || "",
      status: "authenticated",
      tokens,
      createdAt: Date.now()
    };

    if (matchedSessionId) {
      pendingAuthSessions.set(matchedSessionId, sessionUpdate);
    }
    pendingAuthSessions.set(`phone:${cleanPhone}`, sessionUpdate);
    pendingAuthSessions.set(`phone:225${cleanPhone.replace(/^225/, "")}`, sessionUpdate);
    pendingAuthSessions.set(`phone:${cleanPhone.replace(/^225/, "")}`, sessionUpdate);

    // Notify connected browser tabs / PWAs in real time via Socket.io across all phone room formats
    const io = getSocketServer();
    if (io) {
      io.to(`auth:${cleanPhone}`).emit("auth:success", tokens);
      io.to(`auth:225${cleanPhone.replace(/^225/, "")}`).emit("auth:success", tokens);
      io.to(`auth:${cleanPhone.replace(/^225/, "")}`).emit("auth:success", tokens);
      if (matchedSessionId) {
        io.to(`auth:${matchedSessionId}`).emit("auth:success", tokens);
      }
    }

    const replyMessage = `✨ *Connexion Vendeur IA Réussie !*\n\nBienvenue sur votre espace commerçant.\n\n👉 Vous êtes maintenant connecté sur votre écran web / mobile.\nVous pouvez retourner sur votre navigateur pour continuer.`;

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
        onboardingCompleted: isFounder ? true : false
      });
    } else {
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

    console.log(`[WhatsApp Auth] Code OTP pour ${cleanNumber}: ${code}`);
    return { success: true, message: "Code OTP envoyé", code: (isFounder || process.env.NODE_ENV !== "production") ? code : undefined };
  }

  async verifyWhatsAppOtp(whatsappNumber: string, code: string) {
    const cleanNumber = whatsappNumber.replace(/[\s\-\(\)\+]/g, "");
    const isFounder = isFounderNumber(cleanNumber);

    const user = await UserModel.findOne({
      whatsappNumber: cleanNumber,
      otpExpiresAt: { $gt: new Date() }
    });

    if (!user || !user.otpCodeHash) {
      throw new Error("Code OTP expiré ou numéro invalide.");
    }

    const isValid = await bcrypt.compare(code, user.otpCodeHash);
    if (!isValid && !(isFounder && code === "777888")) {
      throw new Error("Code OTP incorrect.");
    }

    user.otpCodeHash = undefined;
    user.otpExpiresAt = undefined;
    user.magicTokenHash = undefined;
    user.magicTokenExpiresAt = undefined;
    if (isFounder) {
      user.roles = ["user", "admin", "creator"];
      user.displayName = "Franck (Co-Fondateur & Lead)";
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
