import { CommerceProductModel, CommerceConversationModel, CommerceMessageModel, CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import { aiProvider } from "./ai-provider.js";
import { parseJsonFromAI } from "../utils/parse-ai-json.js";

export class AIGrowthService {
  async generateGrowthAdvice(merchantId: string) {
    try {
      // 1. Collect real data for analysis
      const merchant = await CommerceMerchantModel.findById(merchantId);
      const products = await CommerceProductModel.find({ merchantId });
      const totalProducts = products.length;
      const lowStockProducts = products.filter(p => p.stock < 5).map(p => p.name);

      const isInstagramLinked = !!merchant?.instagramConfig?.accessToken;
      const isTikTokLinked = !!merchant?.tiktokConfig?.accessToken;

      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const recentConversations = await CommerceConversationModel.countDocuments({
        merchantId,
        createdAt: { $gte: last7Days }
      });

      // 2. Prepare context for AI analysis
      const context = `
        Données du commerce :
        - Nombre total de produits : ${totalProducts}
        - Produits en stock faible : ${lowStockProducts.join(', ') || 'Aucun'}
        - Conversations ces 7 derniers jours : ${recentConversations}
        - Instagram lié : ${isInstagramLinked ? 'Oui' : 'Non'}
        - TikTok lié : ${isTikTokLinked ? 'Oui' : 'Non'}
        - Catalogue : ${products.map(p => `${p.name} (${p.price} XOF)`).join(', ')}
      `;

      const prompt = `
        En tant qu'expert en stratégie de vente e-commerce omnicanal, analyse ces données et donne 3 conseils ultra-courts (max 15 mots chacun).
        Si Instagram ou TikTok n'est pas lié, suggère-le fortement comme levier de croissance.

        IMPORTANT : Ne mets PAS d'emoji au début ou à la fin du texte.
        Chaque conseil doit avoir une action associée parmi : "/products", "/settings?tab=connexions", "/settings?tab=boutique", "/inbox", "/marketing", "/orders".

        Réponds au format JSON uniquement :
        {
          "tips": [
            { "text": "Conseil sans emoji", "action": "/path" },
            ...
          ]
        }
      `;

      // 3. Generate advice using AI
      const response = await aiProvider.generateText({
        systemPrompt: "Tu es un coach en croissance pour vendeurs WhatsApp.",
        userMessage: `${context}\n\n${prompt}`,
        maxTokens: 512,
        temperature: 0.7,
        jsonMode: true,
        thinkingLevel: "low",
      });

      const parsed = parseJsonFromAI<{ tips: { text: string; action: string }[] }>(response.text);
      if (!Array.isArray(parsed.tips) || parsed.tips.length === 0) {
        throw new Error("Invalid AI advice format");
      }

      return parsed;
    } catch (error) {
      console.error("[AI Growth Service] Error:", error);
      return {
        tips: [
          { text: "Ajoutez vos premiers produits pour créer votre catalogue.", action: "/products" },
          { text: "Reliez Instagram pour générer du trafic et vos premières ventes.", action: "/settings?tab=connexions" },
          { text: "Configurez vos moyens de paiement pour encaisser vos gains.", action: "/settings?tab=boutique" }
        ]
      };
    }
  }
}

export const aiGrowthService = new AIGrowthService();
