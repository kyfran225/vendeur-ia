import { Router } from "express";
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
