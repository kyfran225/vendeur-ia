import { Router } from "express";
import { CommerceMerchantModel, CommerceConversationModel, CommerceMessageModel, CommerceCustomerModel, CommerceProductModel, CommerceKnowledgeModel } from "./commerce.model.js";
import { aiAgentService } from "../../services/ai-agent.service.js";
import { emitToUser } from "../../realtime/socketServer.js";
import { scheduleRecovery } from "../../services/marketing-queue.service.js";

const router = Router();

// PUBLIC WEB CHAT PROCESSING
router.post("/process", async (req, res) => {
  try {
    const { merchantId, sessionId, message, history } = req.body;

    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) return res.status(404).json({ error: "Boutique non trouvée" });

    // 1. Find or create customer based on Web Session ID
    // Note: On Web, we don't have a phone number yet, so we use session-based ID
    let customer = await CommerceCustomerModel.findOne({ merchantId, platformId: sessionId });
    if (!customer) {
      customer = await CommerceCustomerModel.create({
        merchantId,
        platformId: sessionId,
        phone: "WEB_VISITOR", // Placeholder until they provide phone
        platform: "web"
      });
    }

    // 2. Find or create conversation
    let conversation = await CommerceConversationModel.findOne({
      merchantId,
      customerId: customer._id,
      status: { $ne: "closed" }
    });

    if (!conversation) {
      conversation = await CommerceConversationModel.create({
        merchantId,
        customerId: customer._id,
        platform: "web"
      });
    }

    // 3. Save customer message
    await CommerceMessageModel.create({
      conversationId: conversation._id,
      sender: "customer",
      content: message
    });

    // 4. Update conversation metadata
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // 5. Notify Merchant Dashboard (Realtime)
    emitToUser(merchant.ownerId, "conversation:update", {
      conversationId: conversation._id,
      platform: "web"
    });

    // 6. Generate AI Response
    const products = await CommerceProductModel.find({ merchantId });
    const knowledge = await CommerceKnowledgeModel.findOne({ merchantId });

    const formattedHistory = history.map((h: any) => ({
      role: h.role,
      text: h.text
    }));

    const aiResponse = await aiAgentService.generateResponse({
      merchant: merchant.toObject() as any,
      products: products.map(p => p.toObject()),
      knowledge: knowledge ? (knowledge.toObject() as any) : {},
      history: formattedHistory,
      message,
      customerPhone: "Visiteur Web",
      platform: "web"
    });

    let reply = aiResponse.text;

    // Check for product image tag
    let productImageUrl: string | undefined = undefined;
    const sendImageMatch = reply.match(/\[\[ACTION_SEND_PRODUCT_IMAGE:([\s\S]*?)\]\]/);
    if (sendImageMatch) {
      try {
        const payload = JSON.parse(sendImageMatch[1]);
        reply = reply.replace(/\[\[ACTION_SEND_PRODUCT_IMAGE:[\s\S]*?\]\]/, '').trim();
        const matched = products.find(p =>
          (payload.productId && p._id.toString() === payload.productId) ||
          (payload.productName && p.name.toLowerCase() === payload.productName.toLowerCase())
        );
        if (matched) {
          productImageUrl = (matched.images && matched.images[0]) || matched.imageUrl;
        }
      } catch (e) {}
    }

    // Clean any other tags
    reply = reply.replace(/\[\[ACTION_CREATE_ORDER:[\s\S]*?\]\]/g, '').replace(/\[\[ACTION_ESCALATE_HUMAN:[\s\S]*?\]\]/g, '').trim();

    // 7. Save AI message
    await CommerceMessageModel.create({
      conversationId: conversation._id,
      sender: "ai",
      content: reply,
      type: productImageUrl ? "image" : "text",
      mediaUrl: productImageUrl || undefined
    });

    // 8. Schedule recovery if needed (optional for web, but good for follow-up if we get their ID)
    // scheduleRecovery(...)

    res.json({ reply, imageUrl: productImageUrl });
  } catch (error: any) {
    console.error("[WebChat Error]", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
