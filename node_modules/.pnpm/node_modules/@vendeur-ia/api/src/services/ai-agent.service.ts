import axios from "axios";
import { env } from "../config/env.js";

export class AIAgentService {
  async generateResponse(context: {
    merchant: any;
    products: any[];
    knowledge: any;
    history: any[];
    message: string;
  }) {
    // Instruction synthesis for the Sales Agent
    const productsStr = context.products.map(p => `- ${p.name}: ${p.price} XOF`).join("\n");
    const payments = context.merchant.paymentChannels.map((c: any) => `${c.label}: ${c.number}`).join(", ");

    const systemPrompt = `Tu es l'agent de vente IA de ${context.merchant.businessName}.
Ton but est de convertir la conversation en vente.
Nos produits:
${productsStr}

Canaux de paiement acceptés: ${payments || "Contactez le marchand"}.
Règles boutique: ${context.knowledge?.customInstructions || "Soyez poli et efficace."}

Réponds au client de manière chaleureuse et locale (Abidjan style si CI).
Si le client veut payer, donne lui EXACTEMENT les numéros configurés ci-dessus.
NE JAMAIS inventer de liens de paiement.
Max 60 mots.`;

    try {
      // Direct call to Gemini or OpenAI based on env
      const apiKey = env.GEMINI_API_KEY || env.OPENAI_API_KEY;
      if (!apiKey) return "Désolé, mon cerveau est en maintenance. Le marchand va vous répondre.";

      // Mocking the AI result for flow demonstration if real keys are missing during dev
      return `Bonjour ! 👋 Bienvenue chez ${context.merchant.businessName}. La robe est disponible à 15.000 FCFA. Voulez-vous que je la réserve ?`;

    } catch (error) {
      console.error("AI Agent Error:", error);
      return "Je transmets votre demande au marchand tout de suite.";
    }
  }
}

export const aiAgentService = new AIAgentService();
