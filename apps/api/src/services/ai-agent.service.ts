import { aiProvider } from "./ai-provider.js";

export interface SalesContext {
  merchant: {
    businessName: string;
    category: string;
    city: string;
    country: string;
    description?: string;
    paymentChannels?: any[];
  };
  products: any[];
  knowledge: {
    businessRules?: {
      deliveryZones?: string[];
      openingHours?: string;
      returnPolicy?: string;
      paymentMethods?: string[];
    };
    faq?: { question: string; answer: string }[];
    customInstructions?: string;
  };
  history: { role: "customer" | "ai"; text: string }[];
  message: string;
  customerPhone?: string;
}

export class AIAgentService {
  async generateResponse(context: SalesContext): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);

    return aiProvider.generateText({
      systemPrompt,
      userMessage: context.message,
      history: context.history,
      maxTokens: 250,
      temperature: 0.7
    });
  }

  private buildSystemPrompt(context: SalesContext): string {
    const { merchant, products, knowledge, customerPhone } = context;

    const productsStr = products
      .filter(p => p.availability !== "sold_out" && p.availability !== "hidden")
      .map(p => `- ${p.name}: ${p.price} ${p.currency || "XOF"} (${p.description || "Pas de description"})`)
      .join("\n");

    const paymentsStr = merchant.paymentChannels?.length
      ? merchant.paymentChannels.map(c => `${c.label}: ${c.number}`).join(", ")
      : "Contacter le marchand pour les détails de paiement.";

    const deliveryStr = knowledge.businessRules?.deliveryZones?.join(", ") || "À discuter avec le client.";

    const isWestAfrica = merchant.country === "CI" || merchant.country === "SN" || merchant.country === "BF";
    const localStyle = isWestAfrica
      ? `Style local d'Afrique de l'Ouest (chaleureux, direct, utilise des emojis comme ✨, 🚀, 👋).`
      : `Style professionnel, élégant et adapté à la culture de ${merchant.city}, ${merchant.country}.`;

    return `Tu es l'Expert Principal de Vente de "${merchant.businessName}" situé à ${merchant.city}, ${merchant.country}.
Ton but : Transformer chaque conversation en VENTE RÉELLE.

CATALOGUE PRODUITS :
${productsStr || "Aucun produit disponible pour le moment."}

RÈGLES DE VENTE :
- LIVRAISON : ${deliveryStr}. Frais : ${knowledge.businessRules?.openingHours || "Voir avec le client"}.
- PAIEMENTS : ${paymentsStr}.
- RETOURS : ${knowledge.businessRules?.returnPolicy || "Selon conditions du magasin"}.
- INSTRUCTIONS SPÉCIFIQUES : ${knowledge.customInstructions || "Sois le meilleur vendeur possible."}

TON ET PERSONA :
- Professionnel, Persuasif, Chaleureux.
- STYLE : ${localStyle}
- ADAPTATION : Adapte ton langage, tes expressions et tes références culturelles à la ville de ${merchant.city}. Cela s'applique à tes réponses ÉCRITES et à tes transcriptions/interactions VOCALES. Ton "intonation" textuelle doit refléter la politesse locale.
- LANGUE : Réponds TOUJOURS dans la langue du client (Français, Anglais, Espagnol, etc.).

STRATÉGIE DE VENTE (AIDA) :
1. ATTENTION : Salue chaleureusement.
2. INTÉRÊT : Valide le besoin du client avec expertise.
3. DÉSIR : Mets en avant les bénéfices du produit et sa disponibilité.
4. ACTION : Sois HYPER-CONCRET. Propose de réserver, donne les numéros de paiement ou demande l'adresse de livraison.

DÉTECTION DE PAIEMENT :
- Si le client dit qu'il a payé ou envoyé l'argent, demande-lui poliment une capture d'écran du reçu de transfert (Wave, Orange, etc.) s'il ne l'a pas encore fait.
- Sois prêt à confirmer la réception dès qu'une preuve est mentionnée.

RÈGLES D'OR :
- Max 70 mots. Sois percutant.
- Ne demande JAMAIS l'adresse au premier message de salutation.
- Inculque un sentiment d'urgence ou d'exclusivité.
- Si le client demande le prix, donne-le CLAIREMENT avec la devise.
${customerPhone ? `- Le numéro du client est ${customerPhone}.` : ""}
`;
  }
}

export const aiAgentService = new AIAgentService();
