import { CommerceMerchantModel, CommerceConversationModel, CommerceMessageModel, CommerceCustomerModel } from "../commerce/commerce.model.js";
import { addAIJob } from "../../services/ai-queue.service.js";
import { emitToUser } from "../../realtime/socketServer.js";
import { commerceService } from "../commerce/commerce.service.js";

class FacebookService {
  async handleIncomingMessage(pageId: string, senderId: string, text: string) {
    console.log(`[Facebook] Message from ${senderId} to Page ${pageId}: ${text}`);

    const merchant = await CommerceMerchantModel.findOne({ "facebookConfig.pageId": pageId });
    if (!merchant) {
      console.warn(`[Facebook] No merchant found for PageID ${pageId}`);
      return;
    }

    const userId = merchant.ownerId;

    // Find or create customer
    let customer = await CommerceCustomerModel.findOne({ merchantId: merchant._id, platformId: senderId, platform: "facebook" });
    if (!customer) {
      customer = await CommerceCustomerModel.create({
        merchantId: merchant._id,
        platformId: senderId,
        platform: "facebook",
        phone: "FB_" + senderId // Fallback identifier
      });
    }

    // Find or create conversation
    let conversation = await CommerceConversationModel.findOne({
      merchantId: merchant._id,
      customerId: customer._id,
      platform: "facebook",
      status: { $ne: "closed" }
    });

    if (!conversation) {
      conversation = await CommerceConversationModel.create({
        merchantId: merchant._id,
        customerId: customer._id,
        platform: "facebook",
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

    // Process with AI if autoReply is enabled
    if (merchant.aiSettings?.autoReply && conversation.status === "active") {
      const salesContext = await commerceService.getSalesContext(merchant._id as any, customer._id as any);
      await addAIJob({
        ...salesContext,
        userId,
        conversationId: conversation._id as any,
        remoteJid: senderId,
        platform: "facebook"
      });
    }
  }
}

export const facebookService = new FacebookService();
