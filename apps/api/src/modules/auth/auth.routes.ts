import { Router } from "express";
import { env } from "../../config/env.js";
import { authService } from "./auth.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from "./auth.schema.js";

const router = Router();

router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const tokens = await authService.register(req.body);
    res.status(201).json(tokens);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const tokens = await authService.login(req.body);
    res.json(tokens);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/refresh", validate(refreshSchema), async (req, res) => {
  const { refreshToken } = req.body;
  try {
    const tokens = await authService.refreshToken(refreshToken);
    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

router.post("/logout", authenticate, async (req, res) => {
  try {
    await authService.logout((req as any).user.id);
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/google", validate(googleAuthSchema), async (req, res) => {
  const { token } = req.body;
  try {
    const tokens = await authService.verifyGoogleToken(token);
    res.json(tokens);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// WhatsApp Native Quick Access (Phone based instant access or return)
router.post("/whatsapp-quick-access", async (req, res) => {
  try {
    const { phoneNumber, displayName } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Le numéro WhatsApp est obligatoire." });
    }
    // WARNING: This is insecure as it allows access without verification.
    // We should migrate to magic links.
    const tokens = await authService.loginOrRegisterWithWhatsApp(phoneNumber, displayName);
    res.json(tokens);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Founder / Meta System Quick Direct Login
router.post("/founder-login", async (req, res) => {
  try {
    const { phoneNumber, pinOrPassword, authSessionId } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Le numéro WhatsApp est obligatoire." });
    }
    const tokens = await authService.founderLogin(phoneNumber, pinOrPassword, authSessionId);
    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Échec de l'authentification administrateur." });
  }
});

// WhatsApp Unified Pairing & Auth Initiation (Single-Step Onboarding + Returning User OTP)
router.post("/whatsapp-init", async (req, res) => {
  try {
    const { phoneNumber, storeData, authSessionId } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Le numéro WhatsApp est obligatoire." });
    }
    const result = await authService.initWhatsAppAuth(phoneNumber, storeData, authSessionId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Impossible d'initialiser l'appairage WhatsApp." });
  }
});

router.post("/whatsapp-regenerate-pairing", async (req, res) => {
  try {
    const { phoneNumber, storeData, authSessionId } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Le numéro WhatsApp est obligatoire." });
    }
    const result = await authService.initWhatsAppAuth(phoneNumber, storeData, authSessionId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Erreur lors de la régénération du code." });
  }
});

router.post("/whatsapp-magic-link", async (req, res) => {
  try {
    const { phoneNumber, clientUrl, authSessionId } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Le numéro WhatsApp est obligatoire." });
    }
    const origin = clientUrl || req.headers.origin || env.CLIENT_URL || "http://localhost:5173";
    const result = await authService.requestWhatsAppMagicLink(phoneNumber, origin, authSessionId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// WhatsApp Verify Magic Link
router.post("/verify-magic-link", async (req, res) => {
  try {
    const { phoneNumber, token, authSessionId } = req.body;
    if (!phoneNumber || !token) {
      return res.status(400).json({ error: "Le numéro et le token sont requis." });
    }
    const tokens = await authService.verifyMagicLink(phoneNumber, token, authSessionId);
    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

router.post("/poll-status", async (req, res) => {
  try {
    const { authSessionId, phoneNumber, sessionCode } = req.body;
    const result = await authService.checkAuthSessionStatus(authSessionId, phoneNumber, sessionCode);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// WhatsApp Request OTP
router.post("/whatsapp-otp-request", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Le numéro WhatsApp est obligatoire." });
    }
    const result = await authService.requestWhatsAppOtp(phoneNumber);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// WhatsApp Verify OTP
router.post("/whatsapp-otp-verify", async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    if (!phoneNumber || !code) {
      return res.status(400).json({ error: "Le numéro et le code OTP sont requis." });
    }
    const tokens = await authService.verifyWhatsAppOtp(phoneNumber, code);
    res.json(tokens);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/forgot-password", validate(forgotPasswordSchema), async (req, res) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({ message: "Si un compte existe, un email a été envoyé." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/reset-password", validate(resetPasswordSchema), async (req, res) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/verify-email", validate(verifyEmailSchema), async (req, res) => {
  try {
    await authService.verifyEmail(req.body.token);
    res.status(200).json({ message: "Email vérifié avec succès." });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/resend-verification", authenticate, async (req, res) => {
  try {
    await authService.sendEmailVerification((req as any).user.id);
    res.status(200).json({ message: "Email de vérification envoyé." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/me", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await authService.updateProfile(userId, req.body);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/change-password", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Veuillez renseigner l'ancien et le nouveau mot de passe." });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
    }
    await authService.changePassword(userId, currentPassword, newPassword);
    res.json({ success: true, message: "Mot de passe modifié avec succès" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
