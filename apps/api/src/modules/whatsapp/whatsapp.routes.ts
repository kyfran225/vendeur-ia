import { Router } from "express";
import { whatsappService } from "./whatsapp.service.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.post("/connect", authenticate, async (req, res) => {
  try {
    await whatsappService.initSession((req as any).user.id);
    res.json({ message: "WhatsApp connection initialized" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Meta Webhook Verification
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === process.env.WHATSAPP_META_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

router.post("/webhook", async (req, res) => {
  // Handle Meta Cloud API messages
  res.status(200).end();
});

export default router;
