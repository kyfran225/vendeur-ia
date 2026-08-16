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

    const { productId, segment, template } = req.body;
    const result = await marketingService.generateBroadcastPreview(merchant._id.toString(), productId, segment, template);
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

    const { productId, segment, customText, personalization, scheduledAt } = req.body;
    const result = await marketingService.launchBroadcast(
      merchant._id.toString(),
      productId,
      segment,
      customText,
      personalization,
      scheduledAt
    );
    res.json(result);
  } catch (error: any) {
    const isClientError = error.message?.includes("Aucun client") || 
                          error.message?.includes("Quota quotidien") || 
                          error.message?.includes("ne peut pas être vide");
    res.status(isClientError ? 400 : 500).json({ error: error.message || "Erreur lors du lancement de la diffusion." });
  }
});

router.get("/automations", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Marchand non trouvé" });

    const automations = {
      abandonedCart: merchant.marketingAutomations?.abandonedCart ?? true,
      postPurchaseFollowup: merchant.marketingAutomations?.postPurchaseFollowup ?? true
    };
    res.json(automations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/automations", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const { abandonedCart, postPurchaseFollowup } = req.body;

    const updateObj: any = {};
    if (typeof abandonedCart === "boolean") {
      updateObj["marketingAutomations.abandonedCart"] = abandonedCart;
    }
    if (typeof postPurchaseFollowup === "boolean") {
      updateObj["marketingAutomations.postPurchaseFollowup"] = postPurchaseFollowup;
    }

    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId },
      { $set: updateObj },
      { new: true }
    );
    if (!merchant) return res.status(404).json({ error: "Marchand non trouvé" });

    res.json({
      abandonedCart: merchant.marketingAutomations?.abandonedCart ?? true,
      postPurchaseFollowup: merchant.marketingAutomations?.postPurchaseFollowup ?? true
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
