import { Router } from "express";
import { commerceService } from "./commerce.service.js";
import { paystackService } from "../../services/paystack.service.js";
const router = Router();
router.get("/dashboard", async (req, res) => {
    // Authentication middleware would set req.user
    const merchantId = req.user?.id;
    if (!merchantId)
        return res.status(401).json({ error: "Unauthorized" });
    const data = await commerceService.getDashboard(merchantId);
    res.json(data);
});
router.post("/activate-premium", async (req, res) => {
    const { email } = req.body;
    try {
        const data = await paystackService.initializeSubscription(email, 5000);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
