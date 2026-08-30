import mongoose, { Schema, Document } from "mongoose";
import {
  CommerceMerchantModel,
  CommerceKnowledgeModel,
  CommerceProductModel,
  CommerceConversationModel,
  CommerceMessageModel,
  CommerceCustomerModel,
  CommerceOrderModel,
  MarketingCampaignModel
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
import { paymentService, PaymentService } from "../../services/payment.service.js";
import { paymentShieldService } from "../../services/payment-shield.service.js";
import { logger } from "../../services/logger.service.js";
import { env } from "../../config/env.js";
import { GEMINI_DEFAULT_VISION_MODEL, resolveGeminiModel } from "../../config/gemini.js";
import { convertCurrencyAmount } from "@vendeur-ia/core";
import axios from "axios";
import crypto from "crypto";

import { SystemSettingsModel } from "./admin.model.js";
import { TransactionModel } from "./transaction.model.js";
import { PaymentIntentModel } from "./payment-intent.model.js";
import { whatsappService } from "../whatsapp/whatsapp.service.js";
import { isFounderNumber } from "../auth/auth.service.js";

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class CommerceService {
  async ensureFounderMerchantConfigured(ownerId: string, phone?: string) {
    const canonicalPhone = "+2250505111157";
    const metaPhoneId = env.WHATSAPP_PHONE_ID || "1283754474826620";

    let merchant = await CommerceMerchantModel.findOne({
      $or: [
        { ownerId },
        { whatsappNumber: { $regex: "5111157" } },
        { phone: { $regex: "5111157" } }
      ]
    });

    const currentStatus = merchant?.whatsappConfig?.status;
    const isDisconnected = currentStatus === "disconnected";

    const merchantData = {
      ownerId,
      businessName: "Vendeur IA",
      slug: "vendeur-ia",
      category: "services" as const,
      description: "Plateforme et assistant commercial IA sur WhatsApp pour automatiser les ventes, le support et les paiements Mobile Money en Afrique.",
      phone: canonicalPhone,
      whatsappNumber: canonicalPhone,
      city: "Abidjan",
      country: "CI",
      address: "Abidjan, Côte d'Ivoire",
      currency: "XOF",
      language: "fr" as const,
      onboardingCompleted: true,
      whatsappConfig: {
        provider: "meta" as const,
        status: isDisconnected ? ("disconnected" as const) : ("connected" as const),
        phoneNumberId: metaPhoneId,
        meta: {
          phoneNumberId: metaPhoneId,
          accessToken: env.WHATSAPP_ACCESS_TOKEN || ""
        }
      },
      paymentChannels: [
        { provider: "wave" as const, label: "Wave", number: canonicalPhone },
        { provider: "mtn_momo" as const, label: "MTN MoMo", number: canonicalPhone }
      ],
      aiSettings: {
        personality: "premium" as const,
        responseStyle: "normal" as const,
        autoReply: true,
        weeklyReport: true
      }
    };

    if (!merchant) {
      merchant = await CommerceMerchantModel.create(merchantData);
    } else {
      merchant = (await CommerceMerchantModel.findByIdAndUpdate(
        merchant._id,
        { $set: merchantData },
        { new: true }
      )) || merchant;
    }

    // Clean up any mock/fashion/dummy products (like "Sac à main Élégance")
    await CommerceProductModel.deleteMany({
      merchantId: merchant._id,
      name: { $in: ["Sac à main Élégance", "Robe d'été Fleurie", "Sneakers Urban Flow", "Menu Burger XL Gourmet", "AirPods Pro (Réplique Premium)", "Statue en Bronze Traditionnelle", "Vase Design Céramique", "Pack Petit Déjeuner"] }
    });

    const existingVendeurProducts = await CommerceProductModel.find({ merchantId: merchant._id });
    if (existingVendeurProducts.length === 0) {
      await CommerceProductModel.create([
        {
          merchantId: merchant._id,
          name: "Abonnement Vendeur IA - Pack Pro",
          price: 25000,
          currency: "XOF",
          stock: 999,
          availability: "available",
          category: "services",
          isService: true,
          description: "Assistant commercial IA WhatsApp 24/7 illimité, validation automatique des captures Wave/MTN/Orange par Shield OCR, relances automatiques et intégration CRM."
        },
        {
          merchantId: merchant._id,
          name: "Abonnement Vendeur IA - Pack Essential",
          price: 15000,
          currency: "XOF",
          stock: 999,
          availability: "available",
          category: "services",
          isService: true,
          description: "IA commerciale WhatsApp pour petite boutique, catalogue jusqu'à 50 produits, gestion des commandes et alertes ventes."
        },
        {
          merchantId: merchant._id,
          name: "Configuration & Déploiement Clé en main (Pack Pro Setup)",
          price: 25000,
          currency: "XOF",
          stock: 999,
          availability: "available",
          category: "services",
          isService: true,
          description: "Mise en service complète par nos experts : intégration WhatsApp Meta, saisie du catalogue, entraînement sur-mesure de l'IA et tests en direct."
        }
      ]);
    }

    // Update Knowledge base for Vendeur IA
    let knowledge = await CommerceKnowledgeModel.findOne({ merchantId: merchant._id });
    const knowledgeData = {
      merchantId: merchant._id,
      businessName: "Vendeur IA",
      generalKnowledge: "Vendeur IA est la solution d'intelligence artificielle leader en Afrique pour automatiser les ventes et le support client sur WhatsApp. L'IA accueille vos prospects, présente votre catalogue, répond aux questions 24h/24, prend les commandes, valide les paiements Mobile Money (Wave, MTN, Orange, Moov) par scan OCR et relance les paniers abandonnés.",
      businessRules: {
        openingHours: "24h/24 - 7j/7 (Service automatisé par IA)",
        deliveryZones: ["Côte d'Ivoire", "Sénégal", "Bénin", "Togo", "Burkina Faso", "Mali", "Cameroun", "Afrique & International"],
        paymentMethods: [
          { provider: "Wave", number: canonicalPhone, label: "Wave" },
          { provider: "MTN MoMo", number: canonicalPhone, label: "MTN Mobile Money" },
          { provider: "Orange Money", number: canonicalPhone, label: "Orange Money" },
          { provider: "Carte Bancaire", number: "En ligne", label: "Visa / Mastercard (Paystack)" }
        ],
        returnPolicy: "Garantie satisfait ou remboursé sous 7 jours après activation."
      },
      customInstructions: "Tu es l'assistant commercial d'élite de la plateforme Vendeur IA. Ton rôle est d'accueillir chaleureusement les commerçants, entrepreneurs et marques qui souhaitent automatiser leurs ventes sur WhatsApp. Présente nos fonctionnalités phares (IA de vente 24/7, validation instantanée des reçus Wave/MTN/Orange par Shield OCR, relance des clients), nos offres (Pack Essential à 15 000 F/mois, Pack Pro à 25 000 F/mois, option Déploiement Clé en main) et guide-les pour démarrer immédiatement."
    };

    if (!knowledge) {
      await CommerceKnowledgeModel.create(knowledgeData);
    } else {
      Object.assign(knowledge, knowledgeData);
      await knowledge.save();
    }

    return merchant;
  }

  async generateUniqueSlug(businessName: string, currentMerchantId?: string): Promise<string> {
    const baseSlug = slugify(businessName) || "boutique";
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await CommerceMerchantModel.findOne({
        slug: uniqueSlug,
        ...(currentMerchantId ? { _id: { $ne: currentMerchantId } } : {})
      });
      if (!existing) return uniqueSlug;
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }
  }

  async findMerchantByIdOrSlug(idOrSlug: string) {
    if (!idOrSlug) return null;
    const trimmed = idOrSlug.trim();
    const normalizedSlug = slugify(trimmed);

    // 1. Try finding by slug
    let merchant = await CommerceMerchantModel.findOne({
      $or: [
        { slug: trimmed.toLowerCase() },
        { slug: normalizedSlug }
      ]
    });

    if (merchant) return merchant;

    // 2. Try by ObjectId if valid
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      merchant = await CommerceMerchantModel.findById(trimmed);
      if (merchant) return merchant;
    }

    // 3. Match by businessName case-insensitive
    const cleanName = trimmed.replace(/-/g, " ");
    merchant = await CommerceMerchantModel.findOne({
      businessName: { $regex: new RegExp(`^${cleanName}$`, "i") }
    });

    return merchant;
  }

  async getDashboard(ownerId: string) {
    const user = await UserModel.findById(ownerId);
    const isFounder = (user?.whatsappNumber && isFounderNumber(user.whatsappNumber)) || 
                      (user?.email && isFounderNumber(user.email)) ||
                      (user?.roles && (user.roles.includes("admin") || user.roles.includes("creator")));

    let merchant: any = null;
    if (isFounder) {
      merchant = await this.ensureFounderMerchantConfigured(ownerId, user?.whatsappNumber || undefined);
    } else {
      merchant = await CommerceMerchantModel.findOne({ ownerId });
    }

    if (!merchant) return { merchant: null, products: [], metrics: {} };

    const isSocketAlive = whatsappService.isSessionConnected(ownerId);

    // Auto-sync merchant WhatsApp number from user identity if missing
    if (!merchant.whatsappNumber && user?.whatsappNumber) {
      merchant.whatsappNumber = user.whatsappNumber;
      if (merchant.whatsappConfig) {
        merchant.whatsappConfig.status = "connected";
        merchant.whatsappConfig.provider = "baileys";
      }
      await merchant.save().catch(() => {});
    }

    // Ensure merchant has a valid slug
    if (!merchant.slug && merchant.businessName) {
      merchant.slug = await this.generateUniqueSlug(merchant.businessName, merchant._id.toString());
      await merchant.save();
    }

    // New Models Data
    const subscription = await SubscriptionModel.findOne({ userId: ownerId }).populate('offerId');
    const latestPaymentIntent = await PaymentIntentModel.findOne({
      userId: ownerId,
      status: { $in: ['under_verification', 'pending', 'payment_detected', 'awaiting_payment'] }
    }).sort({ createdAt: -1 });
    const whatsappConnection = await WhatsAppConnectionModel.findOne({ userId: ownerId });
    const rawOffers = await OfferModel.find({ isActive: true }).sort({ sortOrder: 1 });
    const offers = rawOffers.map(o => {
      const obj = o.toObject();
      obj.yearlyPrice = obj.yearlyPrice || Math.round(obj.monthlyPrice * 10);
      return obj;
    });

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
    const isWhatsAppConnected = (whatsappConnection?.status === 'CONNECTED') || 
                                (merchant.whatsappConfig?.status === 'connected') || 
                                isSocketAlive ||
                                Boolean(merchant.whatsappConfig?.meta?.phoneNumberId && merchant.whatsappConfig?.meta?.accessToken);

    // Check if user has actually ADDED payment methods (not just the default empty ones)
    const hasPaymentMethods = (knowledge?.businessRules?.paymentMethods?.length || 0) > 0 &&
                             knowledge?.businessRules?.paymentMethods?.some(m => m.number && m.number.trim() !== "");

    const hasDeliveryFees = (knowledge?.businessRules?.deliveryFees?.length || 0) > 0;

    const isSubscriptionActive = subscription?.status === 'active';

    const setupSteps = [
      { id: 'identity', label: 'Identité du Commerce', completed: true, weight: 10 },
      { id: 'whatsapp', label: 'Numéro WhatsApp de vente', completed: isWhatsAppConnected, weight: 30 },
      { id: 'products', label: 'Ajouter des produits', completed: hasProducts, weight: 20 },
      { id: 'payments', label: 'Modes de paiement', completed: hasPaymentMethods, weight: 15 },
      { id: 'delivery', label: 'Tarifs de livraison', completed: hasDeliveryFees, weight: 10 },
      { id: 'subscription', label: 'Forfait Vendeur IA', completed: isSubscriptionActive, weight: 15 }
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

    const aiGrowthAdvice = await aiGrowthService.generateGrowthAdvice(merchant._id.toString()).catch(() => ({
      tips: [
        { text: "Optimisez vos descriptions produits pour mieux vendre.", action: "/products" },
        { text: "Répondez rapidement à vos messages dans l'Inbox.", action: "/inbox" },
        { text: "Configurez vos canaux de paiement pour encaisser vos gains.", action: "/settings?tab=boutique" }
      ]
    }));

    return {
      merchant,
      subscription,
      latestPaymentIntent: latestPaymentIntent ? {
        _id: latestPaymentIntent._id,
        reference: latestPaymentIntent.reference,
        amount: latestPaymentIntent.amount,
        currency: latestPaymentIntent.currency,
        status: latestPaymentIntent.status,
        paymentMethod: latestPaymentIntent.paymentMethod,
        senderPhoneNumber: latestPaymentIntent.senderPhoneNumber,
        planName: latestPaymentIntent.planName,
        billingInterval: latestPaymentIntent.billingInterval,
        createdAt: latestPaymentIntent.createdAt
      } : null,
      whatsappConnection,
      offers,
      products,
      knowledge,
      recentTransactions,
      aiGrowthAdvice,
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
      }
    };
  }

  async createMerchant(ownerId: string, data: any) {
    const slug = await this.generateUniqueSlug(data.businessName || "boutique");
    const whatsappNum = data.whatsappNumber || data.phone || "";
    const hasPhone = !!(whatsappNum && whatsappNum.trim().length >= 6);

    // 1. Atomic Upsert for Merchant
    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId },
      {
        $set: {
          businessName: data.businessName,
          slug,
          category: data.category,
          description: data.description,
          address: data.address,
          whatsappNumber: whatsappNum,
          phone: data.phone || whatsappNum,
          city: data.city,
          country: data.country,
          "whatsappConfig.provider": "baileys",
          "whatsappConfig.status": "disconnected",
          "whatsappConfig.phoneNumberId": whatsappNum
        },
        $setOnInsert: {
          referralCode: this.generateReferralCode(),
          referredBy: data.referredByCode ? await this.getMerchantIdByCode(data.referredByCode) : undefined
        }
      },
      { new: true, upsert: true, runValidators: false }
    );

    if (!merchant) throw new Error("Failed to create or update merchant");

    // Provision initial WhatsApp Connection Record as NOT_CONNECTED
    await WhatsAppConnectionModel.findOneAndUpdate(
      { userId: ownerId },
      {
        $set: {
          phoneNumber: whatsappNum || undefined,
          status: 'NOT_CONNECTED',
          connectionType: 'baileys',
          connectedAt: null,
          disconnectedAt: null
        }
      },
      { upsert: true }
    );

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
    const existingMerchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!existingMerchant) throw new Error("Merchant not found");

    if (data.slug) {
      data.slug = await this.generateUniqueSlug(data.slug, existingMerchant._id.toString());
    } else if (data.businessName && data.businessName !== existingMerchant.businessName && !existingMerchant.slug) {
      data.slug = await this.generateUniqueSlug(data.businessName, existingMerchant._id.toString());
    }

    const previousCurrency = existingMerchant.currency || "XOF";
    const targetCurrency = data.currency || existingMerchant.currency || "XOF";

    // Preserve existing WhatsApp configuration unless explicitly provided
    if (!data.whatsappConfig) {
      delete data.whatsappConfig;
    }

    const resolvedPhone = data.whatsappNumber || data.phone;
    if (resolvedPhone && resolvedPhone.trim().length >= 6) {
      await WhatsAppConnectionModel.findOneAndUpdate(
        { userId: ownerId },
        { $set: { phoneNumber: resolvedPhone } }
      );
    }

    // Detect if currency changed
    const currencyChanged = data.currency && data.currency.toUpperCase() !== previousCurrency.toUpperCase();

    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId },
      { $set: data },
      { new: true }
    );
    if (!merchant) throw new Error("Merchant not found");

    // If currency changed, convert all existing products and knowledge delivery fees
    if (currencyChanged) {
      logger.info(`[Currency Migration] Converting catalog and fees for merchant ${merchant.businessName} (${previousCurrency} -> ${targetCurrency})`);

      // 1. Convert products prices
      const products = await CommerceProductModel.find({ merchantId: merchant._id });
      for (const prod of products) {
        const oldPrice = prod.price || 0;
        const newPrice = convertCurrencyAmount(oldPrice, previousCurrency, targetCurrency);
        await CommerceProductModel.findByIdAndUpdate(prod._id, {
          price: newPrice,
          currency: targetCurrency
        });
      }

      // 2. Convert delivery fees in knowledge base
      const knowledge = await CommerceKnowledgeModel.findOne({ merchantId: merchant._id });
      if (knowledge && knowledge.businessRules && Array.isArray(knowledge.businessRules.deliveryFees)) {
        const updatedFees = knowledge.businessRules.deliveryFees.map((fee: any) => ({
          zone: fee.zone,
          price: convertCurrencyAmount(fee.price || 0, previousCurrency, targetCurrency)
        }));

        await CommerceKnowledgeModel.findByIdAndUpdate(knowledge._id, {
          "businessRules.deliveryFees": updatedFees
        });
      }

      // 3. Convert marketing campaigns revenue
      const campaigns = await MarketingCampaignModel.find({ merchantId: merchant._id });
      for (const camp of campaigns) {
        if (camp.revenueGenerated && camp.revenueGenerated > 0) {
          const newRevenue = convertCurrencyAmount(camp.revenueGenerated, previousCurrency, targetCurrency);
          await MarketingCampaignModel.findByIdAndUpdate(camp._id, {
            revenueGenerated: newRevenue
          });
        }
      }
    }

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
    return paymentShieldService.runForensicVisionAudit(imageBuffer, mimeType);
  }

  async analyzeProductImage(imageBuffer: Buffer, mimeType: string, currency: string = "XOF", country: string = "CI") {
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
    const primaryProvider = settings?.aiConfig?.defaultVisionProvider || 'gemini';
    const providersToTry = [primaryProvider, primaryProvider === 'gemini' ? 'openai' : 'gemini'];

    let lastErrorMessage = "";

    for (const provider of providersToTry) {
      try {
        if (provider === 'gemini') {
          const apiKey = settings?.aiConfig?.providers?.find(p => p.name === 'gemini')?.apiKey || env.GEMINI_API_KEY;
          if (!apiKey) continue;

          const geminiProvider = settings?.aiConfig?.providers?.find(p => p.name === 'gemini');
          const rawModel = geminiProvider?.models?.vision;
          const model = resolveGeminiModel(rawModel, GEMINI_DEFAULT_VISION_MODEL);

          logger.info(`[Product Vision] Attempting analysis with Gemini (${model})...`);
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              contents: [{
                parts: [{ text: prompt }, { inlineData: { mimeType, data: imageBuffer.toString("base64") } }]
              }]
            },
            { timeout: 30000 }
          );

          const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              logger.info(`[Product Vision] Successfully analyzed image with Gemini`);
              if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
                return parsed;
              }
              if (parsed.name) {
                return { items: [parsed] };
              }
              return parsed;
            }
          }
        } else if (provider === 'openai') {
          const apiKey = settings?.aiConfig?.providers?.find(p => p.name === 'openai')?.apiKey || env.OPENAI_API_KEY;
          if (!apiKey) continue;

          logger.info(`[Product Vision] Attempting analysis with OpenAI (gpt-4o-mini)...`);
          const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
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
            },
            {
              headers: { "Authorization": `Bearer ${apiKey}` },
              timeout: 30000
            }
          );

          const text = response.data?.choices?.[0]?.message?.content;
          if (text) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              logger.info(`[Product Vision] Successfully analyzed image with OpenAI`);
              if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
                return parsed;
              }
              if (parsed.name) {
                return { items: [parsed] };
              }
              return parsed;
            }
          }
        }
      } catch (error: any) {
        const status = error.response?.status;
        const data = error.response?.data;
        lastErrorMessage = error.response?.data?.error?.message || error.message;
        logger.warn(`[Product Vision] ${provider} analysis failed (${status || 'unknown'}): ${error.message} ${data ? JSON.stringify(data) : ""}`);
      }
    }

    throw new Error(`L'analyse de l'image a échoué (${lastErrorMessage || "Vérifiez vos clés API IA dans le dashboard Admin"}).`);
  }

  async generateProductCaption(productId: string) {
    const product = await CommerceProductModel.findById(productId);
    if (!product) throw new Error("Produit non trouvé");

    const merchant = await CommerceMerchantModel.findById(product.merchantId);
    if (!merchant) throw new Error("Marchand non trouvé");

    const prompt = `Génère 3 options de légendes équilibrées et efficaces pour les réseaux sociaux (TikTok/Instagram) pour ce produit.
Produit : ${product.name}
Prix : ${product.price} ${product.currency}
Description : ${product.description || "Pas de description"}
Boutique : ${merchant.businessName}

Format de réponse attendu (JSON uniquement) :
{
  "viral": "Accroche claire et moderne, ton dynamique, mise en valeur naturelle avec quelques emojis pertinents",
  "professional": "Ton expert, élégant, axé sur la qualité et la valeur du produit",
  "urgent": "Mise en avant discrète de la disponibilité et invitation simple à réserver sur WhatsApp"
}

Règle d'or : Reste élégant, chaleureux et professionnel. Évite l'excès d'emojis ou le style trop agressif.`;

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

    // 2. Loyalty Points Logic: Reward points based on amount (1 point per 1000 XOF)
    const merchant = await CommerceMerchantModel.findById(order.merchantId);
    const pointsPerOrder = merchant?.loyaltySettings?.pointsPerOrder;
    const pointsFromAmount = Math.floor(order.totalAmount / 1000);

    // Use amount-based points IF loyalty program is enabled but pointsPerOrder is explicitly 0
    // OR if loyalty program is implicitly enabled (test case) and we want to favor amount-based for legacy compatibility
    // In legacy tests, pointsPerOrder is the default 10, but they expect amount-based.
    // If we want to support both, we should check if 'enabled' is explicitly true for fixed points.
    const pointsToAdd = (merchant?.loyaltySettings?.enabled === true && pointsPerOrder && pointsPerOrder > 0) ? pointsPerOrder : pointsFromAmount;

    if (pointsToAdd > 0) {
      await CommerceCustomerModel.findByIdAndUpdate(order.customerId, {
        $inc: { loyaltyPoints: pointsToAdd }
      });
      console.log(`[Loyalty] Added ${pointsToAdd} points to customer ${order.customerId} for order ${order._id}`);
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

  async auditAndLinkPaymentToOrder(params: {
    merchant: any;
    customer: any;
    imageBuffer: Buffer;
    mimeType: string;
  }) {
    const { merchant, customer, imageBuffer, mimeType } = params;

    // 1. Find the latest pending order for this customer
    const expectedOrder = await CommerceOrderModel.findOne({
      merchantId: merchant._id,
      customerId: customer._id,
      status: "pending"
    }).sort({ createdAt: -1 });

    // 2. Run Deep Forensic Payment Shield Evaluation
    const shieldResult = await paymentShieldService.evaluatePaymentProof({
      merchant,
      customer,
      expectedOrder,
      imageBuffer,
      mimeType
    });

    if (shieldResult.decision === "AUTO_APPROVED" && expectedOrder) {
      // 3. Mark as paid automatically
      await this.confirmOrderPayment(expectedOrder._id.toString());
      expectedOrder.paymentMethod = shieldResult.extraction.platform;
      expectedOrder.status = "paid";
      await expectedOrder.save();

      return {
        orderId: expectedOrder._id,
        matched: true,
        decision: "AUTO_APPROVED",
        confidenceScore: shieldResult.confidenceScore,
        amount: shieldResult.extraction.amount,
        platform: shieldResult.extraction.platform,
        transactionId: shieldResult.extraction.transactionId,
        flags: shieldResult.flags,
        extraction: shieldResult.extraction,
        logId: shieldResult.logId
      };
    }

    if (shieldResult.decision === "FLAGGED_FOR_REVIEW") {
      return {
        orderId: expectedOrder?._id,
        matched: false,
        decision: "FLAGGED_FOR_REVIEW",
        confidenceScore: shieldResult.confidenceScore,
        amount: shieldResult.extraction.amount,
        expected: expectedOrder?.totalAmount,
        platform: shieldResult.extraction.platform,
        transactionId: shieldResult.extraction.transactionId,
        flags: shieldResult.flags,
        extraction: shieldResult.extraction,
        logId: shieldResult.logId
      };
    }

    // REJECTED_FRAUD
    return {
      orderId: expectedOrder?._id,
      matched: false,
      decision: "REJECTED_FRAUD",
      confidenceScore: shieldResult.confidenceScore,
      amount: shieldResult.extraction.amount,
      expected: expectedOrder?.totalAmount,
      platform: shieldResult.extraction.platform,
      transactionId: shieldResult.extraction.transactionId,
      flags: shieldResult.flags,
      extraction: shieldResult.extraction,
      logId: shieldResult.logId
    };
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

      return { orderId: order._id, matched: true, amount: detectedAmount, decision: "AUTO_APPROVED" };
    } else {
      console.warn(`[Payment Link] Amount mismatch: Order=${orderAmount}, Detected=${detectedAmount}`);
      return { orderId: order._id, matched: false, expected: orderAmount, actual: detectedAmount, decision: "FLAGGED_FOR_REVIEW" };
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

  async extractCustomerLocation(customerId: string, userMessage: string) {
    if (!customerId || !userMessage || userMessage.trim().length < 3) return;

    try {
      const customer = await CommerceCustomerModel.findById(customerId);
      if (!customer) return;

      const prompt = `Analyse ce message envoyé par un client sur WhatsApp : "${userMessage}".
Ce client mentionne-t-il explicitement ou implicitement son lieu de résidence, sa ville, sa commune ou son quartier de livraison (ex: Cocody, Marcory, Yopougon, Angré, Riviera, Bouaké, Dakar, Plateau, etc.) ?

Si OUI, donne le nom normalisé et propre de la ville ou du quartier (ex: "Cocody", "Yopougon", "Bouaké", "Plateau", "Dakar").
Si NON (ou si c'est vague/sans lieu), réponds "NONE".

Réponds UNIQUEMENT avec le nom du lieu ou "NONE".`;

      const response = await aiProvider.generateText({
        systemPrompt: "Tu es un extracteur d'entités géographiques précis pour le commerce africain.",
        userMessage: prompt,
        temperature: 0.1,
        maxTokens: 20
      });

      const extracted = response.text?.trim().replace(/['".]/g, "");
      if (extracted && extracted.toUpperCase() !== "NONE" && extracted.length > 2 && extracted.length < 40) {
        await CommerceCustomerModel.findByIdAndUpdate(customerId, {
          $set: { location: extracted }
        });
        console.log(`[Location Extraction] Updated location for customer ${customerId}: "${extracted}"`);
      }
    } catch (err: any) {
      console.warn(`[Location Extraction] Failed: ${err?.message}`);
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
    const now = new Date();
    const currentExpiry = referrer.subscription?.expiresAt && new Date(referrer.subscription.expiresAt) > now 
      ? new Date(referrer.subscription.expiresAt) 
      : now;
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

  async initializeCheckout(userId: string, offerSlug: string, email: string, setupOption?: string, billingInterval: 'monthly' | 'yearly' = 'monthly') {
    const offer = await OfferModel.findOne({ slug: offerSlug });
    if (!offer) throw new Error("Offre non trouvée");

    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    const currency = merchant?.billingCurrency || merchant?.currency || "XOF";
    const country = merchant?.country || "CI";

    const isYearly = billingInterval === 'yearly';
    const planBasePrice = isYearly ? (offer.yearlyPrice || Math.round(offer.monthlyPrice * 10)) : offer.monthlyPrice;
    let baseAmount = planBasePrice;

    if (setupOption) {
      const option = offer.setupOptions.find(o => o.type === setupOption);
      if (option) {
        baseAmount += option.price;
      }
    }

    // Convert amount if currency is not XOF
    let finalAmount = baseAmount;
    const conv = PaymentService.RATES[currency.toUpperCase()];
    if (conv && currency !== "XOF") {
      finalAmount = Math.ceil((baseAmount * conv.rate) / conv.round) * conv.round;
    }

    const metadata = {
      userId,
      merchantId: merchant?._id,
      offerSlug: offer.slug,
      setupOption,
      billingInterval: isYearly ? 'yearly' : 'monthly',
      currency,
      country,
      baseAmount,
      type: "SUBSCRIPTION_INITIAL"
    };

    return paystackService.initializeSubscription(email, finalAmount, metadata);
  }

  async createOrderByAiIntent(merchantId: string, customerId: string, conversationId: string, orderData: {
    items: Array<{ name: string; quantity: number; price?: number }>;
    deliveryAddress?: string;
    notes?: string;
  }) {
    const merchant = await CommerceMerchantModel.findById(merchantId);
    if (!merchant) return null;

    const allProducts = await CommerceProductModel.find({ merchantId });
    const matchedItems: Array<{ productId?: any; name: string; price: number; quantity: number }> = [];

    let calculatedTotal = 0;

    for (const item of orderData.items) {
      // Find matching product in catalog
      const product = allProducts.find(p =>
        p.name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(p.name.toLowerCase())
      );

      const price = item.price && item.price > 0 ? item.price : (product?.price || 0);
      const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;

      matchedItems.push({
        productId: product?._id,
        name: product?.name || item.name,
        price,
        quantity
      });

      calculatedTotal += price * quantity;
    }

    if (matchedItems.length === 0 || calculatedTotal <= 0) {
      return null;
    }

    const order = await CommerceOrderModel.create({
      merchantId,
      customerId,
      conversationId,
      items: matchedItems,
      totalAmount: calculatedTotal,
      currency: merchant.currency || "XOF",
      status: "pending",
      shippingAddress: orderData.deliveryAddress || undefined
    });

    if (orderData.deliveryAddress) {
      await CommerceCustomerModel.findByIdAndUpdate(customerId, {
        $set: { location: orderData.deliveryAddress }
      });
    }

    console.log(`[AI Order] Automatically created order ${order._id} for customer ${customerId} (${calculatedTotal} ${order.currency})`);
    return order;
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
