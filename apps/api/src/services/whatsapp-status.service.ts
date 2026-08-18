import {
  CommerceMerchantModel,
  CommerceProductModel
} from "../modules/commerce/commerce.model.js";
import { messagingService } from "./messaging.service.js";
import { whatsappService } from "../modules/whatsapp/whatsapp.service.js";
import { aiProvider } from "./ai-provider.js";
import { env } from "../config/env.js";
import { logger } from "./logger.service.js";
import axios from "axios";

export interface StatusContent {
  headline: string;
  copyText: string;
  productName?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
}

class WhatsAppStatusService {
  /**
   * Generates a daily status pack (3 engaging status ideas) for a merchant
   */
  async generateStatusPack(merchantId: string): Promise<StatusContent[]> {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) throw new Error("Marchand introuvable");

    const products = await CommerceProductModel.find({
      merchantId,
      availability: { $ne: "hidden" }
    }).limit(10);

    const clientBaseUrl = env.CLIENT_URL || "https://vendeur-ia.com";
    const shopSlug = merchant.slug || (merchant.businessName ? merchant.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : merchant._id);
    const shopUrl = `${clientBaseUrl}/shop/${shopSlug}`;

    const productsSummary = products.map(p => `- ${p.name}: ${p.price} ${p.currency || merchant.currency || "XOF"}`).join("\n");

    const prompt = `Tu es un expert en copywriting et en vente WhatsApp en Afrique pour les commerces locaux.
Génère EXACTEMENT 3 propositions de "STATUT WHATSAPP" percutantes pour la boutique "${merchant.businessName}" (${merchant.category || "Commerce"}).

Informations boutique :
- Ville : ${merchant.city || "Abidjan"}, ${merchant.country || "CI"}
- Devise : ${merchant.currency || "XOF"}
- Lien boutique : ${shopUrl}
- Produits disponibles :
${productsSummary || "Catalogue varié"}

RÈGLES D'OR DES STATUTS WHATSAPP :
1. Court, très visuel et dynamique (avec emojis adaptés 🔥, ✨, 🛍️, 🛵).
2. Toujours inclure un appel à l'action clair ("Réponds vite à ce statut pour commander" ou "Lien complet : ${shopUrl}").
3. Crée de l'urgence (ex: "Seulement 3 dispos", "Promo flash du jour", "Arrivage tout frais").

Réponds UNIQUEMENT au format JSON strict suivant :
[
  {
    "headline": "Titre ou angle d'attaque (ex: 🔥 OFFRE FLASH DU JOUR)",
    "copyText": "Texte complet prêt à être posté en statut WhatsApp avec emojis et lien",
    "productName": "Nom du produit ciblé si applicable"
  },
  {
    "headline": "✨ NOUVEAUTÉ / COUP DE CŒUR",
    "copyText": "Texte complet du statut 2...",
    "productName": "Nom du produit 2"
  },
  {
    "headline": "🚨 RAPPEL STOCK LIMITÉ",
    "copyText": "Texte complet du statut 3...",
    "productName": "Nom du produit 3"
  }
]`;

    try {
      const response = await aiProvider.generateText({
        systemPrompt: "Tu es un copywriter d'élite spécialisé dans les ventes par Statuts WhatsApp. Réponds UNIQUEMENT en JSON valide.",
        userMessage: prompt,
        temperature: 0.7
      });

      const cleanJson = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed: StatusContent[] = JSON.parse(cleanJson);

      // Match products to get imageUrl & price
      return parsed.map((item, index) => {
        const matchedProd = products.find(p => p.name.toLowerCase().includes((item.productName || "").toLowerCase())) || products[index % products.length];
        return {
          ...item,
          productName: matchedProd?.name || item.productName,
          price: matchedProd?.price,
          currency: matchedProd?.currency || merchant.currency || "XOF",
          imageUrl: matchedProd?.images?.[0] || matchedProd?.imageUrl
        };
      });
    } catch (err: any) {
      logger.error("[Status Assistant] Error generating statuses with AI:", err.message);
      // Fallback
      return [
        {
          headline: "🔥 ARRIVAGE DU JOUR",
          copyText: `✨ Découvrez nos nouveautés chez *${merchant.businessName}* !\nCommandez en 1 clic sur notre boutique en ligne :\n👉 ${shopUrl}\n\nOu réponds directement à ce statut ! 🛍️`,
          imageUrl: products[0]?.images?.[0] || products[0]?.imageUrl
        }
      ];
    }
  }

  /**
   * Sends the prepared daily status pack to the merchant on WhatsApp
   */
  async sendDailyStatusPackToMerchant(merchantId: string) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant || !merchant.whatsappNumber) return;

    const statuses = await this.generateStatusPack(merchantId);

    let message = `☀️ *BONJOUR ${merchant.businessName.toUpperCase()} !* 🚀\n`;
    message += `Voici vos *3 Idées de Statuts WhatsApp du Jour* préparées par votre Vendeur IA pour booster vos ventes aujourd'hui :\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    statuses.forEach((s, idx) => {
      message += `📌 *STATUT ${idx + 1} : ${s.headline}*\n`;
      message += `${s.copyText}\n\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    });

    message += `💡 *Astuce Vente :* Copiez l'un de ces textes et mettez-le dès maintenant en Statut WhatsApp avec la photo du produit pour déclencher des commandes !\n`;
    message += `_Propulsé par Vendeur IA Omnicanal_ ✨`;

    try {
      await messagingService.sendMessage(merchant, "whatsapp", merchant.whatsappNumber, message);
      logger.info(`[Daily Status Pack] Sent successfully to ${merchant.businessName} (${merchant.whatsappNumber})`);
    } catch (err: any) {
      logger.error(`[Daily Status Pack] Failed to send to ${merchant.businessName}:`, err.message);
    }
  }

  /**
   * Automatically publish a status to WhatsApp broadcast (Baileys only)
   */
  async publishAutoStatus(merchantId: string, statusIndex = 0) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) throw new Error("Marchand introuvable");

    if (merchant.whatsappConfig?.provider !== "baileys" || merchant.whatsappConfig?.status !== "connected") {
      throw new Error("La publication automatique de statut nécessite une connexion WhatsApp active par QR Code.");
    }

    const statuses = await this.generateStatusPack(merchantId);
    const selected = statuses[statusIndex] || statuses[0];

    if (!selected) throw new Error("Aucun statut généré");

    let imageBuffer: Buffer | undefined;
    if (selected.imageUrl) {
      try {
        const response = await axios.get(selected.imageUrl, { responseType: "arraybuffer" });
        imageBuffer = Buffer.from(response.data);
      } catch (err: any) {
        logger.warn(`[Auto Status] Could not download image ${selected.imageUrl}:`, err.message);
      }
    }

    await whatsappService.postStatus(merchant.ownerId, {
      text: selected.copyText,
      imageBuffer,
      caption: selected.copyText
    });

    logger.info(`[Auto Status] Successfully published WhatsApp status for ${merchant.businessName}`);
    return { success: true, headline: selected.headline };
  }

  /**
   * Scheduled Cron Job: Runs every morning (e.g., 08:30)
   */
  async runScheduledDailyStatuses() {
    logger.info("[Daily Statuses Cron] Running daily status assistant for merchants...");
    const merchants = await CommerceMerchantModel.find({
      $or: [
        { "aiSettings.dailyStatusAssistant": true },
        { "aiSettings.dailyStatusAssistant": { $exists: false } }
      ]
    });

    for (const merchant of merchants) {
      try {
        // 1. Send status pack to merchant
        await this.sendDailyStatusPackToMerchant(merchant._id.toString());

        // 2. If autoPostStatus is enabled and connected via Baileys, auto-publish 1 status
        if (merchant.aiSettings?.autoPostStatus && merchant.whatsappConfig?.provider === "baileys" && merchant.whatsappConfig?.status === "connected") {
          await this.publishAutoStatus(merchant._id.toString(), 0);
        }
      } catch (err: any) {
        logger.error(`[Daily Statuses] Error for ${merchant.businessName}:`, err.message);
      }
    }
  }
}

export const whatsappStatusService = new WhatsAppStatusService();
