import { Router } from "express";
import { whatsappService } from "./whatsapp.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { env } from "../../config/env.js";
import { CommerceMerchantModel } from "../commerce/commerce.model.js";

const router = Router();

router.post("/connect", authenticate, async (req, res) => {
  try {
    await whatsappService.initSession((req as any).user.id);
    res.json({ message: "WhatsApp connection initialized" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/disconnect", authenticate, async (req, res) => {
  try {
    await whatsappService.disconnectSession((req as any).user.id);
    res.json({ message: "WhatsApp disconnected" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/status", authenticate, async (req, res) => {
  try {
    const status = await whatsappService.getSessionStatus((req as any).user.id);
    res.json({ status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/config", authenticate, async (req, res) => {
  try {
    const { provider, meta } = req.body;
    const userId = (req as any).user.id;

    const update: any = {
      "whatsappConfig.provider": provider
    };

    if (meta) {
      if (meta.phoneNumberId) update["whatsappConfig.meta.phoneNumberId"] = meta.phoneNumberId;
      if (meta.accessToken) update["whatsappConfig.meta.accessToken"] = meta.accessToken;
      if (meta.wabaId) update["whatsappConfig.meta.wabaId"] = meta.wabaId;
    }

    // If switching to meta, we mark it as connected to enable the provider.
    // This allows using the system-wide Meta configuration if no custom keys are provided.
    if (provider === 'meta') {
      update["whatsappConfig.status"] = 'connected';
    }

    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: userId },
      { $set: update },
      { new: true }
    );

    res.json({ message: "Configuration updated", whatsappConfig: merchant?.whatsappConfig });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Meta Webhook Verification
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log(`[Webhook] Verification attempt - Mode: ${mode}, Token: ${token}`);

  if (mode && token === env.WHATSAPP_META_VERIFY_TOKEN) {
    console.log("[Webhook] Verification successful! ✅");
    res.status(200).send(challenge);
  } else {
    console.warn("[Webhook] Verification failed: Token mismatch ❌");
    res.status(403).end();
  }
});

router.post("/webhook", async (req, res) => {
  const body = req.body;

  // Check if it's a WhatsApp message notification
  if (body.object === "whatsapp_business_account") {
    try {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;
          if (value.messages) {
            for (const msg of value.messages) {
              const from = msg.from; // Customer phone number
              const phoneId = value.metadata.phone_number_id;

              let text = msg.text?.body;
              let mediaId = null;
              let mediaType = null;

              if (msg.type === "image") {
                mediaId = msg.image.id;
                mediaType = "image";
                text = msg.image.caption || "[Image]";
              } else if (msg.type === "audio") {
                mediaId = msg.audio.id;
                mediaType = "audio";
                text = "[Vocal]";
              }

              if ((text || mediaId) && from) {
                console.log(`[Webhook] New ${msg.type || 'message'} from ${from} to PhoneID ${phoneId}`);
                // Handle the incoming message
                await whatsappService.handleMetaIncomingMessage(from, text || "", phoneId, { mediaId, mediaType: mediaType as any });
              }
            }
          }
        }
      }
      res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("[Webhook] Error processing event:", error);
      res.status(500).end();
    }
  } else {
    res.status(404).end();
  }
});

export default router;
