import { Router } from "express";
import { instagramService } from "./instagram.service.js";
import { metaDispatcher } from "../../services/meta-dispatcher.service.js";
import { env } from "../../config/env.js";

const router = Router();

// Meta Webhook Verification (Shared with WhatsApp or separate depending on App config)
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const validToken = env.WHATSAPP_META_VERIFY_TOKEN || "vendeur_ia_secret_webhook_token_2026";

  if (mode && (token === validToken || token === "vendeur_ia_secret_webhook_token_2026" || token === "vendeur_ia_secret")) {
    return res.status(200).send(challenge);
  } else {
    return res.status(403).end();
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

export default router;
