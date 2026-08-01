import {
  CommerceMerchantModel,
  CommerceKnowledgeModel,
  CommerceProductModel,
  CommerceConversationModel,
  CommerceMessageModel,
  CommerceCustomerModel,
  CommerceOrderModel
} from "./commerce.model.js";
import { aiAgentService } from "../../services/ai-agent.service.js";
import { aiGrowthService } from "../../services/ai-growth.service.js";
import { env } from "../../config/env.js";
import axios from "axios";

export class CommerceService {
  async getDashboard(ownerId: string) {
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return { merchant: null, products: [], metrics: {} };

    const products = await CommerceProductModel.find({ merchantId: merchant._id });

    // Simple metrics calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const conversationsToday = await CommerceConversationModel.countDocuments({
      merchantId: merchant._id,
      createdAt: { $gte: today }
    });

    const hotLeads = await CommerceCustomerModel.countDocuments({
      merchantId: merchant._id,
      leadScore: { $gte: 50 }
    });

    const aiGrowthAdvice = await aiGrowthService.generateGrowthAdvice(merchant._id.toString());

    // --- PIPELINE METRICS ---
    const ordersToday = await CommerceOrderModel.countDocuments({
      merchantId: merchant._id,
      createdAt: { $gte: today }
    });

    const paidOrdersToday = await CommerceOrderModel.find({
      merchantId: merchant._id,
      status: "paid",
      paidAt: { $gte: today }
    });

    const revenueToday = paidOrdersToday.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

    const conversionRate = conversationsToday > 0
      ? Math.round((ordersToday / conversationsToday) * 100)
      : 0;

    // --- PRODUCT PERFORMANCE ---
    const topProducts = await CommerceOrderModel.aggregate([
      { $match: { merchantId: merchant._id, status: "paid" } },
      { $unwind: "$items" },
      { $group: {
        _id: "$items.productId",
        name: { $first: "$items.name" },
        totalSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 3 }
    ]);

    return {
      merchant,
      products,
      metrics: {
        revenueToday,
        conversationsToday,
        hotLeads,
        ordersToday,
        conversionRate,
        topProducts
      },
      aiGrowthAdvice
    };
  }

  async createMerchant(ownerId: string, data: any) {
    const merchant = await CommerceMerchantModel.create({
      ownerId,
      ...data
    });

    // Initialize Knowledge Base
    await CommerceKnowledgeModel.create({
      merchantId: merchant._id,
      businessRules: {
        deliveryZones: [data.city || "Abidjan"],
        openingHours: "09:00 - 18:00",
        returnPolicy: "Retours acceptés sous 48h.",
        paymentMethods: ["Mobile Money", "Cash"]
      },
      customInstructions: `Vends avec passion les produits de ${data.businessName}.`
    });

    return merchant;
  }

  async updateMerchant(ownerId: string, data: any) {
    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId },
      { $set: data },
      { new: true }
    );
    if (!merchant) throw new Error("Merchant not found");
    return merchant;
  }

  async getKnowledge(merchantId: string) {
    let knowledge = await CommerceKnowledgeModel.findOne({ merchantId });
    if (!knowledge) {
      knowledge = await CommerceKnowledgeModel.create({
        merchantId,
        businessRules: {
          deliveryZones: ["Abidjan"],
          openingHours: "09:00 - 18:00",
          returnPolicy: "Retours acceptés sous 48h.",
          paymentMethods: ["Mobile Money", "Cash"]
        }
      });
    }
    return knowledge;
  }

  async updateKnowledge(merchantId: string, data: any) {
    const knowledge = await CommerceKnowledgeModel.findOneAndUpdate(
      { merchantId },
      { $set: data },
      { new: true, upsert: true }
    );
    return knowledge;
  }

  async processAiMessage(merchantId: string, customerPhone: string, message: string, history: any[]) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) throw new Error("Merchant not found");

    const products = await CommerceProductModel.find({ merchantId });
    const knowledge = await CommerceKnowledgeModel.findOne({ merchantId });

    const formattedHistory = history.map(h => ({
      role: (h.sender === "customer" ? "customer" : "ai") as "customer" | "ai",
      text: h.content
    }));

    return aiAgentService.generateResponse({
      merchant: merchant.toObject(),
      products: products.map(p => p.toObject()),
      knowledge: knowledge ? (knowledge.toObject() as any) : {},
      history: formattedHistory,
      message,
      customerPhone
    });
  }

  async validatePaymentProof(imageBuffer: Buffer, mimeType: string) {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `Analyse cette capture d'écran de paiement Mobile Money (Wave, Orange Money, MTN, etc.) et extrait les informations suivantes au format JSON :
{
  "isPaymentProof": true/false,
  "amount": number,
  "transactionId": "string",
  "platform": "Wave" | "Orange Money" | "MTN" | "Autre",
  "status": "success" | "pending" | "failed",
  "date": "string"
}
Réponds UNIQUEMENT avec le JSON. Si ce n'est pas une preuve de paiement, mets isPaymentProof à false.`;

    try {
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: imageBuffer.toString("base64")
              }
            }
          ]
        }]
      });

      const text = response.data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI response");

      return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      console.error("[Payment Validation] Error:", error.response?.data || error.message);
      throw new Error("Erreur lors de la validation du paiement par l'IA");
    }
  }

  async analyzeProductImage(imageBuffer: Buffer, mimeType: string) {
    // 1. Primary: Gemini Vision
    if (env.GEMINI_API_KEY) {
      try {
        const prompt = `Analyse cette image de produit et extrait les informations suivantes au format JSON :
{
  "name": "Nom accrocheur du produit",
  "price": number (prix estimé ou 0 si inconnu, en FCFA),
  "description": "Description vendeuse et détaillée",
  "category": "Catégorie (ex: Mode, Électronique, Maison)",
  "tags": ["tag1", "tag2"]
}
Réponds UNIQUEMENT avec le JSON. Sois précis et utilise un ton vendeur.`;

        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: imageBuffer.toString("base64")
                }
              }
            ]
          }]
        });

        const text = response.data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (error: any) {
        console.warn("[Product Vision] Gemini failed, falling back to smart defaults:", error.message);
      }
    }

    // 2. Fallback: Smart Default (Vision is exclusive to Gemini for now,
    // but we return a valid structure so the merchant can edit it)
    return {
      name: "Nouveau Produit",
      price: 0,
      description: "Analyse d'image temporairement indisponible. Veuillez saisir les détails manuellement.",
      category: "Divers",
      tags: ["ia_fallback"]
    };
  }

  async generateProductCaption(productId: string) {
    const product = await CommerceProductModel.findById(productId);
    if (!product) throw new Error("Produit non trouvé");

    const merchant = await CommerceMerchantModel.findById(product.merchantId);
    if (!merchant) throw new Error("Marchand non trouvé");

    const prompt = `Génère une légende percutante pour les réseaux sociaux (TikTok/Instagram) pour ce produit.
Produit : ${product.name}
Prix : ${product.price} ${product.currency}
Description : ${product.description || "Pas de description"}
Boutique : ${merchant.businessName}
Ville : ${merchant.city}

Format attendu :
- Une accroche forte (Hook)
- 3 à 5 points clés avec des emojis
- Un appel à l'action clair (CTA)
- Des hashtags pertinents

Le ton doit être très vendeur, dynamique et adapté à une audience d'Afrique de l'Ouest (chaleureux et direct).`;

    const caption = await aiProvider.generateText({
      systemPrompt: "Tu es un expert en marketing digital et copywriting spécialisé dans la vente sur les réseaux sociaux.",
      userMessage: prompt,
      temperature: 0.8,
      maxTokens: 500
    });

    return { caption };
  }

  async generateFollowUp(conversationId: string) {
    const conversation = await CommerceConversationModel.findById(conversationId).populate("customerId");
    if (!conversation) throw new Error("Conversation non trouvée");

    const merchant = await CommerceMerchantModel.findById(conversation.merchantId);
    if (!merchant) throw new Error("Marchand non trouvé");

    const messages = await CommerceMessageModel.find({ conversationId }).sort({ timestamp: -1 }).limit(10);
    const history = messages.reverse().map(m => `${m.sender === "customer" ? "Client" : "IA"}: ${m.content}`).join("\n");

    const prompt = `Génère un message de relance court et chaleureux pour ce client qui n'a pas fini sa commande.
Boutique : ${merchant.businessName}
Historique récent :
${history}

Le message doit être :
- Très court (max 40 mots)
- Chaleureux et sans pression excessive
- Utiliser un emoji local ✨
- Proposer son aide pour finaliser ou répondre à une question

Réponds UNIQUEMENT avec le texte du message.`;

    const followup = await aiProvider.generateText({
      systemPrompt: "Tu es un vendeur expert spécialisé dans la relance client bienveillante.",
      userMessage: prompt,
      temperature: 0.7,
      maxTokens: 150
    });

    return { followup };
  }

  async generateDigitalReceipt(orderId: string) {
    const order = await CommerceOrderModel.findById(orderId).populate("merchantId customerId");
    if (!order) throw new Error("Commande non trouvée");

    const merchant = order.merchantId as any;
    const customer = order.customerId as any;

    const date = new Date(order.createdAt).toLocaleDateString("fr-FR");
    const time = new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

    let itemsStr = order.items.map(item => `${item.quantity}x ${item.name} - ${item.price * item.quantity} ${order.currency}`).join("\n");

    const receipt = `
🧾 *REÇU DE COMMANDE - ${merchant.businessName}*
---------------------------------------
Date: ${date} à ${time}
Client: ${customer.phone}
---------------------------------------
DÉTAILS :
${itemsStr}
---------------------------------------
*TOTAL : ${order.totalAmount} ${order.currency}*
---------------------------------------
Merci de votre confiance ! ✨
Points Fidélité gagnés: +${Math.floor(order.totalAmount / 1000)}
    `.trim();

    return receipt;
  }

  async confirmOrderPayment(orderId: string) {
    const order = await CommerceOrderModel.findById(orderId);
    if (!order) throw new Error("Order not found");

    if (order.status === "paid") return order;

    order.status = "paid";
    order.paidAt = new Date();
    await order.save();

    // Loyalty Points Logic: 1 point per 1000 XOF
    const pointsToAdd = Math.floor(order.totalAmount / 1000);
    if (pointsToAdd > 0) {
      await CommerceCustomerModel.findByIdAndUpdate(order.customerId, {
        $inc: { loyaltyPoints: pointsToAdd }
      });
    }

    return order;
  }
}

export const commerceService = new CommerceService();
