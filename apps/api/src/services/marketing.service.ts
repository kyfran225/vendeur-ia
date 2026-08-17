import mongoose from "mongoose";
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
    const inactiveCount = await CommerceCustomerModel.countDocuments({
        merchantId,
        updatedAt: { $lt: thirtyDaysAgo }
    });
    const totalCount = await CommerceCustomerModel.countDocuments({ merchantId });

    // Aggregate customers by location/city
    const rawCities = await CommerceCustomerModel.aggregate([
      {
        $match: {
          merchantId: new mongoose.Types.ObjectId(merchantId),
          location: { $exists: true, $ne: "" }
        }
      },
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$location" } } },
          displayName: { $first: "$location" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const cities = rawCities.map(c => ({
      name: c.displayName,
      slug: c._id,
      count: c.count
    }));

    return {
      vip: vipCount,
      active: activeCount,
      inactive: inactiveCount,
      all: totalCount,
      cities
    };
  }

  async getCampaigns(merchantId: string) {
    return MarketingCampaignModel.find({ merchantId }).sort({ createdAt: -1 }).limit(10);
  }

  async recordCustomerReply(merchantId: string, customerId: string) {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const campaign = await MarketingCampaignModel.findOne({
        merchantId,
        createdAt: { $gte: twentyFourHoursAgo },
        repliedCustomerIds: { $ne: new mongoose.Types.ObjectId(customerId) }
      }).sort({ createdAt: -1 });

      if (campaign) {
        await MarketingCampaignModel.updateOne(
          { _id: campaign._id },
          {
            $inc: { repliedCount: 1 },
            $addToSet: { repliedCustomerIds: new mongoose.Types.ObjectId(customerId) }
          }
        );
        logger.info(`[Marketing] Recorded engagement reply from customer ${customerId} for campaign ${campaign._id}`);
      }
    } catch (err: any) {
      logger.warn(`[Marketing] Failed to record customer reply engagement: ${err.message}`);
    }
  }

  async recordCampaignConversion(merchantId: string, customerId: string, orderId: string, orderAmount: number) {
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const campaign = await MarketingCampaignModel.findOne({
        merchantId,
        createdAt: { $gte: fortyEightHoursAgo },
        convertedOrderIds: { $ne: new mongoose.Types.ObjectId(orderId) }
      }).sort({ createdAt: -1 });

      if (campaign && orderAmount > 0) {
        await MarketingCampaignModel.updateOne(
          { _id: campaign._id },
          {
            $inc: { revenueGenerated: orderAmount, ordersCount: 1 },
            $addToSet: { convertedOrderIds: new mongoose.Types.ObjectId(orderId) }
          }
        );
        logger.info(`[Marketing] Recorded campaign ROI conversion: +${orderAmount} XOF on campaign ${campaign._id} from order ${orderId}`);
      }
    } catch (err: any) {
      logger.warn(`[Marketing] Failed to record campaign conversion: ${err.message}`);
    }
  }

  async generateBroadcastPreview(merchantId: string, productId: string, segment: string, template: string = "standard") {
    const product = await CommerceProductModel.findById(productId);
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!product || !merchant) throw new Error("Produit ou Marchand non trouvé");

    let segmentLabel = "Tous les clients";
    if (segment === "vip") segmentLabel = "Clients Fidèles / VIP";
    else if (segment === "inactive") segmentLabel = "Clients Inactifs (> 30 jours)";
    else if (segment.startsWith("city:")) segmentLabel = `Clients situés à ${segment.replace("city:", "")}`;

    let templateInstruction = "Ton accroche doit être très vendeuse, enthousiaste et percutante.";
    if (template === "flash_sale") {
      templateInstruction = "Angle VENTE FLASH ⚡ : Insiste sur l'urgence extrême (valable seulement 24h ou aujourd'hui), stock très limité et réduction immédiate.";
    } else if (template === "new_arrival") {
      templateInstruction = "Angle NOUVEL ARRIVAGE ✨ : Présente ce produit comme la grande nouveauté tendance qui vient d'arriver en boutique, en exclusivité.";
    } else if (template === "vip_privilege") {
      templateInstruction = "Angle PRIVILÈGE VIP 👑 : Remercie le client pour sa fidélité et offre-lui un traitement spécial ou une réservation prioritaire avant tout le monde.";
    } else if (template === "clearance") {
      templateInstruction = "Angle DÉSTOCKAGE / LIQUIDATION 📦 : Insiste sur les derniers articles en stock avant rupture définitive à prix imbattable.";
    } else if (template === "friendly_checkin") {
      templateInstruction = "Angle CONSEIL & RELATION CLIENT 💬 : Adopte un ton très amical, prends des nouvelles chaleureuses et recommande ce produit comme une pépite pensée pour lui.";
    }

    const prompt = `Génère un message de diffusion WhatsApp pour promouvoir ce produit auprès de mes clients : ${segmentLabel}.
Produit : ${product.name}
Prix : ${product.price} ${product.currency}
Boutique : ${merchant.businessName}

Directive commerciale :
- ${templateInstruction}
- Emojis locaux et attractifs ✨🚀
- Ciblage : ${segmentLabel}
- Inclure un appel à l'action clair : "Répondez à ce message pour réserver !" ou "Tapez 1 pour commander !"
- Utiliser la variable {{name}} pour le prénom du client.

Réponds UNIQUEMENT avec le texte du message.`;

    const response = await aiProvider.generateText({
      systemPrompt: "Tu es un expert d'élite en copywriting WhatsApp et social commerce africain.",
      userMessage: prompt,
      temperature: 0.8,
      maxTokens: 220
    });

    return { preview: response.text, template };
  }

  async launchBroadcast(
    merchantId: string,
    productId: string,
    segment: string,
    customText: string,
    personalization: "basic" | "ai_creative" = "basic",
    scheduledAt?: string | Date
  ) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) throw new Error("Marchand non trouvé");

    if (!customText || !customText.trim()) {
      throw new Error("Le message de la campagne ne peut pas être vide.");
    }

    // 1. Precise Segmentation
    const query: any = { merchantId };
    const vipThreshold = merchant.loyaltySettings?.threshold || 50;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (segment === 'vip') {
      query.loyaltyPoints = { $gte: vipThreshold };
    } else if (segment === 'active') {
      query.updatedAt = { $gte: thirtyDaysAgo };
    } else if (segment === 'inactive') {
      query.updatedAt = { $lt: thirtyDaysAgo };
    } else if (segment.startsWith("city:")) {
      const cityName = segment.replace("city:", "").trim();
      query.location = { $regex: new RegExp(`^${cityName}$`, "i") };
    }

    const customers = await CommerceCustomerModel.find(query);
    if (customers.length === 0) {
      throw new Error(`Aucun client trouvé dans le segment "${segment}".`);
    }

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

    // 1.8 Handle Scheduling
    let initialDelay = 5000;
    let campaignStatus: "active" | "scheduled" = "active";
    let scheduledDate: Date | null = null;

    if (scheduledAt) {
      const targetTime = new Date(scheduledAt).getTime();
      const now = Date.now();
      if (!isNaN(targetTime) && targetTime > now) {
        initialDelay = targetTime - now;
        campaignStatus = "scheduled";
        scheduledDate = new Date(scheduledAt);
      }
    }

    // 2. Create Campaign for detailed tracking
    const campaign = await MarketingCampaignModel.create({
        merchantId,
        productId: productId || null,
        segment,
        content: customText,
        targetCount: customers.length,
        personalizationLevel: personalization,
        scheduledAt: scheduledDate,
        status: campaignStatus
    });

    logger.info(`[Marketing] Launching ${personalization} broadcast to ${customers.length} customers for ${merchant.businessName} (Status: ${campaignStatus})`);

    // 3. Queue jobs with "Human Throttling" (Safe Delivery)
    let currentDelay = initialDelay;

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

    return {
      count: customers.length,
      campaignId: campaign._id,
      status: campaignStatus,
      scheduledAt: scheduledDate
    };
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

  /**
   * Scans conversations inactive for 2h - 24h where a client inquired about a product
   * or expressed purchase intent without completing the order, and sends a smart follow-up.
   */
  async recoverAbandonedConversations(merchantId: string) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) return { recovered: 0 };

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const staleConversations = await CommerceConversationModel.find({
      merchantId,
      status: "active",
      updatedAt: { $gte: twentyFourHoursAgo, $lte: twoHoursAgo }
    }).populate("customerId").limit(10);

    let queuedCount = 0;

    for (const conv of staleConversations) {
      const customer = conv.customerId as any;
      if (!customer || !customer.phone) continue;

      const lastMsg = await CommerceMessageModel.findOne({ conversationId: conv._id })
        .sort({ timestamp: -1 });

      if (lastMsg && lastMsg.sender === "ai") {
        const followUpPrompt = `Génère une relance courte, bienveillante et courtoise pour un client sur WhatsApp.
Boutique : "${merchant.businessName}"
Client : "${customer.name || 'Client'}"
Dernier échange : "${lastMsg.content?.slice(0, 150)}"
Objectif : Savoir s'il a encore besoin d'aide ou s'il souhaite valider sa commande avant rupture de stock.
Format : 2 phrases courtes maximum, chaleureux avec 1 emoji.`;

        const aiFollowUp = await aiProvider.generateText({
          systemPrompt: `Tu es le conseiller commercial de ${merchant.businessName}.`,
          userMessage: followUpPrompt,
          maxTokens: 120,
          temperature: 0.7
        }).catch(() => null);

        if (aiFollowUp?.text) {
          await messagingService.sendMessage(merchant, 'whatsapp', customer.phone, aiFollowUp.text).catch(err =>
            logger.warn(`[CartRecovery] Follow-up failed for customer ${customer.phone}:`, err.message)
          );
          queuedCount++;
        }
      }
    }

    return { recovered: queuedCount };
  }
}

export const marketingService = new MarketingService();
