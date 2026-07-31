import { CommerceMerchantModel, CommerceKnowledgeModel, CommerceProductModel, CommerceConversationModel } from "./commerce.model.js";
import { env } from "../../config/env.js";
import axios from "axios";
export class CommerceService {
    async getDashboard(ownerId) {
        const merchant = await CommerceMerchantModel.findOne({ ownerId });
        if (!merchant)
            return { merchant: null, metrics: null, products: [] };
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
    async createMerchant(ownerId, input) {
        const merchant = await CommerceMerchantModel.findOneAndUpdate({ ownerId }, { $set: { ...input, ownerId } }, { upsert: true, new: true });
        // Auto-create basic Knowledge Base
        await CommerceKnowledgeModel.findOneAndUpdate({ merchantId: merchant._id }, {
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
        }, { upsert: true });
        return merchant;
    }
    async processAiMessage(merchantId, customerPhone, message, history) {
        const merchant = await CommerceMerchantModel.findById(merchantId);
        if (!merchant)
            throw new Error("Merchant not found");
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
        }
        catch (err) {
            return `Bonjour ! ✨ Bienvenue chez ${merchant.businessName}. Comment puis-je vous aider ?`;
        }
    }
}
export const commerceService = new CommerceService();
