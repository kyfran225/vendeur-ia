import {
  CommerceMerchantModel,
  CommerceKnowledgeModel,
  CommerceProductModel,
  CommerceConversationModel,
  CommerceMessageModel,
  CommerceCustomerModel
} from "./commerce.model.js";
import { env } from "../../config/env.js";
import axios from "axios";

export class CommerceService {
  async getDashboard(ownerId: string) {
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return { merchant: null, metrics: null, products: [] };

    const products = await CommerceProductModel.find({ merchantId: merchant._id });
    const conversations = await CommerceConversationModel.find({ merchantId: merchant._id }).limit(10);

    return {
      merchant,
      products,
      conversations,
      metrics: {
        revenueToday: 0,
        ordersToday: 0,
        hotLeads: 0,
        conversationsToday: 0
      }
    };
  }

  async createMerchant(ownerId: string, input: any) {
    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId },
      { $set: { ...input, ownerId } },
      { upsert: true, new: true }
    );

    // Auto-create basic Knowledge Base
    await CommerceKnowledgeModel.findOneAndUpdate(
      { merchantId: merchant._id },
      {
        $setOnInsert: {
          merchantId: merchant._id,
          businessRules: {
            deliveryZones: [merchant.city],
            openingHours: "9h-19h",
            returnPolicy: "Échange possible sous 24h.",
            paymentMethods: ["wave", "orange_money"]
          },
          customInstructions: "Soyez poli et efficace. Vendez avec le sourire."
        }
      },
      { upsert: true }
    );

    return merchant;
  }

  async processAiMessage(merchantId: string, customerPhone: string, message: string, history: any[]) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) throw new Error("Merchant not found");

    const products = await CommerceProductModel.find({ merchantId });
    const knowledge = await CommerceKnowledgeModel.findOne({ merchantId });

    // AI Logic replicated from hold
    const productsStr = products.map(p => `- ${p.name}: ${p.price} ${p.currency}`).join("\n");
    const [merchantInstructions, merchantPayments] = (merchant.description || "").split("---");

    const prompt = `Tu es l'Expert Principal de Vente de "${merchant.businessName}" à ${merchant.city}.
Ton domaine : ${merchant.category}.
Catalogue:
${productsStr}

RÈGLES :
1. PROFESSIONNALISME : Ton poli et persuasif.
2. PAIEMENTS : ${merchantPayments || "Wave/Orange Money"}.
3. LIVRAISON : ${merchantInstructions || "Disponible partout"}.

HISTORIQUE: ${JSON.stringify(history)}
MESSAGE CLIENT: "${message}"

Réponds en max 60 mots. Sois direct et vends.`;

    try {
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        contents: [{ parts: [{ text: prompt }] }]
      });
      return response.data.candidates[0].content.parts[0].text.trim();
    } catch (err) {
      return `Bonjour ! ✨ Bienvenue chez ${merchant.businessName}. Comment puis-je vous aider ?`;
    }
  }

  async analyzeProductImage(imageBuffer: Buffer, mimeType: string) {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `Analyse cette image de produit et extrait les informations suivantes au format JSON :
{
  "name": "Nom du produit",
  "price": 10000,
  "category": "Catégorie",
  "description": "Description courte et vendeuse",
  "tags": ["tag1", "tag2"],
  "tiktokCaption": "Une légende accrocheuse pour TikTok avec des hashtags"
}
Si tu ne peux pas déterminer le prix, suggère un prix réaliste en FCFA (XOF) basé sur le type de produit. Réponds UNIQUEMENT avec le JSON.`;

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
      console.error("[Vision] Error:", error.response?.data || error.message);
      throw new Error("Erreur lors de l'analyse de l'image par l'IA");
    }
  }
}

export const commerceService = new CommerceService();
