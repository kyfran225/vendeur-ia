import {
  CommerceMerchantModel,
  CommerceKnowledgeModel,
  CommerceProductModel,
  CommerceConversationModel,
  CommerceMessageModel,
  CommerceCustomerModel
} from "./commerce.model.js";
import { aiAgentService } from "../../services/ai-agent.service.js";

export class CommerceService {
  // ... existing methods ...

  async processAiMessage(merchantId: string, customerPhone: string, message: string, history: any[]) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) throw new Error("Merchant not found");

    const products = await CommerceProductModel.find({ merchantId });
    const knowledge = await CommerceKnowledgeModel.findOne({ merchantId });

    const formattedHistory = history.map(h => ({
      role: h.sender === "customer" ? "customer" : "ai" as const,
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
