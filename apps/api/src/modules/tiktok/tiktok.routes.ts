import { Router } from "express";
import { tiktokService } from "./tiktok.service.js";

const router = Router();

// TikTok Webhook for Messages
// TikTok events are delivered via a webhook defined in the Developer Console
router.post("/webhook", async (req, res) => {
  const body = req.body;

  // TikTok specific event structure check
  // See: https://developers.tiktok.com/doc/messaging-api-webhook
  if (body.event === "message") {
    try {
      const { recipient_open_id, sender_open_id, content } = body.data;
      if (content && content.text) {
        await tiktokService.handleIncomingMessage(recipient_open_id, sender_open_id, content.text);
      }
      res.status(200).send({ message: "ok" });
    } catch (error) {
      console.error("[TikTok Webhook] Error:", error);
      res.status(500).end();
    }
  } else {
    // Other events (echoes, read receipts, etc.)
    res.status(200).send({ message: "ignored" });
  }
});

export default router;
