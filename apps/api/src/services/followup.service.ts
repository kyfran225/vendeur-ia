import { CommerceConversationModel, CommerceMerchantModel, CommerceCustomerModel, CommerceMessageModel } from "../modules/commerce/commerce.model.js";
import { messagingService } from "./messaging.service.js";
import { aiProvider } from "./ai-provider.js";
import { logger } from "./logger.service.js";

/**
 * FollowUpService handles the detection and execution of automated re-engagement messages
 * for customers who stopped responding before completing a purchase.
 */
class FollowUpService {
  /**
   * Scans active conversations for potential abandonment.
   * Criteria: Last message from AI, no response for > 2 hours, and not already closed or converted.
   */
  async checkPendingFollowUps() {
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    logger.info("[FollowUp] Scanning for abandoned conversations...");

    // Find conversations where last message is older than 2h but newer than 24h
    const abandonedConversations = await CommerceConversationModel.find({
      status: "active",
      lastMessageAt: { $lt: twoHoursAgo, $gt: twentyFourHoursAgo },
      // To prevent spamming, we only follow up once per conversation status cycle
      "followUpSent": { $ne: true }
    }).populate("merchantId customerId");

    for (const conv of abandonedConversations) {
      const lastMessage = await CommerceMessageModel.findOne({ conversationId: conv._id }).sort({ timestamp: -1 });

      // Only follow up if the last message was from the AI (meaning we are waiting for client)
      if (lastMessage?.sender === 'ai') {
        await this.executeFollowUp(conv);
      }
    }
  }

  private async executeFollowUp(conversation: any) {
    const merchant = conversation.merchantId;
    const customer = conversation.customerId;

    // Safety checks: if customer or merchant was deleted or not populated
    if (!merchant || !customer) {
      logger.warn(`[FollowUp] Skipping conversation ${conversation._id}: merchant or customer is missing`);
      // Mark as followed up so we don't repeatedly fail on this broken conversation
      await CommerceConversationModel.findByIdAndUpdate(conversation._id, {
        $set: { followUpSent: true }
      });
      return;
    }

    if (merchant?.marketingAutomations?.abandonedCart === false) {
      logger.info(`[FollowUp] Abandoned cart follow-up disabled by merchant ${merchant._id}`);
      return;
    }

    const customerIdentifier = customer.phone || customer.platformId || "Unknown";

    try {
      logger.info(`[FollowUp] Triggering re-engagement for customer ${customerIdentifier} on ${merchant.businessName || "Unknown"}`);

      // 1. Generate personalized follow-up content using AI
      const messages = await CommerceMessageModel.find({ conversationId: conversation._id }).sort({ timestamp: -1 }).limit(6);
      const history = messages.reverse().map(m => `${m.sender === "customer" ? "Client" : "IA"}: ${m.content}`).join("\n");

      const prompt = `Génère un message de relance court et bienveillant pour ce client qui n'a pas fini sa commande.
Boutique : ${merchant.businessName || "Boutique"}
Ville : ${merchant.city || "Abidjan"}

Historique :
${history}

CONSIGNES :
- Très court (max 30 mots).
- Chaleureux, ton d'Afrique de l'Ouest (utiliser un emoji ✨).
- Demande simplement s'il a besoin d'aide pour finaliser ou s'il a une question sur la livraison.
- Ne sois PAS agressif commercialement.

Réponds UNIQUEMENT avec le texte du message.`;

      const aiResponse = await aiProvider.generateText({
        systemPrompt: "Tu es un vendeur expert spécialisé dans la relance client bienveillante.",
        userMessage: prompt,
        temperature: 0.7,
        maxTokens: 100
      });

      const followupText = aiResponse.text;

      // 2. Send the message
      await messagingService.sendMessage(merchant, conversation.platform, customer.phone || customer.platformId, followupText);

      // 3. Mark as followed up to avoid duplicate spam
      await CommerceConversationModel.findByIdAndUpdate(conversation._id, {
        $set: { followUpSent: true }
      });

      // 4. Save the AI follow-up message to history
      await CommerceMessageModel.create({
        conversationId: conversation._id,
        sender: 'ai',
        type: 'text',
        content: followupText,
        aiMetadata: { provider: aiResponse.provider, tokensUsed: aiResponse.usage.totalTokens }
      });

      logger.info(`[FollowUp] Re-engagement sent successfully to ${customerIdentifier}`);
    } catch (err: any) {
      logger.error(`[FollowUp] Failed to execute for ${customerIdentifier}:`, err.message);
    }
  }
}

export const followUpService = new FollowUpService();
