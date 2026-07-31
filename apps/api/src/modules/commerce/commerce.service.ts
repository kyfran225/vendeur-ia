import {
  CommerceMerchantModel,
  CommerceKnowledgeModel,
  CommerceProductModel,
  CommerceConversationModel,
  CommerceMessageModel,
  CommerceCustomerModel
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

    return {
      merchant,
      products,
      metrics: {
        revenueToday: 0, // Will be implemented with real orders later
        conversationsToday,
        hotLeads
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
}

export const commerceService = new CommerceService();
