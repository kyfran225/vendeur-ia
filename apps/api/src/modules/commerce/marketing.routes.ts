import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { marketingService } from "../../services/marketing.service.js";
import { CommerceMerchantModel, MarketingCampaignModel } from "./commerce.model.js";

const router = Router();

router.get("/active", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.json(null);

    const campaign = await MarketingCampaignModel.findOne({
      merchantId: merchant._id,
      status: "active"
    }).sort({ createdAt: -1 });

    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/segments", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.json({ vip: 0, active: 0, all: 0 });

    const segments = await marketingService.getSegments(merchant._id.toString());
    res.json(segments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/campaigns", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.json([]);

    const campaigns = await marketingService.getCampaigns(merchant._id.toString());
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/preview", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Marchand non trouvé" });

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
    if (!merchant) return res.status(404).json({ error: "Marchand non trouvé" });

    const { productId, segment, customText } = req.body;
    const result = await marketingService.launchBroadcast(merchant._id.toString(), productId, segment, customText);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
