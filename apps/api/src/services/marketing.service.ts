import {
  CommerceCustomerModel,
  CommerceProductModel,
  CommerceMerchantModel,
  CommerceConversationModel,
  CommerceMessageModel,
  MarketingCampaignModel
} from "../modules/commerce/commerce.model.js";
import { aiProvider } from "./ai-provider.js";
import { aiQueue } from "./ai-queue.service.js";
import { messagingService } from "./messaging.service.js";
import { pushService } from "./push.service.js";
import { broadcastLimiter } from "./broadcast-limiter.service.js";
import { logger } from "./logger.service.js";
import { env } from "../config/env.js";

export class MarketingService {
  async getSegments(merchantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const merchant = await CommerceMerchantModel.findById(merchantId);
    const vipThreshold = merchant?.loyaltySettings?.threshold || 50;

    const vipCount = await CommerceCustomerModel.countDocuments({ merchantId, loyaltyPoints: { $gte: vipThreshold } });
    const activeCount = await CommerceCustomerModel.countDocuments({
        merchantId,
        updatedAt: { $gte: thirtyDaysAgo }
    });
    const totalCount = await CommerceCustomerModel.countDocuments({ merchantId });

    return {
      vip: vipCount,
      active: activeCount,
      all: totalCount
    };
  }

  async getCampaigns(merchantId: string) {
    return MarketingCampaignModel.find({ merchantId }).sort({ createdAt: -1 }).limit(10);
  }

  async generateBroadcastPreview(merchantId: string, productId: string, segment: string) {
    const product = await CommerceProductModel.findById(productId);
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!product || !merchant) throw new Error("Produit ou Marchand non trouvé");

    const prompt = `Génère un message de diffusion WhatsApp pour promouvoir ce produit auprès de mes clients ${segment}.
Produit : ${product.name}
Prix : ${product.price} ${product.currency}
Boutique : ${merchant.businessName}

Le message doit être :
- Très vendeur et enthousiaste
- Utiliser des emojis locaux ✨🚀
- Segment : ${segment === 'vip' ? 'Clients Fidèles/VIP' : 'Tous les clients'}
- Si VIP, mentionne un traitement spécial ou une avant-première.
- Inclure un appel à l'action clair : "Répondez à ce message pour réserver !"

Réponds UNIQUEMENT avec le texte du message.`;

    const response = await aiProvider.generateText({
      systemPrompt: "Tu es un expert en marketing WhatsApp spécialisé dans la vente directe.",
      userMessage: prompt,
      temperature: 0.8,
      maxTokens: 200
    });

    return { preview: response.text };
  }

  async launchBroadcast(merchantId: string, productId: string, segment: string, customText: string, personalization: "basic" | "ai_creative" = "basic") {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) throw new Error("Marchand non trouvé");

    // 1. Precise Segmentation
    const query: any = { merchantId };
    const vipThreshold = merchant.loyaltySettings?.threshold || 50;
    if (segment === 'vip') query.loyaltyPoints = { $gte: vipThreshold };
    if (segment === 'inactive') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.updatedAt = { $lt: thirtyDaysAgo };
    }

    const customers = await CommerceCustomerModel.find(query);
    if (customers.length === 0) throw new Error("Aucun client trouvé dans ce segment.");

    // 1.2 Fetch Product Media if applicable
    let imageUrl = "";
    let productDetails = "";
    if (productId) {
      const product = await CommerceProductModel.findById(productId);
      if (product) {
        imageUrl = product.images?.[0] || "";
        productDetails = `Produit: ${product.name}, Prix: ${product.price} ${product.currency}, Description: ${product.description}`;
      }
    }

    // 1.5 Quota Check
    await broadcastLimiter.checkQuota(merchantId, customers.length);

    // 2. Create Campaign for detailed tracking
    const campaign = await MarketingCampaignModel.create({
        merchantId,
        productId,
        segment,
        content: customText,
        targetCount: customers.length,
        personalizationLevel: personalization,
        status: "active"
    });

    logger.info(`[Marketing] Launching ${personalization} broadcast to ${customers.length} customers for ${merchant.businessName}`);

    // 3. Queue jobs with "Human Throttling" (Safe Delivery)
    // Delay starts at 5s, increments randomly to avoid patterns
    let currentDelay = 5000;

    for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];

        // Randomly add 20-45 seconds between messages
        const throttleDelay = Math.floor(Math.random() * (45000 - 20000 + 1) + 20000);
        currentDelay += throttleDelay;

        await aiQueue.add('broadcast-message', {
            userId: merchant.ownerId,
            merchantId: merchant._id.toString(),
            customerId: customer._id.toString(),
            remoteJid: customer.phone,
            content: customText, // Raw idea, AI worker will personalize it
            imageUrl, // Attach product image
            productDetails, // Provide context for AI personalization
            personalization,
            campaignId: campaign._id.toString()
        }, {
            delay: currentDelay,
            attempts: 2,
            removeOnComplete: true
        });
    }

    return { count: customers.length, campaignId: campaign._id };
  }

  async generateReconquestMessage(merchantId: string) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) throw new Error("Marchand non trouvé");

    // 1. Gather "Fear of Missing Out" (FOMO) Stats
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Count missed opportunities (active conversations that were abandoned)
    const activeConvs = await CommerceConversationModel.countDocuments({
      merchantId,
      updatedAt: { $gte: sevenDaysAgo }
    });

    const prompt = `Génère un message de reconquête WhatsApp pour un marchand suspendu depuis 7 jours.
Boutique : ${merchant.businessName}
Activité manquée : Environ ${activeConvs > 0 ? activeConvs : 5} conversations clients ont eu lieu ou auraient pu aboutir récemment.

Le message doit :
- Être bienveillant mais montrer ce que le marchand perd (FOMO).
- Utiliser un ton d'assistant business dévoué ("Chef", "Patron").
- Mentionner que l'IA attend ses instructions pour reprendre le travail.
- Inclure un lien vers le renouvellement : ${env.CLIENT_URL}/settings?tab=billing
- Utiliser des expressions ivoiriennes/locales discrètes (ex: "On est ensemble", "Ça bouge pas").

Réponds UNIQUEMENT avec le texte du message.`;

    const response = await aiProvider.generateText({
      systemPrompt: "Tu es le consultant business IA de la plateforme Vendeur IA.",
      userMessage: prompt,
      temperature: 0.7
    });

    return response.text;
  }

  async sendReconquestNotification(merchantId: string) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) return;

    const message = await this.generateReconquestMessage(merchantId);

    // 1. WhatsApp
    await messagingService.sendMessage(merchant, 'whatsapp', merchant.whatsappNumber || "", message);

    // 2. Push
    await pushService.sendNotification(merchant.ownerId, {
      title: "Votre IA vous attend ! 🤖",
      body: "Ne laissez pas vos clients sans réponse. Réactivez votre service en un clic.",
      data: { type: "billing", action: "renew" }
    });
  }
}

export const marketingService = new MarketingService();
