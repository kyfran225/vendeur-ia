import mongoose, { Schema, Document } from "mongoose";
import {
  CommerceMerchantModel,
  CommerceKnowledgeModel,
  CommerceProductModel,
  CommerceConversationModel,
  CommerceMessageModel,
  CommerceCustomerModel,
  CommerceOrderModel
} from "./commerce.model.js";
import { OfferModel } from "./offer.model.js";
import { SubscriptionModel } from "./subscription.model.js";
import { WhatsAppConnectionModel } from "./whatsapp-connection.model.js";
import { UserModel } from "../auth/user.model.js";
import { aiAgentService } from "../../services/ai-agent.service.js";
import { aiGrowthService } from "../../services/ai-growth.service.js";
import { aiProvider } from "../../services/ai-provider.js";
import { messagingService } from "../../services/messaging.service.js";
import { pushService } from "../../services/push.service.js";
import { paystackService } from "../../services/paystack.service.js";
import { env } from "../../config/env.js";
import { GEMINI_DEFAULT_VISION_MODEL, resolveGeminiModel } from "../../config/gemini.js";
import axios from "axios";
import crypto from "crypto";

import { SystemSettingsModel } from "./admin.model.js";
import { TransactionModel } from "./transaction.model.js";

export class CommerceService {
  async getDashboard(ownerId: string) {
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return { merchant: null, products: [], metrics: {} };

    // New Models Data
    const subscription = await SubscriptionModel.findOne({ userId: ownerId }).populate('offerId');
    const whatsappConnection = await WhatsAppConnectionModel.findOne({ userId: ownerId });
    const offers = await OfferModel.find({ isActive: true }).sort({ sortOrder: 1 });

    const products = await CommerceProductModel.find({ merchantId: merchant._id });

    // Simple metrics calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const conversationsToday = await CommerceConversationModel.countDocuments({
      merchantId: merchant._id,
      createdAt: { $gte: today }
    });

    const hotLeads = await CommerceCustomerModel.countDocuments({
      merchantId: merchant._id,
      leadScore: { $gte: 50 }
    });

    const aiGrowthAdvice = await aiGrowthService.generateGrowthAdvice(merchant._id.toString());

    // --- PIPELINE METRICS ---
    const ordersToday = await CommerceOrderModel.countDocuments({
      merchantId: merchant._id,
      createdAt: { $gte: today }
    });

    const paidOrdersToday = await CommerceOrderModel.find({
      merchantId: merchant._id,
      status: "paid",
      paidAt: { $gte: today }
    });

    const revenueToday = paidOrdersToday.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

    const conversionRate = conversationsToday > 0
      ? Math.round((ordersToday / conversationsToday) * 100)
      : 0;

    // --- SETUP STATUS CALCULATION ---
    const knowledge = await CommerceKnowledgeModel.findOne({ merchantId: merchant._id });

    const hasProducts = (products?.length || 0) > 0;
    const isWhatsAppConnected = merchant.whatsappConfig?.status === 'connected';

    // Check if user has actually ADDED payment methods (not just the default empty ones)
    const hasPaymentMethods = (knowledge?.businessRules?.paymentMethods?.length || 0) > 0 &&
                             knowledge?.businessRules?.paymentMethods?.some(m => m.number && m.number.trim() !== "");

    const hasDeliveryFees = (knowledge?.businessRules?.deliveryFees?.length || 0) > 0;

    const setupSteps = [
      { id: 'identity', label: 'Identité du Commerce', completed: true, weight: 10 }, // New step
      { id: 'whatsapp', label: 'Connecter WhatsApp', completed: isWhatsAppConnected, weight: 35 },
      { id: 'products', label: 'Ajouter des produits', completed: hasProducts, weight: 25 },
      { id: 'payments', label: 'Modes de paiement', completed: hasPaymentMethods, weight: 15 },
      { id: 'delivery', label: 'Tarifs de livraison', completed: hasDeliveryFees, weight: 15 }
    ];

    const setupScore = setupSteps.reduce((acc, step) => acc + (step.completed ? step.weight : 0), 0);
    const isFullyOperational = setupScore === 100;

    // --- PRODUCT PERFORMANCE ---
    const topProducts = await CommerceOrderModel.aggregate([
      { $match: { merchantId: merchant._id, status: "paid" } },
      { $unwind: "$items" },
      { $group: {
        _id: "$items.productId",
        name: { $first: "$items.name" },
        totalSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 3 }
    ]);

    // --- GROWTH METRICS ---
    const totalPoints = await CommerceCustomerModel.aggregate([
      { $match: { merchantId: merchant._id } },
      { $group: { _id: null, total: { $sum: "$loyaltyPoints" } } }
    ]);

    const threshold = merchant.loyaltySettings?.threshold || 50;
    const loyalCustomersCount = await CommerceCustomerModel.countDocuments({
      merchantId: merchant._id,
      loyaltyPoints: { $gte: threshold }
    });

    const aiRevenueStats = await CommerceOrderModel.aggregate([
      { $match: { merchantId: merchant._id, status: "paid", recoveredByAi: true } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const recentTransactions = await TransactionModel.find({ merchantId: merchant._id })
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      merchant,
      subscription,
      whatsappConnection,
      offers,
      products,
      knowledge,
      recentTransactions,
      setupStatus: {
        score: setupScore,
        isFullyOperational,
        steps: setupSteps
      },
      metrics: {
        revenueToday,
        conversationsToday,
        hotLeads,
        ordersToday,
        conversionRate,
        topProducts,
        totalPoints: totalPoints[0]?.total || 0,
        loyalCustomersCount,
        aiRevenue: aiRevenueStats[0]?.total || 0
      },
      aiGrowthAdvice
    };
  }

  async createMerchant(ownerId: string, data: any) {
    // 1. Atomic Upsert for Merchant
    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId },
      {
        $set: {
          businessName: data.businessName,
          category: data.category,
          description: data.description,
          address: data.address,
          whatsappNumber: data.whatsappNumber,
          city: data.city,
          country: data.country
        },
        $setOnInsert: {
          referralCode: this.generateReferralCode(),
          referredBy: data.referredByCode ? await this.getMerchantIdByCode(data.referredByCode) : undefined
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    if (!merchant) throw new Error("Failed to create or update merchant");

    // 2. Atomic Initialization for Knowledge Base
    await CommerceKnowledgeModel.findOneAndUpdate(
      { merchantId: merchant._id },
      {
        $setOnInsert: {
          merchantId: merchant._id,
          businessRules: {
            deliveryZones: data.city ? [data.city] : [],
            deliveryFees: data.city ? [{ zone: data.city, price: 1000 }] : [],
            openingHours: "09:00 - 18:00",
            returnPolicy: "Retours acceptés sous 48h.",
            paymentMethods: []
          },
          customInstructions: `Vends avec passion les produits de ${data.businessName}.`
        }
      },
      { upsert: true, new: true }
    );

    // Proactively add delivery fee if missing (for update case)
    if (data.city) {
      await CommerceKnowledgeModel.findOneAndUpdate(
        { merchantId: merchant._id, "businessRules.deliveryFees": { $size: 0 } },
        { $set: { "businessRules.deliveryFees": [{ zone: data.city, price: 1000 }] } }
      );
    }

    // Handle First Product from Onboarding
    if (data.firstProduct && data.firstProduct.name) {
      const existingProduct = await CommerceProductModel.findOne({
        merchantId: merchant._id,
        name: data.firstProduct.name
      });

      if (!existingProduct) {
        await CommerceProductModel.create({
          merchantId: merchant._id,
          name: data.firstProduct.name,
          price: data.firstProduct.price || 0,
          description: data.firstProduct.description || "",
          category: data.firstProduct.category || data.category,
          images: data.productImage ? [data.productImage] : [],
          stock: 10,
          aiMetadata: {
            tags: data.firstProduct.tags || []
          }
        });

        // Trigger embedding generation for the first product
        const newProduct = await CommerceProductModel.findOne({ merchantId: merchant._id, name: data.firstProduct.name });
        if (newProduct) {
          this.syncProductEmbedding(newProduct._id.toString()).catch(err =>
            console.error("[Embedding] Initial sync failed:", err)
          );
        }
      }
    }

    // Update user onboarding status ONLY if explicitly requested
    if (data.onboardingCompleted) {
      await UserModel.findByIdAndUpdate(ownerId, { onboardingCompleted: true });
    }

    return merchant;
  }

  async updateMerchant(ownerId: string, data: any) {
    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId },
      { $set: data },
      { new: true }
    );
    if (!merchant) throw new Error("Merchant not found");
    return merchant;
  }

  async getKnowledge(merchantId: string) {
    let knowledge = await CommerceKnowledgeModel.findOne({ merchantId });
    if (!knowledge) {
      const merchant = await CommerceMerchantModel.findById(merchantId);
      knowledge = await CommerceKnowledgeModel.create({
        merchantId,
        businessRules: {
          deliveryZones: merchant?.city ? [merchant.city] : [],
          openingHours: "09:00 - 18:00",
          returnPolicy: "Retours acceptés sous 48h.",
          paymentMethods: [] // No defaults here either
        }
      });
    }
    return knowledge;
  }

  async updateKnowledge(merchantId: string, data: any) {
    const knowledge = await CommerceKnowledgeModel.findOneAndUpdate(
      { merchantId },
      { $set: data },
      { new: true, upsert: true }
    );
    return knowledge;
  }

  async processAiMessage(merchantId: string, customerPhone: string, message: string, history: any[]) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) throw new Error("Merchant not found");

    const products = await CommerceProductModel.find({ merchantId });
    const knowledge = await CommerceKnowledgeModel.findOne({ merchantId });

    const formattedHistory = history.map(h => ({
      role: (h.sender === "customer" ? "customer" : "ai") as "customer" | "ai",
      text: h.content
    }));

    const customer = await CommerceCustomerModel.findOne({ merchantId, phone: customerPhone });

    return aiAgentService.generateResponse({
      merchant: merchant.toObject() as any,
      products: products.map(p => p.toObject()),
      knowledge: knowledge ? (knowledge.toObject() as any) : {},
      history: formattedHistory,
      message,
      customerPhone,
      customerLoyalty: customer ? {
        points: customer.loyaltyPoints || 0,
        isVIP: (customer.loyaltyPoints || 0) >= (merchant.loyaltySettings?.threshold || 50),
        threshold: merchant.loyaltySettings?.enabled ? merchant.loyaltySettings.threshold : undefined,
        rewardDescription: merchant.loyaltySettings?.rewardDescription
      } : undefined,
      platform: "whatsapp" // Default platform for this method
    });
  }

  async validatePaymentProof(imageBuffer: Buffer, mimeType: string) {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `Analyse cette capture d'écran de paiement Mobile Money (Wave, Orange Money, MTN, etc.) et extrait les informations suivantes au format JSON :
{
  "isPaymentProof": true/false,
  "amount": number,
  "transactionId": "string",
  "platform": "Wave" | "Orange Money" | "MTN" | "Autre",
  "status": "success" | "pending" | "failed",
  "date": "string"
}
Réponds UNIQUEMENT avec le JSON. Si ce n'est pas une preuve de paiement, mets isPaymentProof à false.`;

    try {
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_DEFAULT_VISION_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`, {
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
      console.error("[Payment Validation] Error:", error.response?.data || error.message);
      throw new Error("Erreur lors de la validation du paiement par l'IA");
    }
  }

  async analyzeProductImage(imageBuffer: Buffer, mimeType: string, currency: string = "XOF", country: string = "CI") {
    // 1. Primary: Dynamic Vision Provider
    try {
      const prompt = `Analyse cette image de commerce pour un marchand situé dans le pays code "${country}" utilisant la devise "${currency}".
Elle peut contenir soit un seul produit, soit un LOT DE PLUSIEURS PRODUITS (ex: plusieurs vêtements disposés, plusieurs articles sur une table, etc.).
Détecte tous les produits visibles distincts et extrait un tableau JSON "items" au format suivant :
{
  "items": [
    {
      "name": "Nom accrocheur et vendeur du produit",
      "price": number (prix estimé en ${currency} selon l'article et le marché local, ou 0 si totalement inconnu),
      "stock": 1,
      "description": "Description commerciale complète optimisée pour WhatsApp/Instagram avec emojis et détails (couleurs, style, matière)",
      "category": "Choisir parmi: fashion, food, beauty, electronics, artisan, services, digital, home, grocery, health, auto, other",
      "tags": ["tag1", "tag2"]
    }
  ]
}
Réponds UNIQUEMENT avec le JSON strict. Si 1 seul produit est présent, renvoie quand même un tableau "items" avec cet unique élément.`;

      const settings = await SystemSettingsModel.findOne();
      const provider = settings?.aiConfig?.defaultVisionProvider || 'gemini';

      if (provider === 'gemini') {
        const apiKey = settings?.aiConfig?.providers?.find(p => p.name === 'gemini')?.apiKey || env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Clé Gemini manquante");

        const geminiProvider = settings?.aiConfig?.providers?.find(p => p.name === 'gemini');
        const model = resolveGeminiModel(geminiProvider?.models?.vision, GEMINI_DEFAULT_VISION_MODEL);

        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          contents: [{
            parts: [{ text: prompt }, { inlineData: { mimeType, data: imageBuffer.toString("base64") } }]
          }]
        });

        const text = response.data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
            return parsed;
          }
          // Backward compatibility if AI returned single object
          if (parsed.name) {
            return { items: [parsed] };
          }
          return parsed;
        }
      } else if (provider === 'openai') {
        const apiKey = settings?.aiConfig?.providers?.find(p => p.name === 'openai')?.apiKey || env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("Clé OpenAI manquante");

        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBuffer.toString("base64")}` } }
              ]
            }
          ]
        }, {
          headers: { "Authorization": `Bearer ${apiKey}` }
        });

        const text = response.data.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
            return parsed;
          }
          if (parsed.name) {
            return { items: [parsed] };
          }
          return parsed;
        }
      }
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      console.warn(`[Product Vision] Analysis failed (${status || 'unknown'}):`, error.message, data ? JSON.stringify(data) : "");
    }

    // 2. Fallback: No silent default if Gemini is configured but fails
    throw new Error("L'analyse de l'image a échoué. Veuillez vérifier vos clés API IA dans le dashboard Admin.");
  }

  async generateProductCaption(productId: string) {
    const product = await CommerceProductModel.findById(productId);
    if (!product) throw new Error("Produit non trouvé");

    const merchant = await CommerceMerchantModel.findById(product.merchantId);
    if (!merchant) throw new Error("Marchand non trouvé");

    const prompt = `Génère 3 options de légendes percutantes pour les réseaux sociaux (TikTok/Instagram) pour ce produit.
Produit : ${product.name}
Prix : ${product.price} ${product.currency}
Description : ${product.description || "Pas de description"}
Boutique : ${merchant.businessName}

Format de réponse attendu (JSON uniquement) :
{
  "viral": "Accroche forte (Hook), ton dynamique, beaucoup d'emojis, hashtags tendances",
  "professional": "Ton expert, focus sur la qualité et les bénéfices, élégant",
  "urgent": "Focus sur le stock limité, promo flash, appel à l'action immédiat"
}

Le ton doit être adapté à une audience d'Afrique de l'Ouest (chaleureux et direct).`;

    const response = await aiProvider.generateText({
      systemPrompt: "Tu es un expert en marketing digital et copywriting spécialisé dans la vente sur les réseaux sociaux.",
      userMessage: prompt,
      temperature: 0.8,
      maxTokens: 800
    });

    const result = response.text;

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.warn("[Caption] Failed to parse JSON, returning raw text as viral");
    }

    return { viral: result, professional: result, urgent: result };
  }

  async generateFollowUp(conversationId: string) {
    const conversation = await CommerceConversationModel.findById(conversationId).populate("customerId");
    if (!conversation) throw new Error("Conversation non trouvée");

    const merchant = await CommerceMerchantModel.findById(conversation.merchantId);
    if (!merchant) throw new Error("Marchand non trouvé");

    const messages = await CommerceMessageModel.find({ conversationId }).sort({ timestamp: -1 }).limit(10);
    const history = messages.reverse().map(m => `${m.sender === "customer" ? "Client" : "IA"}: ${m.content}`).join("\n");

    const prompt = `Génère un message de relance court et chaleureux pour ce client qui n'a pas fini sa commande.
Boutique : ${merchant.businessName}
Historique récent :
${history}

Le message doit être :
- Très court (max 40 mots)
- Chaleureux et sans pression excessive
- Utiliser un emoji local ✨
- Proposer son aide pour finaliser ou répondre à une question

Réponds UNIQUEMENT avec le texte du message.`;

    const response = await aiProvider.generateText({
      systemPrompt: "Tu es un vendeur expert spécialisé dans la relance client bienveillante.",
      userMessage: prompt,
      temperature: 0.7,
      maxTokens: 150
    });

    return { followup: response.text };
  }

  async generateDigitalReceipt(orderId: string) {
    const order = await CommerceOrderModel.findById(orderId).populate("merchantId customerId");
    if (!order) throw new Error("Commande non trouvée");

    const merchant = order.merchantId as any;
    const customer = order.customerId as any;

    const date = new Date(order.createdAt).toLocaleDateString("fr-FR");
    const time = new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

    let itemsStr = order.items.map(item => `🔹 ${item.quantity}x ${item.name} - ${(item.price || 0) * item.quantity} ${order.currency}`).join("\n");

    const receipt = `
✨ *REÇU DE COMMANDE - ${merchant.businessName}* ✨
━━━━━━━━━━━━━━━━━━━━━
📅 *Date:* ${date} à ${time}
👤 *Client:* ${customer.phone}
🆔 *Commande:* #${order._id.toString().slice(-6).toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━
📦 *DÉTAILS :*
${itemsStr}
━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL : ${order.totalAmount.toLocaleString()} ${order.currency}*
━━━━━━━━━━━━━━━━━━━━━
✅ *Statut:* Payé

Merci de votre confiance ! 🚀
💎 *Points Fidélité gagnés:* +${Math.floor(order.totalAmount / 1000)}
    `.trim();

    return receipt;
  }

  async confirmOrderPayment(orderId: string) {
    const order = await CommerceOrderModel.findById(orderId);
    if (!order) throw new Error("Order not found");

    if (order.status === "paid") return order;

    order.status = "paid";
    order.paidAt = new Date();

    // Check for AI recovery
    const conversation = await CommerceConversationModel.findOne({
      merchantId: order.merchantId,
      customerId: order.customerId,
      isRecoveryPending: true
    });

    if (conversation) {
      (order as any).recoveredByAi = true;
      conversation.isRecoveryPending = false; // Reset for future sales
      await conversation.save();
      console.log(`[Recovery] Order ${order._id} successfully attributed to AI follow-up.`);
    }

    await order.save();

    // 1. Stock Deduction Logic
    for (const item of order.items) {
      if (item.productId) {
        await CommerceProductModel.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity }
        });
      }
    }

    // 2. Loyalty Points Logic: Reward points if loyalty program is enabled
    const merchant = await CommerceMerchantModel.findById(order.merchantId);
    if (merchant?.loyaltySettings?.enabled) {
      const pointsPerOrder = merchant.loyaltySettings.pointsPerOrder || 10;
      // You can also use amount-based: e.g. 1 point per 1000 XOF
      const pointsToAdd = pointsPerOrder; // Simplify to fixed points per order for now or keep amount-based

      if (pointsToAdd > 0) {
        await CommerceCustomerModel.findByIdAndUpdate(order.customerId, {
          $inc: { loyaltyPoints: pointsToAdd }
        });
        console.log(`[Loyalty] Added ${pointsToAdd} points to customer ${order.customerId} for order ${order._id}`);
      }
    }

    // Trigger Knowledge Learning
    this.extractMerchantKnowledge(order._id.toString()).catch(err =>
      console.error("[Learning Error] Failed to extract knowledge:", err)
    );

    // Send Receipt Automatically if linked to a merchant that has WhatsApp connection
    this.sendReceiptAsync(order._id.toString()).catch(err =>
      console.error("[Receipt Error] Failed to send receipt:", err)
    );

    return order;
  }

  private async sendReceiptAsync(orderId: string) {
    const order = await CommerceOrderModel.findById(orderId).populate("merchantId customerId");
    if (!order) return;

    const receipt = await this.generateDigitalReceipt(orderId);
    const merchant = order.merchantId as any;
    const customer = order.customerId as any;

    if (merchant.whatsappConfig?.status === 'connected') {
      await messagingService.sendMessage(merchant, "whatsapp", customer.phone, receipt);
      console.log(`[Receipt] Automatically sent to ${customer.phone} for order ${orderId}`);
    }
  }

  async linkPaymentToOrder(customerId: string, paymentInfo: any) {
    // 1. Find the latest pending order for this customer
    const order = await CommerceOrderModel.findOne({
      customerId,
      status: "pending"
    }).sort({ createdAt: -1 });

    if (!order) {
      console.log(`[Payment Link] No pending order found for customer ${customerId}`);
      return null;
    }

    // 2. Cross-verify amount (with a small margin for currency conversion or fees if applicable)
    const orderAmount = order.totalAmount;
    const detectedAmount = paymentInfo.amount;

    if (Math.abs(orderAmount - detectedAmount) <= 100) { // Tolerate 100 XOF difference
      console.log(`[Payment Link] Amount match! Marking order ${order._id} as paid.`);

      // 3. Mark as paid
      await this.confirmOrderPayment(order._id.toString());

      // Update order with payment details
      order.paymentMethod = paymentInfo.platform;
      order.status = "paid";
      await order.save();

      return { orderId: order._id, matched: true, amount: detectedAmount };
    } else {
      console.warn(`[Payment Link] Amount mismatch: Order=${orderAmount}, Detected=${detectedAmount}`);
      return { orderId: order._id, matched: false, expected: orderAmount, actual: detectedAmount };
    }
  }

  async extractMerchantKnowledge(orderId: string) {
    const order = await CommerceOrderModel.findById(orderId).populate("merchantId customerId");
    if (!order) return;

    // Fetch conversation for this order
    const conversation = await CommerceConversationModel.findOne({
      merchantId: (order.merchantId as any)._id,
      customerId: (order.customerId as any)._id
    });
    if (!conversation) return;

    const messages = await CommerceMessageModel.find({ conversationId: conversation._id }).sort({ timestamp: 1 });
    const history = messages.map(m => `${m.sender === "customer" ? "Client" : "IA"}: ${m.content}`).join("\n");

    const prompt = `Analyse cette conversation de vente réussie pour la boutique "${(order.merchantId as any).businessName}".
Extrais un unique "Insight" métier court (max 20 mots) qui aidera le marchand ou l'IA à être plus performant à l'avenir.
L'insight doit porter sur : les préférences clients, une objection résolue, ou une amélioration de produit.

Conversation :
${history}

Format JSON :
{
  "insight": "Texte de l'insight",
  "type": "product" | "customer" | "business"
}
Réponds UNIQUEMENT avec le JSON.`;

    const response = await aiProvider.generateText({
      systemPrompt: "Tu es un consultant en stratégie commerciale expert en social commerce.",
      userMessage: prompt,
      temperature: 0.5
    });

    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const insightData = JSON.parse(jsonMatch[0]);
        await CommerceKnowledgeModel.findOneAndUpdate(
          { merchantId: (order.merchantId as any)._id },
          { $push: { "businessRules.dynamicInsights": { ...insightData, createdAt: new Date() } } }
        );
        console.log(`[Learning] New insight saved for merchant ${(order.merchantId as any)._id}`);
      }
    } catch (err) {
      console.warn("[Learning] Failed to parse insight JSON");
    }
  }

  async getSalesContext(merchantId: string, customerId: string) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) throw new Error("Merchant not found");

    const customer = await CommerceCustomerModel.findById(customerId);
    if (!customer) throw new Error("Customer not found");

    const products = await CommerceProductModel.find({ merchantId });
    const knowledge = await CommerceKnowledgeModel.findOne({ merchantId });

    // Get last 10 messages for history
    const conversation = await CommerceConversationModel.findOne({
      merchantId,
      customerId,
      status: { $ne: "closed" }
    });

    let history: any[] = [];
    if (conversation) {
      const messages = await CommerceMessageModel.find({
        conversationId: conversation._id
      }).sort({ timestamp: -1 }).limit(10);

      history = messages.reverse().map(m => ({
        role: (m.sender === "customer" ? "customer" : "ai") as "customer" | "ai",
        text: m.content
      }));

      // Update messages count and check for summary
      await CommerceConversationModel.findByIdAndUpdate(conversation._id, {
        $inc: { messagesCount: 1 }
      });

      if (((conversation.messagesCount || 0) + 1) % 10 === 0) {
        this.updateConversationSummary(conversation._id.toString()).catch(err =>
          console.error("[Summary Error] Failed to update summary:", err)
        );
      }
    }

    return {
      merchant: merchant.toObject() as any,
      products: products.map(p => p.toObject()),
      knowledge: knowledge ? (knowledge.toObject() as any) : {},
      history,
      message: "", // Initial empty message
      aiSummary: (conversation as any)?.aiSummary || ""
    };
  }

  async updateConversationSummary(conversationId: string) {
    const messages = await CommerceMessageModel.find({ conversationId }).sort({ timestamp: 1 });
    const historyText = messages.map(m => `${m.sender === "customer" ? "Client" : "IA"}: ${m.content}`).join("\n");

    const prompt = `Résume les faits cruciaux de cette conversation commerciale pour la mémoire à long terme de l'IA.
Inclus : Produits d'intérêt, tailles/couleurs, lieu de livraison mentionné, budget, objections.
Sois très concis (Style liste à puces).

Historique :
${historyText}

Résumé actuel :`;

    const response = await aiProvider.generateText({
      systemPrompt: "Tu es un assistant de gestion de relation client ultra-précis.",
      userMessage: prompt,
      temperature: 0.3
    });

    await CommerceConversationModel.findByIdAndUpdate(conversationId, {
      $set: { aiSummary: response.text }
    });
    console.log(`[Summary] Conversation ${conversationId} updated.`);
  }

  // --- REFERRAL LOGIC ---

  private generateReferralCode() {
    return crypto.randomBytes(3).toString("hex").toUpperCase();
  }

  private async getMerchantIdByCode(code: string) {
    const m = await CommerceMerchantModel.findOne({ referralCode: code });
    return m ? m._id : undefined;
  }

  async processReferralReward(newMerchantId: string) {
    const newMerchant = await CommerceMerchantModel.findById(newMerchantId);
    if (!newMerchant || !newMerchant.referredBy) return;

    const referrer = await CommerceMerchantModel.findById(newMerchant.referredBy);
    if (!referrer) return;

    console.log(`[Referral] Rewarding ${referrer.businessName} for referring ${newMerchant.businessName}`);

    // Extend subscription by 30 days
    const currentExpiry = referrer.subscription?.expiresAt || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + 30);

    await CommerceMerchantModel.findByIdAndUpdate(referrer._id, {
      $inc: { "referralStats.count": 1, "referralStats.earnedMonths": 1 },
      $set: { "subscription.expiresAt": newExpiry, "subscription.status": "active" }
    });

    // Notify Referrer
    const waMessage = `🎁 *Cadeau Ambassadeur !* 🎁\n\nFélicitations ! Votre filleul *${newMerchant.businessName}* vient de s'abonner.\n\n` +
      `En récompense, nous venons d'offrir *1 MOIS GRATUIT* à votre boutique. 🚀\n\n` +
      `Nouvelle expiration : *${newExpiry.toLocaleDateString()}*.\n\n` +
      `Continuez à partager votre code : *${referrer.referralCode}* !`;

    await messagingService.sendMessage(referrer, 'whatsapp', referrer.whatsappNumber || "", waMessage);

    // Push Notification
    pushService.sendNotification(referrer.ownerId, {
      title: "1 Mois Offert ! 🎁",
      body: `Félicitations ! Votre parrainage de ${newMerchant.businessName} a réussi.`,
      data: { type: "referral", action: "reward" }
    }).catch((err: any) => console.error("[Referral] Push failed:", err));
  }

  async syncProductEmbedding(productId: string) {
    const product = await CommerceProductModel.findById(productId);
    if (!product) return;

    const textToEmbed = `${product.name} ${product.description} ${product.category}`.trim();
    if (!textToEmbed) return;

    try {
      const embedding = await aiProvider.generateEmbeddings(textToEmbed);
      await CommerceProductModel.findByIdAndUpdate(productId, {
        "aiMetadata.embedding": embedding
      });
      console.log(`[Embedding] Synced for product: ${product.name}`);
    } catch (err) {
      console.error(`[Embedding] Sync failed for product ${product.name}:`, err);
    }
  }

  async searchRelevantProducts(merchantId: string, query: string, limit = 5) {
    try {
      // 1. Generate embedding for query
      const queryEmbedding = await aiProvider.generateEmbeddings(query);

      // 2. Hybrid Search Logic: Vector + Keyword
      const vectorProducts = await CommerceProductModel.aggregate([
        { $match: {
          merchantId: new mongoose.Types.ObjectId(merchantId),
          stock: { $gt: 0 },
          "aiMetadata.embedding": { $exists: true, $ne: [] }
        } },
        {
          $addFields: {
            score: {
              $reduce: {
                input: { $range: [0, { $size: "$aiMetadata.embedding" }] },
                initialValue: 0,
                in: {
                  $add: [
                    "$$value",
                    {
                      $multiply: [
                        { $arrayElemAt: ["$aiMetadata.embedding", "$$this"] },
                        { $arrayElemAt: [queryEmbedding, "$$this"] }
                      ]
                    }
                  ]
                }
              }
            }
          }
        },
        { $sort: { score: -1 } },
        { $limit: limit }
      ]);

      // 3. Keyword Search Fallback/Boost
      const keywords = query.split(' ').filter(k => k.length > 2);
      const keywordProducts = await CommerceProductModel.find({
        merchantId,
        stock: { $gt: 0 },
        $or: [
          { name: { $regex: keywords.join('|'), $options: 'i' } },
          { category: { $regex: keywords.join('|'), $options: 'i' } }
        ]
      }).limit(limit).lean();

      // 4. Merge results (Set to remove duplicates)
      const merged = [...vectorProducts];
      for (const kp of keywordProducts) {
        if (!merged.find(p => p._id.toString() === (kp as any)._id.toString())) {
          merged.push(kp as any);
        }
      }

      return merged.slice(0, limit);
    } catch (err) {
      console.error("[Hybrid Search] Error:", err);
      return CommerceProductModel.find({
        merchantId,
        stock: { $gt: 0 }
      }).limit(limit);
    }
  }

  // --- NEW SUBSCRIPTION LOGIC ---

  async initializeCheckout(userId: string, offerSlug: string, email: string, setupOption?: string) {
    const offer = await OfferModel.findOne({ slug: offerSlug });
    if (!offer) throw new Error("Offre non trouvée");

    let amount = offer.monthlyPrice;

    // Add setup fee if selected
    if (setupOption) {
      const option = offer.setupOptions.find(o => o.type === setupOption);
      if (option) {
        amount += option.price;
      }
    }

    const metadata = {
      userId,
      offerSlug: offer.slug,
      setupOption,
      type: "SUBSCRIPTION_INITIAL"
    };

    return paystackService.initializeSubscription(email, amount, metadata);
  }

  async updateWhatsAppStatus(userId: string, status: string, details?: any) {
    return WhatsAppConnectionModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          status,
          ...details,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
  }
}

export const commerceService = new CommerceService();
