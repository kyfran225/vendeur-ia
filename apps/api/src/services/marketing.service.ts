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
import { env } from "../config/env.js";

export class MarketingService {
  async getSegments(merchantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const vipCount = await CommerceCustomerModel.countDocuments({ merchantId, loyaltyPoints: { $gte: 50 } });
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

  async launchBroadcast(merchantId: string, productId: string, segment: string, customText?: string) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    const product = productId ? await CommerceProductModel.findById(productId) : null;
    if (!merchant) throw new Error("Marchand non trouvé");

    // 1. Find targets
    const query: any = { merchantId };
    if (segment === 'vip') query.loyaltyPoints = { $gte: 50 };
    if (segment === 'active') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.updatedAt = { $gte: thirtyDaysAgo };
    }

    const customers = await CommerceCustomerModel.find(query);
    console.log(`[Marketing] Launching broadcast to ${customers.length} customers in segment ${segment}`);

    // 2. Generate generic message if no custom text
    let messageBody = customText;
    if (!messageBody && product) {
        const { preview } = await this.generateBroadcastPreview(merchantId, productId, segment);
        messageBody = preview;
    }

    if (!messageBody) throw new Error("Message vide");

    // 2.1 Create Campaign for tracking
    const campaign = await MarketingCampaignModel.create({
        merchantId,
        productId,
        segment,
        content: messageBody,
        targetCount: customers.length,
        status: customers.length > 0 ? "active" : "completed"
    });

    // 3. Queue jobs with delay (e.g., 30s between each)
    for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];

        // Find or create conversation to log the marketing message
        let conversation = await CommerceConversationModel.findOne({ merchantId, customerId: customer._id });
        if (!conversation) {
            conversation = await CommerceConversationModel.create({ merchantId, customerId: customer._id });
        }

        await aiQueue.add('broadcast-message', {
            userId: merchant.ownerId,
            conversationId: conversation._id.toString(),
            remoteJid: customer.phone,
            content: messageBody.replace(/{{name}}/g, customer.name || "cher client"),
            merchantId: merchant._id.toString(),
            imageUrl: product?.images?.[0] || "", // Send first product image if available
            campaignId: campaign._id.toString()
        }, {
            delay: i * 30000, // 30 seconds interval
            attempts: 2
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
