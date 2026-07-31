import { Router } from "express";
import { authService } from "./auth.service.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const tokens = await authService.register(req.body);
    res.status(201).json(tokens);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const tokens = await authService.login(req.body);
    res.json(tokens);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/refresh", async (req, res) => {
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

router.post("/google", async (req, res) => {
  const { token } = req.body;
  try {
    const tokens = await authService.verifyGoogleToken(token);
    res.json(tokens);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({ message: "Si un compte existe, un email a été envoyé." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/verify-email", async (req, res) => {
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

export default router;
