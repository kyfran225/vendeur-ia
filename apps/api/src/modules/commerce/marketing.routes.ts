import { Router } from "express";
import { marketingService } from "../../services/marketing.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { CommerceMerchantModel } from "./commerce.model.js";

const router = Router();

router.get("/segments", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const segments = await marketingService.getSegments(merchant._id.toString());
    res.json(segments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/preview", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const { productId, segment } = req.body;
    const result = await marketingService.generateBroadcastPreview(merchant._id.toString(), productId, segment);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/broadcast", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const { productId, segment, customText } = req.body;
    const result = await marketingService.launchBroadcast(merchant._id.toString(), productId, segment, customText);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
