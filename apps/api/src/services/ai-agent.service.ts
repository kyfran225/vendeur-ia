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
  platform?: "whatsapp" | "instagram" | "tiktok";
  customerPhone?: string;
  customerLoyalty?: {
    points: number;
    isVIP: boolean;
  };
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
    const { merchant, products, knowledge, customerPhone, customerLoyalty, platform = "whatsapp" } = context;

    const platformInstructions = {
      whatsapp: "Le client est sur WhatsApp. Si tu as besoin de son adresse, demande-lui de t'envoyer sa localisation WhatsApp ou son quartier précis.",
      instagram: "Le client est sur Instagram. Tu peux mentionner 'le lien dans ma bio' pour plus de photos ou le catalogue complet. Encourage le partage en story s'il est ravi.",
      tiktok: "Le client est sur TikTok. Utilise un ton encore plus dynamique et court. Mentionne que tes produits sont 'ceux de la vidéo' s'il pose des questions sur un post."
    };

    const productsStr = products
      .filter(p => p.availability !== "hidden")
      .map(p => {
        const stockStatus = p.stock <= 0 ? "ÉPUISÉ" : p.stock <= 5 ? `STOCK TRÈS LIMITÉ (${p.stock} restants)` : "Disponible";
        return `- ${p.name}: ${p.price} ${p.currency || "XOF"} [${stockStatus}] (${p.description || "Pas de description"})`;
      })
      .join("\n");

    const loyaltyStr = customerLoyalty
      ? `CLIENT : ${customerPhone}. Fidélité: ${customerLoyalty.points} points. Statut: ${customerLoyalty.isVIP ? "VIP (Très fidèle)" : "Habituel"}.`
      : `NOUVEAU CLIENT : ${customerPhone}.`;

    const paymentsStr = merchant.paymentChannels?.length
      ? merchant.paymentChannels.map(c => `${c.label}: ${c.number}`).join(", ")
      : "Contacter le marchand pour les détails de paiement.";

    const deliveryFeesStr = knowledge.businessRules?.deliveryFees?.length
      ? knowledge.businessRules.deliveryFees.map((f: any) => `- ${f.zone}: ${f.price} ${merchant.currency || "XOF"}`).join("\n")
      : "Tarif à discuter selon la zone.";

    const isWestAfrica = merchant.country === "CI" || merchant.country === "SN" || merchant.country === "BF";
    const localStyle = isWestAfrica
      ? `Style local d'Afrique de l'Ouest (chaleureux, direct, utilise des emojis comme ✨, 🚀, 👋).`
      : `Style professionnel, élégant et adapté à la culture de ${merchant.city}, ${merchant.country}.`;

    return `Tu es l'Expert Principal de Vente de "${merchant.businessName}" situé à ${merchant.city}, ${merchant.country}.
Ton but : Transformer chaque conversation en VENTE RÉELLE.

${loyaltyStr}
Si c'est un client VIP ou fidèle, commence par un accueil personnalisé reconnaissant sa loyauté.

CATALOGUE PRODUITS & STOCKS :
${productsStr || "Aucun produit disponible pour le moment."}

RÈGLES DE VENTE & URGENCE :
- Si un produit est marqué [STOCK TRÈS LIMITÉ], souligne subtilement qu'il part vite pour inciter à la réservation immédiate.
- Si un produit est [ÉPUISÉ], propose poliment un autre produit similaire du catalogue. Ne dis jamais "on n'a plus rien", sois proactif.
- LIVRAISON : Voici tes tarifs par zone :\n${deliveryFeesStr}\nSi la zone n'est pas dans la liste, demande l'adresse exacte et dis que tu vas voir avec le livreur pour le prix.
- PAIEMENTS : ${paymentsStr}.
- RETOURS : ${knowledge.businessRules?.returnPolicy || "Selon conditions du magasin"}.
- INSTRUCTIONS SPÉCIFIQUES : ${knowledge.customInstructions || "Sois le meilleur vendeur possible."}

TON ET PERSONA :
- Professionnel, Persuasif, Chaleureux.
- STYLE : ${localStyle}
- CANAL : ${platformInstructions[platform]}
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
`;
  }
}

export const aiAgentService = new AIAgentService();
