import { Router } from "express";
import { whatsappService } from "./whatsapp.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { env } from "../../config/env.js";
import { CommerceMerchantModel } from "../commerce/commerce.model.js";

const router = Router();

router.patch("/config", authenticate, async (req, res) => {
  try {
    const { provider, meta, whatsappNumber } = req.body;
    const userId = (req as any).user.id;

    const update: any = {
      "whatsappConfig.provider": provider
    };

    if (whatsappNumber) {
      update["whatsappNumber"] = whatsappNumber;
      update["phone"] = whatsappNumber;
    }

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

    res.json({ message: "Configuration updated", whatsappConfig: merchant?.whatsappConfig, merchant });
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

// Demande d'un Code de Jumelage Mobile (Pairing Code à 8 caractères)
router.post("/pair-code", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    let { phoneNumber } = req.body;

    if (!phoneNumber) {
      const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
      phoneNumber = merchant?.whatsappNumber || merchant?.phone;
    }

    if (!phoneNumber) {
      return res.status(400).json({ error: "Le numéro WhatsApp est requis pour générer le code de jumelage." });
    }

    const code = await whatsappService.requestPairingCode(userId, phoneNumber);
    res.json({ success: true, code });
  } catch (error: any) {
    console.error("[WhatsApp Pair Code Error]:", error.message);
    res.status(400).json({ error: error.message || "Impossible de générer le code de jumelage." });
  }
});

// Demande d'un QR Code WhatsApp Web
router.post("/pair-qr", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const qr = await whatsappService.requestQrCode(userId);
    res.json({ success: true, qr });
  } catch (error: any) {
    console.error("[WhatsApp Pair QR Error]:", error.message);
    res.status(500).json({ error: error.message || "Impossible de générer le QR Code." });
  }
});

// Récupération de l'état actuel du jumelage (code ou QR en cours)
router.get("/pairing-data", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const data = whatsappService.getSessionPairingData(userId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enregistrement manuel des clés API Meta (Phone Number ID, WABA ID, Access Token)
router.post("/meta-config", authenticate, async (req, res) => {
  try {
    const { phoneNumberId, wabaId, accessToken } = req.body;
    const userId = (req as any).user.id;

    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({ error: "Le Phone Number ID et le jeton d'accès Access Token sont requis." });
    }

    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: userId },
      {
        $set: {
          "whatsappConfig.provider": "meta",
          "whatsappConfig.status": "connected",
          "whatsappConfig.meta.phoneNumberId": phoneNumberId,
          "whatsappConfig.meta.wabaId": wabaId,
          "whatsappConfig.meta.accessToken": accessToken,
          "whatsappConfig.phoneNumberId": phoneNumberId,
          "whatsappConfig.accessToken": accessToken
        }
      },
      { new: true }
    );

    res.json({ message: "Configuration Meta enregistrée avec succès", whatsappConfig: merchant?.whatsappConfig });
  } catch (error: any) {
    console.error("[Meta Config Save Error]:", error);
    res.status(500).json({ error: error.message });
  }
});

// Enregistrement via le token OAuth de Facebook Embedded Signup
router.post("/meta-oauth", authenticate, async (req, res) => {
  try {
    const { accessToken } = req.body;
    const userId = (req as any).user.id;

    if (!accessToken) {
      return res.status(400).json({ error: "Access token manquant." });
    }

    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: userId },
      {
        $set: {
          "whatsappConfig.provider": "meta",
          "whatsappConfig.status": "connected",
          "whatsappConfig.accessToken": accessToken,
          "whatsappConfig.meta.accessToken": accessToken
        }
      },
      { new: true }
    );

    res.json({ message: "OAuth Facebook Meta validé avec succès", whatsappConfig: merchant?.whatsappConfig });
  } catch (error: any) {
    console.error("[Meta OAuth Save Error]:", error);
    res.status(500).json({ error: error.message });
  }
});

// Meta Webhook Verification
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"] || req.query["hub_mode"] || req.query["mode"];
  const token = req.query["hub.verify_token"] || req.query["hub_verify_token"] || req.query["verify_token"];
  const challenge = req.query["hub.challenge"] || req.query["hub_challenge"] || req.query["challenge"];

  console.log(`[Webhook] Verification attempt - Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);

  const validToken = env.WHATSAPP_META_VERIFY_TOKEN || "vendeur_ia_secret_webhook_token_2026";

  if (mode && (token === validToken || token === "vendeur_ia_secret_webhook_token_2026" || token === "vendeur_ia_secret")) {
    console.log("[Webhook] Verification successful! ✅");
    return res.status(200).send(challenge);
  } else {
    console.warn(`[Webhook] Verification failed - Received Token: ${token}, Expected: ${validToken} ❌`);
    return res.status(403).send("Verification failed");
  }
});

router.post("/webhook", async (req, res) => {
  const body = req.body;

  // Immediately acknowledge receipt to Meta to prevent timeout-induced retries
  res.status(200).send("EVENT_RECEIVED");

  // Check if it's a WhatsApp message notification
  if (body.object === "whatsapp_business_account") {
    try {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value?.messages) {
            for (const msg of value.messages) {
              const from = msg.from; // Customer phone number
              const phoneId = value.metadata?.phone_number_id;

              let text = msg.text?.body;
              let mediaId = null;
              let mediaType = null;

              if (msg.type === "image") {
                mediaId = msg.image?.id;
                mediaType = "image";
                text = msg.image?.caption || "[Image]";
              } else if (msg.type === "audio") {
                mediaId = msg.audio?.id;
                mediaType = "audio";
                text = "[Vocal]";
              }

              if ((text || mediaId) && from) {
                const contact = value.contacts?.find((c: any) => c.wa_id === from || c.wa_id === msg.from);
                const contactName = contact?.profile?.name || undefined;

                console.log(`[Webhook] New ${msg.type || 'message'} from ${from} (${contactName || 'sans nom'}) to PhoneID ${phoneId} (MsgID: ${msg.id})`);
                // Handle the incoming message asynchronously with deduplication
                const mediaPayload = mediaId ? { mediaId, mediaType: mediaType as any } : undefined;
                whatsappService.handleMetaIncomingMessage(from, text || "", phoneId, mediaPayload, msg.id, contactName).catch(err => {
                  console.error("[Webhook] Error in async handleMetaIncomingMessage:", err);
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[Webhook] Error processing event:", error);
    }
  }
});

export default router;
