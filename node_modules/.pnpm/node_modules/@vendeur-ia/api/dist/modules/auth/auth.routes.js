import { Router } from "express";
import { authService } from "./auth.service.js";
const router = Router();
router.post("/register", async (req, res) => {
    const { email, password, businessName, category, city } = req.body;
    try {
        const data = await authService.register(email, password, businessName, category, city);
        res.json(data);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const data = await authService.login(email, password);
        res.json(data);
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
});
export default router;
