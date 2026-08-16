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
      const isWhatsAppConnected = merchant?.whatsappConfig?.status === 'connected';

      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const recentConversations = await CommerceConversationModel.countDocuments({
        merchantId,
        createdAt: { $gte: last7Days }
      });

      // 2. Prepare context for AI analysis
      const catalogueContext = products.slice(0, 20).map(p => `${p.name} (${p.price} XOF)`).join(', ');

      const context = `
        Données du commerce :
        - Nom : ${merchant?.businessName}
        - Nombre total de produits : ${totalProducts}
        - WhatsApp connecté : ${isWhatsAppConnected ? 'Oui' : 'Non'}
        - Produits en stock faible : ${lowStockProducts.join(', ') || 'Aucun'}
        - Conversations ces 7 derniers jours : ${recentConversations}
        - Instagram lié : ${isInstagramLinked ? 'Oui' : 'Non'}
        - TikTok lié : ${isTikTokLinked ? 'Oui' : 'Non'}
        - Catalogue (aperçu) : ${catalogueContext}${totalProducts > 20 ? '... (et d\'autres)' : ''}
      `;

      const prompt = `
        En tant qu'expert en stratégie de vente e-commerce et "Lead Guide" pour nouveaux vendeurs, analyse ces données.

        SI le commerce n'est pas encore 100% opérationnel (manque WhatsApp ou produits) :
        - Tes conseils doivent porter PRIORITAIREMENT sur ces étapes critiques.
        - Ton ton doit être celui d'un cofondateur expert qui guide le user pour réussir son lancement.
        - Sois très encourageant et pragmatique.

        CONSEILS : donne exactement 3 conseils ultra-courts (max 15 mots chacun).
        IMPORTANT : Ne mets PAS d'emoji au début ou à la fin du texte.
        Chaque conseil doit avoir une action associée parmi : "/products", "/settings?tab=connexions", "/settings?tab=boutique", "/inbox", "/marketing", "/orders".

        Réponds UNIQUEMENT avec un objet JSON valide au format exact suivant sans texte autour :
        {
          "tips": [
            { "text": "Optimisez vos descriptions de produits", "action": "/products" },
            { "text": "Activez vos alertes de stock pour anticiper", "action": "/products" },
            { "text": "Configurez vos paiements Mobile Money", "action": "/settings?tab=boutique" }
          ]
        }
      `;

      // 3. Generate advice using AI
      const response = await aiProvider.generateText({
        systemPrompt: "Tu es un coach en croissance pour vendeurs WhatsApp.",
        userMessage: `${context}\n\n${prompt}`,
        maxTokens: 1024,
        temperature: 0.7,
        jsonMode: true,
        thinkingLevel: "low",
      });

      const parsed = parseJsonFromAI<{ tips: { text: string; action: string }[] }>(response.text);

      // Secondary validation of the tips structure
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.tips)) {
        console.error("[AI Growth Service] Invalid tips structure:", parsed);
        throw new Error("Invalid AI advice structure");
      }

      // Filter out invalid tips
      parsed.tips = parsed.tips.filter(tip =>
        tip && typeof tip.text === 'string' && tip.text.length > 0 &&
        typeof tip.action === 'string' && tip.action.startsWith('/')
      );

      if (parsed.tips.length === 0) {
        throw new Error("No valid tips found in AI response");
      }

      return parsed;
    } catch (error) {
      console.error("[AI Growth Service] Error generating advice:", error);
      // Fallback tips if AI fails completely or returns invalid data
      return {
        tips: [
          { text: "Optimisez vos descriptions produits pour mieux vendre.", action: "/products" },
          { text: "Répondez rapidement à vos messages dans l'Inbox.", action: "/inbox" },
          { text: "Configurez vos canaux de paiement pour encaisser vos gains.", action: "/settings?tab=boutique" }
        ]
      };
    }
  }
}

export const aiGrowthService = new AIGrowthService();
