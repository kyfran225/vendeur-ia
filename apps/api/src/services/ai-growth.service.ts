import { CommerceProductModel, CommerceConversationModel, CommerceMessageModel, CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import { aiProvider } from "./ai-provider.js";

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
        Utilise des emojis.
        Réponds au format JSON uniquement :
        {
          "tips": [
            "✨ Conseil 1",
            "🚀 Conseil 2",
            "💡 Conseil 3"
          ]
        }
      `;

      // 3. Generate advice using AI
      const response = await aiProvider.generateText({
        systemPrompt: "Tu es un coach en croissance pour vendeurs WhatsApp.",
        userMessage: `${context}\n\n${prompt}`,
        maxTokens: 200,
        temperature: 0.7
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI advice");

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("[AI Growth Service] Error:", error);
      return {
        tips: [
          "✨ Ajoutez plus de photos à vos produits pour attirer l'attention.",
          "🚀 Partagez votre lien WhatsApp sur vos réseaux sociaux.",
          "💡 Répondez rapidement aux clients pour maximiser les conversions."
        ]
      };
    }
  }
}

export const aiGrowthService = new AIGrowthService();
