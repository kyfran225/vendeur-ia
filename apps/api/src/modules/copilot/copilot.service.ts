import mongoose from "mongoose";
import { aiProvider } from "../../services/ai-provider.js";
import { pushService } from "../../services/push.service.js";
import { logger } from "../../services/logger.service.js";
import { UserModel } from "../auth/user.model.js";
import {
  CommerceMerchantModel,
  CommerceProductModel,
  CommerceOrderModel,
  CommerceKnowledgeModel,
  CommerceConversationModel
} from "../commerce/commerce.model.js";
import {
  CopilotMessageModel,
  CopilotTicketModel,
  ICopilotMessage,
  ICopilotTicket
} from "./copilot.model.js";

export interface CopilotChatPayload {
  merchantId: string;
  userMessage: string;
  pageRoute?: string;
  userEmail?: string;
  userPhone?: string;
}

export interface SuggestedAction {
  type: "navigate" | "modal" | "action" | "founder_alert";
  label: string;
  payload: string;
}

export interface CopilotChatResponse {
  message: string;
  actions: SuggestedAction[];
  founderAlertSent?: boolean;
  storeHealthSummary?: {
    businessName: string;
    whatsappStatus: string;
    productCount: number;
    pendingOrdersCount: number;
    plan: string;
  };
}

export class CopilotService {
  /**
   * Extract high-fidelity real-time context from the merchant's store
   */
  async getMerchantContext(merchantId: string, pageRoute: string = "/dashboard") {
    const merchantObjId = new mongoose.Types.ObjectId(merchantId);

    const [merchant, products, orders, knowledge, conversationsCount] = await Promise.all([
      CommerceMerchantModel.findById(merchantObjId).lean(),
      CommerceProductModel.find({ merchantId: merchantObjId }).limit(10).lean(),
      CommerceOrderModel.find({ merchantId: merchantObjId }).sort({ createdAt: -1 }).limit(10).lean(),
      CommerceKnowledgeModel.findOne({ merchantId: merchantObjId }).lean(),
      CommerceConversationModel.countDocuments({ merchantId: merchantObjId })
    ]);

    if (!merchant) {
      throw new Error("Commerçant introuvable");
    }

    const totalProducts = await CommerceProductModel.countDocuments({ merchantId: merchantObjId });
    const outOfStockCount = await CommerceProductModel.countDocuments({
      merchantId: merchantObjId,
      $or: [{ stock: { $lte: 0 } }, { availability: "sold_out" }]
    });
    const featuredCount = await CommerceProductModel.countDocuments({
      merchantId: merchantObjId,
      isFeatured: true
    });

    const pendingOrders = orders.filter(o => o.status === "pending");
    const paidOrders = orders.filter(o => o.status === "paid" || o.status === "delivered");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPaidOrders = orders.filter(o => 
      (o.status === "paid" || o.status === "delivered") && 
      o.createdAt && new Date(o.createdAt) >= today
    );
    const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const isWhatsAppConnected = merchant.whatsappConfig?.status === "connected";
    const paymentChannels = merchant.paymentChannels || [];
    const deliveryFees = knowledge?.businessRules?.deliveryFees || [];

    return {
      merchant: {
        id: merchant._id.toString(),
        businessName: merchant.businessName || "Ma Boutique",
        slug: merchant.slug || "",
        category: merchant.category || "commerce général",
        city: merchant.city || "Abidjan",
        country: merchant.country || "CI",
        currency: merchant.currency || "XOF",
        phone: merchant.phone || merchant.whatsappNumber || "",
        subscriptionPlan: merchant.subscription?.plan || "starter",
        subscriptionStatus: merchant.subscription?.status || "trial",
        whatsappStatus: merchant.whatsappConfig?.status || "disconnected",
        whatsappProvider: merchant.whatsappConfig?.provider || "baileys",
        aiPersonality: merchant.aiSettings?.personality || "friendly",
        aiAutoReply: merchant.aiSettings?.autoReply ?? true
      },
      stats: {
        totalProducts,
        outOfStockCount,
        featuredCount,
        totalOrders: orders.length,
        pendingOrdersCount: pendingOrders.length,
        paidOrdersCount: paidOrders.length,
        todayRevenue,
        conversationsCount
      },
      productsPreview: products.map(p => ({
        name: p.name,
        price: p.price,
        stock: p.stock,
        isFeatured: p.isFeatured,
        isService: p.isService
      })),
      recentOrdersPreview: orders.slice(0, 3).map(o => ({
        id: o._id.toString(),
        amount: o.totalAmount,
        status: o.status,
        itemsCount: o.items?.length || 0,
        address: o.shippingAddress || "Non spécifiée"
      })),
      setupHealth: {
        isWhatsAppConnected,
        hasProducts: totalProducts > 0,
        hasPaymentChannels: paymentChannels.length > 0,
        hasDeliveryFees: deliveryFees.length > 0,
        hasBranding: !!merchant.branding?.logoUrl || !!merchant.branding?.coverUrl
      },
      pageRoute
    };
  }

  /**
   * Build the Master Copilot System Prompt
   */
  private buildSystemPrompt(context: any): string {
    const { merchant, stats, productsPreview, recentOrdersPreview, setupHealth, pageRoute } = context;

    return `Tu es le "COPILOTE VENDEUR IA", l'assistant d'élite, coéquipier et mentor business n°1 pour les commerçants de la plateforme VENDEUR IA.
Ton objectif absolu : GUIDER, ORIENTER ET AIDER le marchand avec une clarté totale, de sorte qu'il n'ait besoin d'AUCUNE FORMATION pour utiliser et rentabiliser l'application.

---
### 🏪 CONTEXTE EN TEMPS RÉEL DE LA BOUTIQUE DU MARCHAND :
- **Nom de la boutique** : "${merchant.businessName}" (Slug: ${merchant.slug || "non défini"})
- **Ville / Pays** : ${merchant.city}, ${merchant.country} (Devise: ${merchant.currency})
- **Page actuelle de l'utilisateur dans l'application** : "${pageRoute}"
- **Statut WhatsApp** : ${merchant.whatsappStatus === 'connected' ? '✅ Connecté' : '⚠️ Déconnecté / En attente'} (Fournisseur: ${merchant.whatsappProvider})
- **Formule Abonnement** : ${merchant.subscriptionPlan.toUpperCase()} (Statut: ${merchant.subscriptionStatus})
- **Santé du Catalogue** : ${stats.totalProducts} produit(s) au total (${stats.outOfStockCount} en rupture, ${stats.featuredCount} en vedette).
  - Échantillon produits : ${JSON.stringify(productsPreview)}
- **Commandes & Ventes** : ${stats.pendingOrdersCount} commande(s) en attente, ${stats.paidOrdersCount} livrée(s)/payée(s), Chiffre du jour : ${stats.todayRevenue} ${merchant.currency}.
  - Échantillon récentes commandes : ${JSON.stringify(recentOrdersPreview)}
- **Configuration** :
  - WhatsApp relié : ${setupHealth.isWhatsAppConnected ? 'OUI' : 'NON'}
  - Produits ajoutés : ${setupHealth.hasProducts ? 'OUI' : 'NON'}
  - Canaux de paiement (Wave/OM/MoMo) : ${setupHealth.hasPaymentChannels ? 'OUI' : 'NON'}
  - Tarifs de livraison configurés : ${setupHealth.hasDeliveryFees ? 'OUI' : 'NON'}

---
### 🧭 CARTE COMPLÈTE DE L'APPLICATION VENDEUR IA (Pour orienter le marchand) :
1. **/dashboard** (Tableau de Bord) : Vue d'ensemble des ventes, briefing IA du jour, QR code WhatsApp rapide, raccourci simulateur IA "Tester mon Vendeur IA", et boutique publique.
2. **/products** (Gestion Catalogue) :
   - Ajouter un produit individuel ou scanner un rayon entier en 1 photo (Batch Vision IA).
   - Définir prix, stock, catégorie, options et mettre "En Vedette ⭐" pour le carrousel vitrine.
   - Studio Affiche Promo WhatsApp (générateur d'affiches flyers Story 9:16 / Post 1:1 en 1 clic).
3. **/orders** (Commandes) :
   - Suivre les commandes créées automatiquement par l'IA ou passées sur la boutique publique.
   - Imprimer / Partager le Bon de commande WhatsApp en 1 tap.
   - Assigner un livreur avec fiche de course WhatsApp automatique.
   - Filtrer par date et exporter en CSV comptable.
4. **/inbox** (Boîte de Vente & Discussions) :
   - Voir toutes les conversations WhatsApp, Instagram, Facebook et Web.
   - Envoyer des notes vocales Push-To-Talk officielles avec transcription IA.
   - Générer une demande de paiement Mobile Money instantanée 1-clic (Wave direct link, Orange Money USSD, MTN MoMo).
5. **/marketing** (Marketing & Fidélisation) :
   - Relance automatique des paniers abandonnés.
   - Diffusion de campagnes WhatsApp segmentées (VIP, Inactifs, etc.).
   - Programme de fidélité par points automatiques.
6. **/settings** (Paramètres & Studio Apparence) :
   - Connexion WhatsApp QR Code ou Meta Cloud API (Pack Pro).
   - Moyens d'encaissement Mobile Money & Coordonnées.
   - Studio d'Apparence & Vitrine (Logo, Couverture, Palette Émeraude/Or/Indigo, Annonce flash défilante).
   - Personnalité et instructions spéciales de l'agent Vendeur IA.
   - Grille tarifaire de livraison par zone (Cocody, Yopougon, Intérieur...).
7. **/offers** : Mise à niveau d'abonnement (Starter, Premium, Pack Pro Clé en Main).

---
### ⚡ ACTIONS INTERACTIVES & BOUTONS D'ACTION CLICABLES :
Pour offrir une expérience hors-norme, insère toujours des balises d'action utiles à la fin de tes explications si pertinent :
- \`[[ACTION_NAVIGATE:/route,Libellé du bouton]]\` : pour emmener l'utilisateur directement sur la bonne page.
  Exemples :
  \`[[ACTION_NAVIGATE:/products,📸 Aller aux Produits & Scanner]]\`
  \`[[ACTION_NAVIGATE:/orders,📦 Voir les Commandes en attente]]\`
  \`[[ACTION_NAVIGATE:/inbox,💬 Ouvrir la Boîte de Réception]]\`
  \`[[ACTION_NAVIGATE:/settings,⚙️ Configurer WhatsApp / Paiements]]\`
  \`[[ACTION_NAVIGATE:/marketing,🚀 Lancer une Campagne Marketing]]\`
  \`[[ACTION_NAVIGATE:/offers,🌟 Découvrir les Formules & Pack Pro]]\`
- \`[[ACTION_OPEN_MODAL:modalName,Libellé]]\` : pour ouvrir directement une fenêtre d'action (scanner, pack_pro, fast_pay, dispatch_founder).
- \`[[ACTION_NOTIFY_FOUNDER:résumé]]\` : utilise cette balise UNIQUEMENT si le commerçant te demande expressément de transmettre un message, une suggestion, un besoin ou une réclamation aux Fondateurs / à l'équipe dirigeante.

---
### 💬 TON & COMPORTEMENT :
- **Langage** : Français fluide, chaleureux, énergique, clair et direct (avec une touche d'enthousiasme commercial africain bienveillant : *"Associé !", "Cher partenaire !", "Excellente idée !"*).
- **Zéro Jargon Compliqué** : Explique les choses en étapes simples (1, 2, 3) avec des émojis pertinents.
- **Toujours Proactif** : Si tu remarques qu'une commande est en attente ou que WhatsApp est déconnecté, rappelle-le gentiment avec la solution immédiate.
- **Si l'utilisateur demande de contacter les fondateurs** : Remercie-le chaleureusement, assure-lui que son message est directement remonté au bureau du Lead & Fondateur avec haute priorité, et utilise la balise \`[[ACTION_NOTIFY_FOUNDER:...]]\`.`;
  }

  /**
   * Main chat function for Copilot
   */
  async chat(payload: CopilotChatPayload): Promise<CopilotChatResponse> {
    const { merchantId, userMessage, pageRoute = "/dashboard", userEmail, userPhone } = payload;
    const merchantObjId = new mongoose.Types.ObjectId(merchantId);

    // 1. Fetch live merchant context
    const context = await this.getMerchantContext(merchantId, pageRoute);
    const systemPrompt = this.buildSystemPrompt(context);

    // 2. Fetch last 6 copilot messages for conversation memory
    const historyDocs = await CopilotMessageModel.find({ merchantId: merchantObjId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const history = historyDocs.reverse().map(doc => ({
      role: (doc.role === "assistant" ? "ai" : "customer") as "ai" | "customer",
      text: doc.content
    }));

    // 3. Save user message to history
    await CopilotMessageModel.create({
      merchantId: merchantObjId,
      role: "user",
      content: userMessage,
      pageRoute
    });

    // 4. Generate AI Copilot response
    const aiResponse = await aiProvider.generateText({
      systemPrompt,
      userMessage,
      history,
      temperature: 0.6,
      thinkingLevel: "minimal"
    });

    let rawText = aiResponse.text || "Je suis à vos côtés pour vous aider à développer votre boutique !";

    // 5. Parse actions from text
    const actions: SuggestedAction[] = [];
    let founderAlertSent = false;

    // Parse [[ACTION_NAVIGATE:url,label]]
    const navMatches = [...rawText.matchAll(/\[\[ACTION_NAVIGATE:([^,]+),([^\]]+)\]\]/g)];
    for (const match of navMatches) {
      actions.push({
        type: "navigate",
        payload: match[1].trim(),
        label: match[2].trim()
      });
      rawText = rawText.replace(match[0], "");
    }

    // Parse [[ACTION_OPEN_MODAL:name,label]]
    const modalMatches = [...rawText.matchAll(/\[\[ACTION_OPEN_MODAL:([^,]+),([^\]]+)\]\]/g)];
    for (const match of modalMatches) {
      actions.push({
        type: "modal",
        payload: match[1].trim(),
        label: match[2].trim()
      });
      rawText = rawText.replace(match[0], "");
    }

    // Parse [[ACTION_NOTIFY_FOUNDER:message]]
    const founderMatches = [...rawText.matchAll(/\[\[ACTION_NOTIFY_FOUNDER:([^\]]+)\]\]/g)];
    for (const match of founderMatches) {
      const founderMsg = match[1].trim();
      await this.dispatchTicketToFounders({
        merchantId,
        merchantName: context.merchant.businessName,
        userEmail: userEmail || "",
        userPhone: userPhone || context.merchant.phone,
        subject: `Message Commerçant via Copilote: ${context.merchant.businessName}`,
        message: founderMsg || userMessage,
        category: "founder_message",
        priority: "high",
        pageRoute
      });
      founderAlertSent = true;
      rawText = rawText.replace(match[0], "");
    }

    // Clean up trailing whitespace
    const cleanMessage = rawText.trim();

    // 6. Save assistant message with parsed actions
    await CopilotMessageModel.create({
      merchantId: merchantObjId,
      role: "assistant",
      content: cleanMessage,
      pageRoute,
      suggestedActions: actions
    });

    return {
      message: cleanMessage,
      actions,
      founderAlertSent,
      storeHealthSummary: {
        businessName: context.merchant.businessName,
        whatsappStatus: context.merchant.whatsappStatus,
        productCount: context.stats.totalProducts,
        pendingOrdersCount: context.stats.pendingOrdersCount,
        plan: context.merchant.subscriptionPlan
      }
    };
  }

  /**
   * Dispatch a structured ticket / direct message to the founders
   */
  async dispatchTicketToFounders(data: {
    merchantId: string;
    merchantName: string;
    userEmail?: string;
    userPhone?: string;
    subject: string;
    message: string;
    category?: "suggestion" | "bug" | "founder_message" | "help" | "partnership" | "general";
    priority?: "low" | "normal" | "high" | "urgent";
    pageRoute?: string;
  }): Promise<ICopilotTicket> {
    const merchantObjId = new mongoose.Types.ObjectId(data.merchantId);

    const ticket = await CopilotTicketModel.create({
      merchantId: merchantObjId,
      merchantName: data.merchantName,
      userEmail: data.userEmail || "",
      userPhone: data.userPhone || "",
      subject: data.subject || "Message Commerçant au Fondateur",
      message: data.message,
      category: data.category || "founder_message",
      priority: data.priority || "high",
      status: "unread",
      pageRoute: data.pageRoute || "/dashboard"
    });

    logger.info(`[Copilot Dispatch] Nouveau message fondateur créé par ${data.merchantName} (${ticket._id})`);

    // Send push notification to all admin users
    try {
      const admins = await UserModel.find({ 
        $or: [{ roles: "admin" }, { email: "franck@vendeur-ia.com" }] 
      });

      for (const admin of admins) {
        await pushService.sendNotification(admin._id.toString(), {
          title: `📨 Message Fondateur de "${data.merchantName}"`,
          body: data.message.length > 110 ? data.message.substring(0, 107) + "..." : data.message,
          icon: "/apple-touch-icon.png",
          data: { 
            url: "/admin", 
            ticketId: ticket._id.toString(),
            merchantId: data.merchantId 
          }
        });
      }
    } catch (err: any) {
      logger.warn(`[Copilot Dispatch] Erreur notification push admin: ${err.message}`);
    }

    return ticket;
  }

  /**
   * Return dynamic contextual question suggestions for quick 1-tap interaction
   */
  async getSuggestions(merchantId: string, pageRoute: string = "/dashboard") {
    const context = await this.getMerchantContext(merchantId, pageRoute);

    const suggestions: Array<{ text: string; category: string; icon: string }> = [];

    // Context-dependent suggestions
    if (!context.setupHealth.isWhatsAppConnected) {
      suggestions.push({
        text: "Comment connecter mon WhatsApp Business en 1 clic ?",
        category: "setup",
        icon: "qr"
      });
    }

    if (context.stats.pendingOrdersCount > 0) {
      suggestions.push({
        text: `J'ai ${context.stats.pendingOrdersCount} commande(s) en attente, que dois-je faire ?`,
        category: "orders",
        icon: "package"
      });
    }

    if (context.stats.totalProducts === 0) {
      suggestions.push({
        text: "Comment ajouter mon catalogue entier par simple photo de rayon ?",
        category: "products",
        icon: "camera"
      });
    }

    // Route-specific suggestions
    if (pageRoute.includes("/products")) {
      suggestions.push(
        { text: "Comment créer une belle affiche promo pour mon statut WhatsApp ?", category: "products", icon: "sparkles" },
        { text: "Comment mettre un produit en vedette sur ma boutique ?", category: "products", icon: "star" }
      );
    } else if (pageRoute.includes("/orders")) {
      suggestions.push(
        { text: "Comment envoyer automatiquement la fiche de course à mon livreur ?", category: "orders", icon: "truck" },
        { text: "Comment imprimer un reçu ou bon de commande propre ?", category: "orders", icon: "receipt" }
      );
    } else if (pageRoute.includes("/inbox")) {
      suggestions.push(
        { text: "Comment envoyer un lien de paiement direct Wave ou OM ?", category: "inbox", icon: "banknote" },
        { text: "Comment envoyer une note vocale officielle dans le chat ?", category: "inbox", icon: "mic" }
      );
    } else if (pageRoute.includes("/marketing")) {
      suggestions.push(
        { text: "Comment relancer automatiquement les paniers abandonnés ?", category: "marketing", icon: "zap" },
        { text: "Comment envoyer une promo exclusive à mes clients VIP ?", category: "marketing", icon: "crown" }
      );
    } else if (pageRoute.includes("/settings")) {
      suggestions.push(
        { text: "Comment personnaliser l'apparence et le logo de ma vitrine ?", category: "settings", icon: "palette" },
        { text: "Comment configurer mes tarifs de livraison par quartier ?", category: "settings", icon: "map-pin" }
      );
    } else {
      // Default / Dashboard
      suggestions.push(
        { text: "Fais-moi un bilan rapide de ma boutique aujourd'hui", category: "summary", icon: "activity" },
        { text: "Quels sont les meilleurs conseils pour booster mes ventes ce mois-ci ?", category: "growth", icon: "trending-up" },
        { text: "J'aimerais faire passer une suggestion ou un message au Fondateur", category: "founder", icon: "send" }
      );
    }

    return {
      suggestions: suggestions.slice(0, 4),
      storeHealth: {
        businessName: context.merchant.businessName,
        isWhatsAppConnected: context.setupHealth.isWhatsAppConnected,
        totalProducts: context.stats.totalProducts,
        pendingOrdersCount: context.stats.pendingOrdersCount,
        currency: context.merchant.currency
      }
    };
  }

  /**
   * Get conversation history
   */
  async getHistory(merchantId: string, limit: number = 20): Promise<any[]> {
    const merchantObjId = new mongoose.Types.ObjectId(merchantId);
    const docs = await CopilotMessageModel.find({ merchantId: merchantObjId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs.reverse();
  }

  /**
   * Clear conversation history
   */
  async clearHistory(merchantId: string): Promise<void> {
    const merchantObjId = new mongoose.Types.ObjectId(merchantId);
    await CopilotMessageModel.deleteMany({ merchantId: merchantObjId });
  }

  /**
   * Get all tickets for Admin
   */
  async getAdminTickets(status?: string): Promise<any[]> {
    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }
    return CopilotTicketModel.find(query).sort({ createdAt: -1 }).lean();
  }

  /**
   * Update ticket status (Admin)
   */
  async updateTicketStatus(ticketId: string, status: string, adminNotes?: string) {
    const update: any = { status };
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (status === "resolved") update.resolvedAt = new Date();

    return CopilotTicketModel.findByIdAndUpdate(ticketId, { $set: update }, { new: true });
  }
}

export const copilotService = new CopilotService();
