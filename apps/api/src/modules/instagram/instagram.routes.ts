import { Router } from "express";
import { instagramService } from "./instagram.service.js";
import { env } from "../../config/env.js";

const router = Router();

// Meta Webhook Verification (Shared with WhatsApp or separate depending on App config)
// Here we assume a dedicated Instagram webhook path for clarity
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Use the common verify token from env
  if (mode && token === (env.WHATSAPP_META_VERIFY_TOKEN || "vendeur_ia_secret")) {
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

router.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "instagram") {
    try {
      for (const entry of body.entry) {
        for (const messaging of entry.messaging) {
          if (messaging.message && !messaging.message.is_echo) {
            const senderId = messaging.sender.id;
            const pageId = entry.id;
            const text = messaging.message.text;

            if (text) {
              await instagramService.handleIncomingMessage(pageId, senderId, text);
            }
          }
        }
      }
      res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("[Instagram Webhook] Error:", error);
      res.status(500).end();
    }
  } else {
    res.status(404).end();
  }
});

export default router;
