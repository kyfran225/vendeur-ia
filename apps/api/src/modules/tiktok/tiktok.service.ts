import { CommerceMerchantModel, CommerceConversationModel, CommerceMessageModel, CommerceCustomerModel } from "../commerce/commerce.model.js";
import { addAIJob } from "../../services/ai-queue.service.js";
import { emitToUser } from "../../realtime/socketServer.js";
import { commerceService } from "../commerce/commerce.service.js";

class TikTokService {
  async handleIncomingMessage(openId: string, senderOpenId: string, text: string) {
    console.log(`[TikTok] Message from ${senderOpenId} to ${openId}: ${text}`);

    const merchant = await CommerceMerchantModel.findOne({ "tiktokConfig.openId": openId });
    if (!merchant) {
      console.warn(`[TikTok] No merchant found for OpenID ${openId}`);
      return;
    }

    const userId = merchant.ownerId;

    // Find or create customer
    let customer = await CommerceCustomerModel.findOne({ merchantId: merchant._id, platformId: senderOpenId, platform: "tiktok" });
    if (!customer) {
      customer = await CommerceCustomerModel.create({
        merchantId: merchant._id,
        platformId: senderOpenId,
        platform: "tiktok",
        phone: "TT_" + senderOpenId.substring(0, 10)
      });
    }

    // Find or create conversation
    let conversation = await CommerceConversationModel.findOne({
      merchantId: merchant._id,
      customerId: customer._id,
      platform: "tiktok",
      status: { $ne: "closed" }
    });

    if (!conversation) {
      conversation = await CommerceConversationModel.create({
        merchantId: merchant._id,
        customerId: customer._id,
        platform: "tiktok",
        status: "active"
      });
    }

    // Save message
    const message = await CommerceMessageModel.create({
      conversationId: conversation._id,
      sender: "customer",
      type: "text",
      content: text
    });

    // Update conversation
    await CommerceConversationModel.findByIdAndUpdate(conversation._id, {
      lastMessageAt: new Date(),
      $inc: { messagesCount: 1 }
    });

    // Emit to frontend
    emitToUser(userId, "conversation:update", {
      conversationId: conversation._id,
      message
    });

    // AI Processing
    if (merchant.aiSettings?.autoReply && conversation.status === "active") {
      const salesContext = await commerceService.getSalesContext(merchant._id as any, customer._id as any);
      await addAIJob({
        ...salesContext,
        userId,
        conversationId: conversation._id as any,
        remoteJid: senderOpenId,
        platform: "tiktok"
      });
    }
  }
}

export const tiktokService = new TikTokService();
