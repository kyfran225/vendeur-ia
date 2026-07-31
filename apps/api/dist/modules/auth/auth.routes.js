import { Router } from "express";
import { authService } from "./auth.service.js";
import { authenticate } from "../../middleware/authenticate.js";
const router = Router();
router.post("/register", async (req, res) => {
    try {
        const tokens = await authService.register(req.body);
        res.status(201).json(tokens);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post("/login", async (req, res) => {
    try {
        const tokens = await authService.login(req.body);
        res.json(tokens);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    try {
        const tokens = await authService.refreshToken(refreshToken);
        res.json(tokens);
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
});
router.post("/logout", authenticate, async (req, res) => {
    try {
        await authService.logout(req.user.id);
        res.status(204).end();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/google", async (req, res) => {
    const { token } = req.body;
    try {
        const tokens = await authService.verifyGoogleToken(token);
        res.json(tokens);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
export default router;
