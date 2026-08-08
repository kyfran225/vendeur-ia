import { Router } from "express";
import { facebookService } from "./facebook.service.js";
import { metaDispatcher } from "../../services/meta-dispatcher.service.js";
import { env } from "../../config/env.js";
import { authenticate } from "../../middleware/authenticate.js";
import { CommerceMerchantModel } from "../commerce/commerce.model.js";

const router = Router();

// Meta Webhook Verification
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === (env.WHATSAPP_META_VERIFY_TOKEN || "vendeur_ia_secret")) {
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

router.post("/webhook", async (req, res) => {
  try {
    await metaDispatcher.dispatch(req.body);
    res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("[Meta Webhook Dispatcher] Error:", error);
    res.status(500).end();
  }
});

router.patch("/config", authenticate, async (req, res) => {
  try {
    const { pageId, accessToken } = req.body;
    const userId = (req as any).user.id;

    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: userId },
      {
        $set: {
          "facebookConfig.pageId": pageId,
          "facebookConfig.accessToken": accessToken,
          "facebookConfig.status": (pageId && accessToken) ? "connected" : "disconnected"
        }
      },
      { new: true }
    );

    res.json({ message: "Configuration Facebook mise à jour", facebookConfig: merchant?.facebookConfig });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
