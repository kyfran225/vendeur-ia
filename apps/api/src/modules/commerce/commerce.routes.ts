import express, { Router } from "express";
import mongoose from "mongoose";
import { commerceService } from "./commerce.service.js";
import { whatsappService } from "../whatsapp/whatsapp.service.js";
import { messagingService } from "../../services/messaging.service.js";
import { formatToWhatsAppRecipient } from "@vendeur-ia/core";
import { paystackService } from "../../services/paystack.service.js";
import { env } from "../../config/env.js";
import { authenticate } from "../../middleware/authenticate.js";
import jwt from "jsonwebtoken";
import { aiLimiter } from "../../middleware/rate-limiter.js";
import { logger } from "../../services/logger.service.js";
import { validate } from "../../middleware/validate.js";
import { CreateProductSchema, UpdateMerchantSchema, UpdateProductSchema, CreateOrderSchema } from "./commerce.schema.js";
import { CommerceMerchantModel, CommerceProductModel, CommerceConversationModel, CommerceMessageModel, CommerceCustomerModel, CommerceOrderModel, CommerceKnowledgeModel } from "./commerce.model.js";
import { OfferModel } from "./offer.model.js";
import { SubscriptionModel } from "./subscription.model.js";
import { WhatsAppConnectionModel } from "./whatsapp-connection.model.js";
import { TransactionModel } from "./transaction.model.js";
import { SystemSettingsModel } from "./admin.model.js";
import { PaymentProofLogModel } from "./payment-proof.model.js";
import { PaymentIntentModel } from "./payment-intent.model.js";
import { NewsletterSubscriberModel } from "./newsletter.model.js";
import { paymentService } from "../../services/payment.service.js";
import { CATEGORY_MOCKS } from "./demo.data.js";
import { billingReceiptService } from "../../services/billing-receipt.service.js";
import { marketingService } from "../../services/marketing.service.js";
import { paymentShieldService } from "../../services/payment-shield.service.js";
import { DEFAULT_OFFERS } from "./offers.constants.js";
import { whatsappStatusService } from "../../services/whatsapp-status.service.js";
import { aiQueue } from "../../services/ai-queue.service.js";
import { aiProvider } from "../../services/ai-provider.js";
import axios from "axios";
import multer from "multer";
import { emitToUser, getSocketServer } from "../../realtime/socketServer.js";
import { UserModel } from "../auth/user.model.js";
import { isFounderNumber } from "../auth/auth.service.js";
import { storageService } from "../../services/storage.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware express.json() for all routes EXCEPT Paystack Webhook
// We apply it manually to the router
router.use((req, res, next) => {
  if (req.path === "/webhooks/paystack") {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

router.get("/dashboard", authenticate, async (req, res) => {
  const ownerId = (req as any).user?.id;
  const data = await commerceService.getDashboard(ownerId);

  // Also include public system settings (like support number)
  const settings = await SystemSettingsModel.findOne();

  res.json({
    ...data,
    systemSettings: {
      supportWhatsApp: settings?.supportWhatsApp || "+2250700000000",
      packProFee: settings?.pricing?.packProFee || 25000
    }
  });
});

router.get("/verify-transaction/:reference", authenticate, async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = (req as any).user.id;

    let transaction = await TransactionModel.findOne({ reference, ownerId: userId });

    if (!transaction || transaction.status !== 'success') {
      console.log(`[Verify Route] Transaction ${reference} non enregistrée ou non complétée localement. Vérification directe Paystack...`);
      const data = await paystackService.verifyTransaction(reference);

      if (data && data.status === 'success') {
        const { type, offerSlug, billingInterval, setupOption } = data.metadata || {};
        const offer = await OfferModel.findOne({ slug: offerSlug || (type === 'pack_pro' ? 'pro' : 'essential') });

        const isYearly = billingInterval === 'yearly';
        const existingSub = await SubscriptionModel.findOne({ userId });
        const existingMerchant = await CommerceMerchantModel.findOne({ ownerId: userId });
        const now = new Date();
        const currentValidUntil = (existingSub?.currentPeriodEnd && new Date(existingSub.currentPeriodEnd) > now)
          ? new Date(existingSub.currentPeriodEnd)
          : (existingMerchant?.subscription?.expiresAt && new Date(existingMerchant.subscription.expiresAt) > now)
          ? new Date(existingMerchant.subscription.expiresAt)
          : now;

        const expiresAt = new Date(currentValidUntil);
        if (isYearly) {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        await SubscriptionModel.findOneAndUpdate(
          { userId },
          {
            $set: {
              offerId: offer?._id,
              status: 'active',
              billingInterval: isYearly ? 'yearly' : 'monthly',
              price: data.amount / 100,
              currency: data.currency,
              currentPeriodStart: new Date(),
              currentPeriodEnd: expiresAt,
              paymentMethod: data.channel === 'card' ? 'card' : 'mobile_money',
              providerSubscriptionId: data.subscription_code || null,
              nextBillingDate: data.next_payment_date ? new Date(data.next_payment_date) : null
            }
          },
          { upsert: true, new: true }
        );

        const hasMerchantPhone = !!(existingMerchant?.whatsappNumber || existingMerchant?.phone);

        await WhatsAppConnectionModel.findOneAndUpdate(
          { userId },
          {
            $set: {
              status: hasMerchantPhone ? 'CONNECTED' : 'NOT_CONNECTED',
              connectionType: 'meta',
              connectedAt: hasMerchantPhone ? new Date() : null,
              disconnectedAt: null
            }
          },
          { upsert: true }
        );

        transaction = await TransactionModel.findOneAndUpdate(
          { reference },
          {
            $set: {
              merchantId: (await CommerceMerchantModel.findOne({ ownerId: userId }))?._id,
              ownerId: userId,
              reference: data.reference,
              amount: data.amount / 100,
              currency: data.currency,
              type: type || 'SUBSCRIPTION_INITIAL',
              status: 'success',
              paymentMethod: data.channel,
              paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
              metadata: data.metadata
            }
          },
          { upsert: true, new: true }
        );

        await CommerceMerchantModel.findOneAndUpdate(
          { ownerId: userId },
          {
            $set: {
              "subscription.plan": offerSlug || (type === 'pack_pro' ? 'pro' : 'essential'),
              "subscription.status": "active",
              "subscription.billingInterval": isYearly ? 'yearly' : 'monthly',
              "subscription.expiresAt": expiresAt
            }
          }
        );

        console.log(`[Verify Route] Activation/Renouvellement effectué avec succès pour le paiement ${reference}`);
        const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });

        if (merchant && transaction) {
          if (type === 'pack_pro' || setupOption === 'EXPERT') {
            billingReceiptService.notifyExpertSetupOrdered(merchant._id.toString(), transaction as any).catch(err =>
              console.error("[Verify Route] notifyExpertSetupOrdered failed:", err)
            );
          } else {
            billingReceiptService.sendDigitalReceipt(merchant._id.toString(), transaction as any).catch(err =>
              console.error("[Verify Route] sendDigitalReceipt failed:", err)
            );
          }
        }

        return res.json({ status: 'success', data, merchant });
      } else {
        console.warn(`[Verify Route] Transaction ${reference} refusée ou échouée chez Paystack: ${data?.gateway_response || 'Unknown'}`);
        return res.status(400).json({ status: data?.status || 'failed', gateway_response: data?.gateway_response, error: "Paiement non validé par Paystack" });
      }
    }

    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });

    res.json({
      status: transaction.status,
      merchant
    });
  } catch (error: any) {
    console.error(`[Verify Route] Erreur lors de la vérification de ${req.params.reference}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUBLIC SHOP ENDPOINT (Supports both Mongo ID and Custom Slug, e.g. /shop/chic-abidjan)
router.get("/public/shop/:merchantId", async (req, res) => {
  try {
    const merchant = await commerceService.findMerchantByIdOrSlug(req.params.merchantId);
    if (!merchant) return res.status(404).json({ error: "Boutique non trouvée" });

    const isFounder = (merchant.whatsappNumber && isFounderNumber(merchant.whatsappNumber)) ||
                      (merchant.phone && isFounderNumber(merchant.phone)) ||
                      merchant.businessName === "Vendeur IA";

    if (isFounder && merchant.ownerId) {
      await commerceService.ensureFounderMerchantConfigured(merchant.ownerId);
    }

    const products = await CommerceProductModel.find({
      merchantId: merchant._id,
      availability: { $ne: "hidden" }
    }).sort({ createdAt: -1 });

    res.json({ merchant, products });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUBLIC SHOP DIRECT ORDER PLACEMENT (Supports both Mongo ID and Custom Slug)
router.post("/public/shop/:merchantId/order", async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { customerName, customerPhone, deliveryAddress, deliveryZone, deliveryFee, items, paymentMethod, deliveryNotes, totalAmount } = req.body;

    const merchant = await commerceService.findMerchantByIdOrSlug(merchantId);
    if (!merchant) return res.status(404).json({ error: "Boutique non trouvée" });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Le panier ne peut pas être vide" });
    }

    if (!customerPhone) {
      return res.status(400).json({ error: "Le numéro de téléphone est obligatoire pour confirmer la commande" });
    }

    // 1. Find or create Customer
    let customer = await CommerceCustomerModel.findOne({
      merchantId: merchant._id,
      phone: customerPhone.trim()
    });

    if (!customer) {
      customer = await CommerceCustomerModel.create({
        merchantId: merchant._id,
        phone: customerPhone.trim(),
        name: customerName?.trim() || "Client Web",
        platform: "web",
        location: deliveryAddress?.trim() || deliveryZone || ""
      });
    } else {
      if (customerName && (!customer.name || customer.name === "Client Web")) {
        customer.name = customerName.trim();
      }
      if (deliveryAddress) {
        customer.location = deliveryAddress.trim();
      }
      await customer.save();
    }

    // 2. Format Items and update stock
    const formattedItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const product = await CommerceProductModel.findOne({
        _id: item.productId,
        merchantId: merchant._id
      });

      if (product) {
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        formattedItems.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: qty
        });
        calculatedTotal += (product.price * qty);

        // Decrement stock if tracked
        if (typeof product.stock === "number" && product.stock > 0) {
          product.stock = Math.max(0, product.stock - qty);
          await product.save();
        }
      }
    }

    const finalDeliveryFee = parseInt(deliveryFee, 10) || 0;
    const finalTotal = totalAmount ? parseInt(totalAmount, 10) : (calculatedTotal + finalDeliveryFee);

    // 3. Create CommerceOrder in DB
    const order = await CommerceOrderModel.create({
      merchantId: merchant._id,
      customerId: customer._id,
      items: formattedItems,
      totalAmount: finalTotal,
      currency: merchant.currency || "XOF",
      status: "pending",
      paymentMethod: paymentMethod || "cash_on_delivery",
      shippingAddress: `${deliveryZone ? `[${deliveryZone}] ` : ""}${deliveryAddress || "À préciser via WhatsApp"}`,
      deliveryNotes: deliveryNotes || ""
    });

    // 4. Realtime Socket notification to merchant dashboard
    try {
      emitToUser(merchant.ownerId.toString(), "order:created", {
        order: order.toObject(),
        customer: customer.toObject(),
        fromWebShop: true
      });
    } catch (sockErr) {
      console.warn("[Realtime] Order notification emit failed:", sockErr);
    }

    res.status(201).json({
      success: true,
      order,
      merchant: {
        businessName: merchant.businessName,
        whatsappNumber: merchant.whatsappNumber,
        currency: merchant.currency
      }
    });
  } catch (error: any) {
    console.error("[Public Order Error]", error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// PUBLIC META & GOOGLE SHOPPING XML CATALOG FEED (RSS 2.0)
// -------------------------------------------------------------
router.get("/storefront/:slugOrId/feed.xml", async (req, res) => {
  try {
    const { slugOrId } = req.params;
    let merchant = await CommerceMerchantModel.findOne({ slug: slugOrId }).lean();
    if (!merchant) {
      try {
        merchant = await CommerceMerchantModel.findById(slugOrId).lean();
      } catch (err) {
        // Not a valid ObjectId
      }
    }

    if (!merchant) {
      return res.status(404).send("<error>Marchand non trouvé</error>");
    }

    const products = await CommerceProductModel.find({
      merchantId: merchant._id,
      status: "active"
    }).lean();

    const baseUrl = env.CLIENT_URL || "https://vendeur.ia";
    const storeUrl = `${baseUrl}/store/${merchant.slug || merchant._id}`;

    const escapeXml = (str: string = "") =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>${escapeXml(merchant.businessName)} - Catalogue Vendeur IA</title>\n`;
    xml += `    <link>${escapeXml(storeUrl)}</link>\n`;
    xml += `    <description>${escapeXml(merchant.description || "Catalogue officiel de produits en ligne")}</description>\n`;

    for (const product of products) {
      const productLink = `${storeUrl}?product=${product._id}`;
      const imageUrl = (product.images && product.images[0]) || merchant.branding?.logoUrl || "";
      const priceFormatted = `${product.price} ${merchant.currency || "XOF"}`;
      const availability = (product.stock === undefined || product.stock > 0) ? "in stock" : "out of stock";

      xml += `    <item>\n`;
      xml += `      <g:id>${product._id}</g:id>\n`;
      xml += `      <g:title>${escapeXml(product.name)}</g:title>\n`;
      xml += `      <g:description>${escapeXml(product.description || product.name)}</g:description>\n`;
      xml += `      <g:link>${escapeXml(productLink)}</g:link>\n`;
      if (imageUrl) {
        xml += `      <g:image_link>${escapeXml(imageUrl)}</g:image_link>\n`;
      }
      xml += `      <g:price>${priceFormatted}</g:price>\n`;
      xml += `      <g:condition>new</g:condition>\n`;
      xml += `      <g:availability>${availability}</g:availability>\n`;
      xml += `      <g:brand>${escapeXml(merchant.businessName)}</g:brand>\n`;
      xml += `    </item>\n`;
    }

    xml += `  </channel>\n`;
    xml += `</rss>`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  } catch (error: any) {
    res.status(500).send(`<error>${error.message}</error>`);
  }
});

router.get("/conversations", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const ownerId = user?.id || user?._id?.toString();
    const userDoc = await UserModel.findById(ownerId);

    const isFounder = (userDoc?.whatsappNumber && isFounderNumber(userDoc.whatsappNumber)) ||
                      (userDoc?.email && isFounderNumber(userDoc.email)) ||
                      (userDoc?.roles && (userDoc.roles.includes("admin") || userDoc.roles.includes("creator")));

    const merchantIds: any[] = [];

    // 1. Direct merchants for this ownerId
    const ownMerchants = await CommerceMerchantModel.find({
      $or: [
        { ownerId },
        ...(ownerId && mongoose.isValidObjectId(ownerId) ? [{ ownerId: new mongoose.Types.ObjectId(ownerId) }] : [])
      ]
    }).select("_id").lean();

    ownMerchants.forEach(m => merchantIds.push(m._id));

    // 2. If founder / admin, also include Vendeur IA system merchant conversations
    if (isFounder) {
      const founderMerchants = await CommerceMerchantModel.find({
        $or: [
          { businessName: "Vendeur IA" },
          { whatsappNumber: { $regex: '5111157' } },
          { phone: { $regex: '5111157' } },
          { "whatsappConfig.phoneNumberId": env.WHATSAPP_PHONE_ID }
        ]
      }).select("_id").lean();

      founderMerchants.forEach(m => {
        if (!merchantIds.some(id => id.toString() === m._id.toString())) {
          merchantIds.push(m._id);
        }
      });
    }

    if (merchantIds.length === 0) return res.json([]);

    const conversations = await CommerceConversationModel.find({ merchantId: { $in: merchantIds } })
      .populate("customerId")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const populatedConversations = await Promise.all(conversations.map(async (conv) => {
      const lastMsg = await CommerceMessageModel.findOne({ conversationId: conv._id })
        .sort({ timestamp: -1 });

      const convObj = conv.toObject();
      const cust = convObj.customerId as any;
      if (cust && cust.name) {
        const ownerName = userDoc?.displayName;
        const rawName = cust.name.trim();
        const isNumericFragment = /^\d{1,4}$/.test(rawName);
        const isCorrupted =
          isNumericFragment ||
          (ownerName && rawName.toLowerCase() === ownerName.trim().toLowerCase()) ||
          rawName.includes("Co-Fondateur") ||
          (rawName.toLowerCase().includes("franck") && !cust.phone?.includes("5111157")) ||
          rawName.toLowerCase() === "vendeur ia";

        if (isCorrupted) {
          cust.name = undefined;
        }
      }

      if (cust && !cust.avatarUrl && cust.phone) {
        const clean = cust.phone.replace(/\D/g, "");
        if (clean.length >= 8) {
          const match = await CommerceCustomerModel.findOne({
            phone: { $regex: clean.slice(-8) },
            avatarUrl: { $exists: true, $nin: ["", null] }
          }).select("avatarUrl").lean();
          if (match?.avatarUrl) {
            cust.avatarUrl = match.avatarUrl;
          }
        }
      }

      return {
        ...convObj,
        customerId: cust,
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          sender: lastMsg.sender,
          type: lastMsg.type,
          timestamp: lastMsg.timestamp
        } : null
      };
    }));

    res.json(populatedConversations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/conversations/:id/messages", authenticate, async (req, res) => {
  try {
    const messages = await CommerceMessageModel.find({ conversationId: req.params.id })
      .sort({ timestamp: 1 });

    // Mark conversation as read
    await CommerceConversationModel.findByIdAndUpdate(req.params.id, {
      $set: { unreadCount: 0 }
    }).catch(() => {});

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/conversations/:id/read", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const conversation = await CommerceConversationModel.findByIdAndUpdate(
      req.params.id,
      { $set: { unreadCount: 0 } },
      { new: true }
    );

    if (conversation) {
      const unreadCustomerMessages = await CommerceMessageModel.find({
        conversationId: req.params.id,
        sender: "customer",
        whatsappMessageId: { $exists: true, $ne: null }
      }).limit(50).lean();

      await CommerceMessageModel.updateMany(
        { conversationId: req.params.id, sender: "customer", status: { $ne: "read" } },
        { $set: { status: "read", readAt: new Date() } }
      );

      // Send read receipt and subscribe to presence on WhatsApp network
      if (conversation.platform === "whatsapp") {
        try {
          const customer = await CommerceCustomerModel.findById(conversation.customerId);
          if (customer?.phone) {
            whatsappService.subscribePresence(ownerId, customer.phone).catch(() => {});
            if (unreadCustomerMessages.length > 0) {
              const { jid } = formatToWhatsAppRecipient(customer.phone);
              if (jid) {
                const keys = unreadCustomerMessages.map(m => ({
                  remoteJid: jid,
                  id: m.whatsappMessageId,
                  fromMe: false
                }));
                whatsappService.markConversationAsRead(ownerId, customer.phone, keys).catch(() => {});
              }
            }
          }
        } catch (err) {}
      }

      const convIdStr = conversation._id.toString();
      const readPayload = {
        conversationId: convIdStr,
        unreadCount: 0
      };

      const targetUserIds = new Set<string>([ownerId.toString()]);
      if (conversation.merchantId) targetUserIds.add(conversation.merchantId.toString());

      targetUserIds.forEach(tId => {
        emitToUser(tId, "conversation:read", readPayload);
      });

      const io = getSocketServer();
      if (io) {
        io.to(`conv:${convIdStr}`).emit("conversation:read", readPayload);
        io.emit("conversation:read", readPayload);
      }
    }

    res.json(conversation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/conversations/:id/status", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const { status } = req.body;
    if (!["active", "needs_human", "converted", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const conversation = await CommerceConversationModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    emitToUser(ownerId, "conversation:update", {
      conversationId: conversation._id,
      status: conversation.status
    });

    res.json(conversation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/conversations/:id/generate-followup", authenticate, async (req, res) => {
  try {
    const result = await commerceService.generateFollowUp(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/conversations/:id/refresh-avatar", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const ownerId = user?.id || user?._id?.toString();
    const conversation = await CommerceConversationModel.findById(req.params.id).populate("customerId");
    if (!conversation) return res.status(404).json({ error: "Conversation non trouvée" });

    const customer = conversation.customerId as any;
    if (!customer?.phone) return res.status(400).json({ error: "Client sans numéro" });

    const cleanDigits = customer.phone.replace(/\D/g, "");

    // 1. Check if another customer document for this phone already has an avatar
    if (!customer.avatarUrl && cleanDigits && cleanDigits.length >= 8) {
      const existing = await CommerceCustomerModel.findOne({
        phone: { $regex: cleanDigits.slice(-8) },
        avatarUrl: { $exists: true, $nin: ["", null] }
      }).select("avatarUrl").lean();

      if (existing?.avatarUrl) {
        customer.avatarUrl = existing.avatarUrl;
        customer.avatarUpdatedAt = new Date();
        await customer.save();
      }
    }

    // 2. Fetch fresh from WhatsApp using conversation merchant owner or active session fallback
    const merchant = await CommerceMerchantModel.findById(conversation.merchantId).select("ownerId").lean();
    const targetUserId = merchant?.ownerId?.toString() || ownerId;

    const avatarUrl = await whatsappService.fetchCustomerAvatarUrl(targetUserId, customer.phone);
    if (avatarUrl) {
      customer.avatarUrl = avatarUrl;
      customer.avatarUpdatedAt = new Date();
      await customer.save();

      // Propagate to all customer records with matching phone
      if (cleanDigits && cleanDigits.length >= 8) {
        await CommerceCustomerModel.updateMany(
          {
            phone: { $regex: cleanDigits.slice(-8) },
            $or: [{ avatarUrl: "" }, { avatarUrl: null }, { avatarUrl: { $exists: false } }]
          },
          { $set: { avatarUrl, avatarUpdatedAt: new Date() } }
        );
      }
    } else {
      customer.avatarUpdatedAt = new Date();
      await customer.save();
    }

    emitToUser(ownerId, "conversation:update", {
      conversationId: conversation._id,
      customerId: customer._id,
      avatarUrl: customer.avatarUrl || null
    });

    res.json({ success: true, avatarUrl: customer.avatarUrl || null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// START DIRECT CONVERSATION / NEW CONTACT CHAT
router.post("/conversations/start", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const { phone, name, initialMessage, senderChannel = "merchant" } = req.body;

    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: "Le numéro de téléphone est requis" });
    }

    const { cleanPhone, jid } = formatToWhatsAppRecipient(phone);
    if (!cleanPhone || cleanPhone.length < 8) {
      return res.status(400).json({ error: "Numéro de téléphone invalide" });
    }

    // Determine merchant (System Vendeur IA or Merchant's own store)
    let merchant: any = null;
    if (senderChannel === "system") {
      merchant = await CommerceMerchantModel.findOne({
        $or: [
          { businessName: "Vendeur IA" },
          { whatsappNumber: { $regex: '5111157' } },
          { phone: { $regex: '5111157' } },
          { "whatsappConfig.phoneNumberId": env.WHATSAPP_PHONE_ID }
        ]
      });
    }

    if (!merchant) {
      merchant = await CommerceMerchantModel.findOne({ ownerId });
    }

    if (!merchant) {
      merchant = await CommerceMerchantModel.findOne({
        $or: [
          { businessName: "Vendeur IA" },
          { whatsappNumber: { $regex: '5111157' } }
        ]
      });
    }

    if (!merchant) return res.status(404).json({ error: "Aucun profil marchand configuré" });

    // 1. Find or create Customer
    let customer = await CommerceCustomerModel.findOne({
      merchantId: merchant._id,
      phone: cleanPhone
    });

    if (!customer) {
      customer = await CommerceCustomerModel.create({
        merchantId: merchant._id,
        phone: cleanPhone,
        name: name?.trim() || undefined
      });
    } else if (name && name.trim() && !customer.name) {
      customer.name = name.trim();
      await customer.save();
    }

    // 2. Find or create Conversation
    let conversation = await CommerceConversationModel.findOne({
      merchantId: merchant._id,
      customerId: customer._id
    });

    if (!conversation) {
      conversation = await CommerceConversationModel.create({
        merchantId: merchant._id,
        customerId: customer._id,
        platform: "whatsapp",
        status: "needs_human",
        unreadCount: 0,
        lastMessageAt: new Date()
      });
    }

    let createdMessage: any = null;

    // 3. Send initial message if provided
    if (initialMessage && initialMessage.trim()) {
      createdMessage = await CommerceMessageModel.create({
        conversationId: conversation._id,
        sender: "human",
        type: "text",
        content: initialMessage.trim(),
        status: "sent",
        timestamp: new Date()
      });

      conversation.lastMessageAt = new Date();
      await conversation.save();

      // Send via WhatsApp
      try {
        const sendRes: any = await messagingService.sendMessage(merchant, "whatsapp", cleanPhone, initialMessage.trim());
        const msgId = sendRes?.key?.id || sendRes?.messageId || sendRes?.id;
        if (msgId) {
          createdMessage.whatsappMessageId = msgId;
          await createdMessage.save();
        }
      } catch (err: any) {
        console.warn("[Start Chat] Initial message send failed:", err.message);
      }
    }

    // Emit realtime socket event
    emitToUser(ownerId, "conversation:update", {
      conversationId: conversation._id,
      message: createdMessage,
      status: conversation.status,
      unreadCount: 0
    });

    res.status(201).json({
      success: true,
      conversationId: conversation._id,
      conversation: {
        ...conversation.toObject(),
        customerId: customer.toObject()
      },
      customer,
      message: createdMessage
    });
  } catch (error: any) {
    console.error("[Start Conversation Error]:", error);
    res.status(500).json({ error: error.message });
  }
});

// MEDIA UPLOAD & DISPATCH (Images, Videos, Audio, Documents/PDF)
router.post("/conversations/:id/media", authenticate, upload.single("file"), async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const conversationId = req.params.id;
    const { caption = "", quotedMessageId } = req.body;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "Fichier média requis" });
    }

    const conversation = await CommerceConversationModel.findById(conversationId).populate("customerId");
    if (!conversation) return res.status(404).json({ error: "Conversation non trouvée" });

    let merchant = await CommerceMerchantModel.findById(conversation.merchantId);
    if (!merchant) {
      merchant = await CommerceMerchantModel.findOne({ ownerId });
    }
    if (!merchant) return res.status(404).json({ error: "Marchand non trouvé" });

    // Determine type
    const mime = req.file.mimetype || "";
    let mediaType: "image" | "audio" | "video" | "document" = "document";
    if (mime.startsWith("image/")) mediaType = "image";
    else if (mime.startsWith("audio/")) mediaType = "audio";
    else if (mime.startsWith("video/")) mediaType = "video";

    // Upload to storage
    const storageResult = await storageService.uploadBuffer(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "inbox-media"
    );

    // Optional Quoted message
    let quotedMessage: any = undefined;
    if (quotedMessageId) {
      const qMsg = await CommerceMessageModel.findById(quotedMessageId);
      if (qMsg) {
        quotedMessage = {
          id: qMsg._id.toString(),
          content: qMsg.content,
          sender: qMsg.sender,
          type: qMsg.type,
          mediaUrl: qMsg.mediaUrl
        };
      }
    }

    // Save message
    const message = await CommerceMessageModel.create({
      conversationId: conversation._id,
      sender: "human",
      type: mediaType,
      content: caption.trim() || (mediaType === "image" ? "[Image]" : mediaType === "audio" ? "[Audio]" : `[${req.file.originalname || "Document"}]`),
      mediaUrl: storageResult.url,
      mediaMetadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      quotedMessage,
      status: "sent",
      timestamp: new Date()
    });

    conversation.lastMessageAt = new Date();
    conversation.status = "needs_human";
    conversation.unreadCount = 0;
    await conversation.save();

    // Emit Realtime
    const convIdStr = conversation._id.toString();
    const updatePayload = {
      conversationId: convIdStr,
      message,
      status: "needs_human",
      unreadCount: 0
    };

    const targetUserIds = new Set<string>([ownerId.toString()]);
    if (merchant.ownerId) targetUserIds.add(merchant.ownerId.toString());

    targetUserIds.forEach(tId => {
      emitToUser(tId, "conversation:update", updatePayload);
    });

    const io = getSocketServer();
    if (io) {
      io.to(`conv:${convIdStr}`).emit("conversation:update", updatePayload);
      io.emit("conversation:update", updatePayload);
    }

    // Send to WhatsApp / External platform
    let customer = conversation.customerId as any;
    if (customer && !customer.phone && !customer.platformId) {
      customer = await CommerceCustomerModel.findById(customer);
    }
    const platform = conversation.platform || "whatsapp";
    const remoteId = platform === "web" ? (customer?.platformId || "WEB_VISITOR") : (customer?.phone || customer?.platformId);

    let deliveryError: string | undefined;
    try {
      const sendRes: any = await messagingService.sendMessage(merchant, platform, remoteId, caption.trim(), {
        type: mediaType,
        mediaUrl: storageResult.url,
        fileBuffer: req.file.buffer,
        audioBuffer: mediaType === "audio" ? req.file.buffer : undefined,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype
      });
      const msgId = sendRes?.key?.id || sendRes?.messageId || sendRes?.id;
      if (msgId) {
        message.whatsappMessageId = msgId;
        await message.save();
      }
    } catch (sendError: any) {
      deliveryError = sendError.message;
      console.error("[Media Send Error]:", sendError.message);
    }

    const finalUpdatePayload = {
      conversationId: convIdStr,
      message,
      status: "needs_human",
      unreadCount: 0
    };

    targetUserIds.forEach(tId => {
      emitToUser(tId, "conversation:update", finalUpdatePayload);
    });

    if (io) {
      io.to(`conv:${convIdStr}`).emit("conversation:update", finalUpdatePayload);
      io.emit("conversation:update", finalUpdatePayload);
    }

    res.status(201).json({ ...message.toObject(), deliveryError });
  } catch (error: any) {
    console.error("[Media Upload Route Error]:", error);
    res.status(500).json({ error: error.message });
  }
});

// ADD REACTION TO MESSAGE (👍❤️😂😮😢🙏🔥)
router.post("/conversations/:id/reactions", authenticate, async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const conversationId = req.params.id;

    if (!messageId || !emoji) {
      return res.status(400).json({ error: "Message ID et émoji sont requis." });
    }

    const message = await CommerceMessageModel.findOne({ _id: messageId, conversationId });
    if (!message) {
      return res.status(404).json({ error: "Message introuvable." });
    }

    const currentReactions: any[] = (message.reactions || []) as any;
    const existingIndex = currentReactions.findIndex((r: any) => r.emoji === emoji);
    if (existingIndex > -1) {
      currentReactions.splice(existingIndex, 1);
    } else {
      currentReactions.push({ emoji, sender: "merchant", timestamp: new Date() });
    }
    (message as any).reactions = currentReactions;

    await message.save();
    res.json({ success: true, reactions: message.reactions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/conversations/:id/messages", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const { content, quotedMessageId } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: "Message content is required" });

    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Marchand non trouvé" });

    const conversation = await CommerceConversationModel.findById(req.params.id).populate("customerId");
    if (!conversation) return res.status(404).json({ error: "Conversation non trouvée" });

    // Populate Quoted Message if provided
    let quotedMessage: any = undefined;
    if (quotedMessageId) {
      const qMsg = await CommerceMessageModel.findById(quotedMessageId);
      if (qMsg) {
        quotedMessage = {
          id: qMsg._id.toString(),
          content: qMsg.content,
          sender: qMsg.sender,
          type: qMsg.type,
          mediaUrl: qMsg.mediaUrl
        };
      }
    }

    // 1. Save message to DB
    const message = await CommerceMessageModel.create({
      conversationId: conversation._id,
      sender: "human",
      type: "text",
      content: content.trim(),
      quotedMessage,
      status: "sent",
      timestamp: new Date()
    });

    // 2. Update conversation
    conversation.lastMessageAt = new Date();
    conversation.status = "needs_human";
    conversation.unreadCount = 0;
    await conversation.save();

    const targetUserIds = new Set<string>([ownerId.toString()]);
    if (merchant.ownerId) targetUserIds.add(merchant.ownerId.toString());

    // 3. Send via Platform Messaging
    let customer = conversation.customerId as any;
    if (customer && !customer.phone && !customer.platformId) {
      customer = await CommerceCustomerModel.findById(customer);
    }
    const platform = conversation.platform || "whatsapp";
    const remoteId = platform === "web" ? (customer?.platformId || "WEB_VISITOR") : (customer?.phone || customer?.platformId);

    let deliveryError: string | undefined;
    try {
      const sendRes: any = await messagingService.sendMessage(merchant, platform, remoteId, content.trim());
      const msgId = sendRes?.key?.id || sendRes?.messageId || sendRes?.id;
      if (msgId) {
        message.whatsappMessageId = msgId;
        await message.save();
      }
    } catch (sendError: any) {
      deliveryError = sendError.message;
      console.error(`[Messaging] Failed to send to ${platform}:`, sendError.message);
      targetUserIds.forEach(tId => {
        emitToUser(tId, "whatsapp:error", {
          message: sendError.message || "Échec de l'envoi du message",
          conversationId: conversation._id
        });
      });
    }

    // 4. Emit real-time sync with final message data
    const convIdStr = conversation._id.toString();
    const updatePayload = {
      conversationId: convIdStr,
      message,
      status: "needs_human",
      unreadCount: 0
    };

    targetUserIds.forEach(tId => {
      emitToUser(tId, "conversation:update", updatePayload);
    });

    const io = getSocketServer();
    if (io) {
      io.to(`conv:${convIdStr}`).emit("conversation:update", updatePayload);
      io.emit("conversation:update", updatePayload);
    }

    res.status(201).json({ ...message.toObject(), deliveryError });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// FAST PAY LINK GENERATOR & SENDER
router.post("/conversations/:id/fast-pay", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Marchand non trouvé" });

    const { amount, title, provider, customNumber, sendDirectly } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    const conversation = await CommerceConversationModel.findOne({
      _id: req.params.id,
      merchantId: merchant._id
    }).populate("customerId");

    if (!conversation) return res.status(404).json({ error: "Conversation non trouvée" });

    const knowledge = await CommerceKnowledgeModel.findOne({ merchantId: merchant._id });
    const configuredMethods = knowledge?.businessRules?.paymentMethods || [];

    // Fallback numbers
    const merchantPhone = merchant.whatsappNumber || "";
    const currency = merchant.currency || "XOF";
    const numAmount = Number(amount);
    const itemTitle = title?.trim() || "Commande en cours";

    // Detect provider numbers
    const waveEntry = configuredMethods.find(m => m.provider.toLowerCase().includes("wave")) ||
      merchant.paymentChannels?.find(c => c.provider?.toLowerCase().includes("wave"));
    const omEntry = configuredMethods.find(m => m.provider.toLowerCase().includes("orange")) ||
      merchant.paymentChannels?.find(c => c.provider?.toLowerCase().includes("orange"));
    const momoEntry = configuredMethods.find(m => m.provider.toLowerCase().includes("mtn")) ||
      merchant.paymentChannels?.find(c => c.provider?.toLowerCase().includes("mtn"));

    const waveNum = customNumber || waveEntry?.number || merchantPhone;
    const omNum = customNumber || omEntry?.number || merchantPhone;
    const momoNum = customNumber || momoEntry?.number || merchantPhone;

    const cleanWave = waveNum.replace(/\+/g, "").replace(/\s/g, "");

    // Build the formatted text
    const lines = [
      `💳 *DEMANDE DE RÈGLEMENT - ${merchant.businessName.toUpperCase()}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📦 *Objet* : ${itemTitle}`,
      `💵 *Montant à payer* : *${numAmount.toLocaleString()} ${currency}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📱 *MOYENS DE PAIEMENT DISPONIBLES :*\n`
    ];

    if (!provider || provider === "all" || provider === "wave") {
      lines.push(`🌊 *WAVE :*`);
      lines.push(`Transférez au : *${waveNum}*`);
      if (cleanWave) {
        lines.push(`🔗 Lien direct Wave : https://wave.com/send?phone=${cleanWave}\n`);
      }
    }

    if (!provider || provider === "all" || provider === "orange") {
      lines.push(`🍊 *ORANGE MONEY :*`);
      lines.push(`Transférez au : *${omNum}*`);
      lines.push(`Composez le : *#144*...#*\n`);
    }

    if (!provider || provider === "all" || provider === "mtn") {
      lines.push(`🟡 *MTN MOBILE MONEY :*`);
      lines.push(`Transférez au : *${momoNum}*`);
      lines.push(`Composez le : *#133#*\n`);
    }

    // Additional channels (IBAN / Bank transfer / custom channels)
    const otherChannels = (merchant.paymentChannels || []).filter(c =>
      !c.provider?.toLowerCase().includes("wave") &&
      !c.provider?.toLowerCase().includes("orange") &&
      !c.provider?.toLowerCase().includes("mtn")
    );

    if (otherChannels.length > 0 && (!provider || provider === "all")) {
      for (const ch of otherChannels) {
        const channelName = (ch.label || ch.provider || "PAIEMENT").toUpperCase();
        lines.push(`💳 *${channelName} :*`);
        lines.push(`Coordonnées : *${ch.number}*\n`);
      }
    }

    lines.push(`🌍 *Depuis l'étranger (France, Europe, USA, Canada) :*`);
    lines.push(`Réglez directement vers nos numéros Mobile Money avec les apps *TapTap Send*, *Sendwave* ou *Orange Money Europe* par carte bancaire.\n`);

    lines.push(
      `━━━━━━━━━━━━━━━━━━━━`,
      `📸 *Veuillez envoyer la capture d'écran du transfert dès validation pour confirmation immédiate.* ✨`
    );

    const formattedText = lines.join("\n");

    if (sendDirectly) {
      // 1. Save to DB
      const message = await CommerceMessageModel.create({
        conversationId: conversation._id,
        sender: "human",
        content: formattedText
      });

      // 2. Dispatch to recipient
      const customer = conversation.customerId as any;
      const platform = conversation.platform || "whatsapp";
      const remoteId = platform === "web" ? (customer.platformId || "WEB_VISITOR") : customer.phone;

      try {
        await messagingService.sendMessage(merchant, platform, remoteId, formattedText);
      } catch (sendError: any) {
        console.error(`[FastPay Messaging Error]`, sendError.message);
      }

      return res.status(201).json({
        success: true,
        message,
        formattedText
      });
    }

    res.json({
      success: true,
      formattedText,
      paymentDetails: {
        waveNum,
        omNum,
        momoNum,
        amount: numAmount,
        currency
      }
    });
  } catch (error: any) {
    console.error("[FastPay Error]", error);
    res.status(500).json({ error: error.message });
  }
});

// MERCHANT VOICE MEMO DISPATCH & AUTO TRANSCRIPTION
router.post("/conversations/:id/voice", authenticate, upload.single("audio"), async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Marchand non trouvé" });

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "Fichier audio manquant" });
    }

    const conversation = await CommerceConversationModel.findOne({
      _id: req.params.id,
      merchantId: merchant._id
    }).populate("customerId");

    if (!conversation) return res.status(404).json({ error: "Conversation non trouvée" });

    // 1. Transcribe Voice using AI Provider
    let transcription = "";
    try {
      transcription = await aiProvider.transcribeAudio(
        req.file.buffer,
        req.file.mimetype || "audio/ogg",
        `Boutique: ${merchant.businessName}, Catégorie: ${merchant.category}`
      );
    } catch (transcribeErr: any) {
      console.warn("[Voice Transcription Warning]", transcribeErr.message);
      transcription = "🎤 [Note vocale envoyée]";
    }

    // 2. Upload Audio buffer to persistent storage
    const storageResult = await storageService.uploadBuffer(
      req.file.buffer,
      `voice_${Date.now()}.ogg`,
      req.file.mimetype || "audio/ogg",
      "audio"
    );

    // 3. Save to DB
    const message = await CommerceMessageModel.create({
      conversationId: conversation._id,
      sender: "human",
      type: "audio",
      content: transcription || "🎤 [Note vocale]",
      mediaUrl: storageResult.url,
      mediaMetadata: {
        fileName: "voice.ogg",
        fileSize: req.file.size,
        mimeType: req.file.mimetype || "audio/ogg"
      },
      status: "sent",
      timestamp: new Date()
    });

    conversation.lastMessageAt = new Date();
    conversation.status = "needs_human";
    conversation.unreadCount = 0;
    await conversation.save();

    // Emit live update to socket
    emitToUser(ownerId, "conversation:update", {
      conversationId: conversation._id,
      message,
      status: "needs_human",
      unreadCount: 0
    });

    // 4. Dispatch to WhatsApp / Platform
    const customer = conversation.customerId as any;
    const platform = conversation.platform || "whatsapp";
    const remoteId = platform === "web" ? (customer.platformId || "WEB_VISITOR") : customer.phone;

    try {
      const sendRes: any = await messagingService.sendMessage(merchant, platform, remoteId, transcription, {
        type: "audio",
        audioBuffer: req.file.buffer,
        fileBuffer: req.file.buffer,
        mediaUrl: storageResult.url,
        mimeType: req.file.mimetype || "audio/ogg"
      });
      const msgId = sendRes?.key?.id || sendRes?.messageId || sendRes?.id;
      if (msgId) {
        message.whatsappMessageId = msgId;
        await message.save();
      }
    } catch (sendError: any) {
      console.error(`[Voice Messaging Dispatch Error]`, sendError.message);
    }

    res.status(201).json({
      success: true,
      message,
      transcription
    });
  } catch (error: any) {
    console.error("[Voice Route Error]", error);
    res.status(500).json({ error: error.message });
  }
});

// Currency rate table relative to XOF (1 XOF = rate)
const CURRENCY_CONVERSION_RATES: Record<string, { rate: number; symbol: string; round: number }> = {
  XOF: { rate: 1, symbol: "FCFA", round: 500 },
  XAF: { rate: 1, symbol: "FCFA", round: 500 },
  GNF: { rate: 14, symbol: "GNF", round: 5000 },
  NGN: { rate: 2.5, symbol: "₦", round: 100 },
  GHS: { rate: 0.025, symbol: "GH₵", round: 5 },
  KES: { rate: 0.22, symbol: "KSh", round: 50 },
  MAD: { rate: 0.016, symbol: "DH", round: 10 },
  DZD: { rate: 0.22, symbol: "DZD", round: 50 },
  TND: { rate: 0.005, symbol: "TND", round: 1 },
  CDF: { rate: 4.6, symbol: "FC", round: 500 },
  MRU: { rate: 0.065, symbol: "MRU", round: 10 },
  EUR: { rate: 0.00152, symbol: "€", round: 1 },
  USD: { rate: 0.00165, symbol: "$", round: 1 },
  ZAR: { rate: 0.03, symbol: "R", round: 5 }
};

// GET ALL OFFERS (Converts prices dynamically based on merchant billing currency)
router.get("/offers", async (req, res) => {
  try {
    let currency = (req.query.currency as string) || "";

    // If no explicit query param, check authenticated merchant's billing currency
    if (!currency) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const token = authHeader.split(" ")[1];
          const decoded: any = jwt.verify(token, env.JWT_SECRET);
          if (decoded?.id) {
            const merchant = await CommerceMerchantModel.findOne({ ownerId: decoded.id });
            if (merchant) {
              currency = merchant.billingCurrency || merchant.currency || "XOF";
            }
          }
        } catch (e) {
          // Fallback to XOF
        }
      }
    }

    currency = (currency || "XOF").toUpperCase();

    let offers = await OfferModel.find({ isActive: true }).sort({ sortOrder: 1 });

    // Fallback to defaults if DB is empty (helps in local dev and first boot)
    if (!offers || offers.length === 0) {
      offers = DEFAULT_OFFERS as any;
    }

    const conv = CURRENCY_CONVERSION_RATES[currency.toUpperCase()] || CURRENCY_CONVERSION_RATES.XOF;

    const formattedOffers = offers.map(offer => {
      const obj = (offer as any).toObject ? (offer as any).toObject() : { ...offer };
      const yearlyPrice = obj.yearlyPrice || Math.round(obj.monthlyPrice * 10);
      obj.yearlyPrice = yearlyPrice;

      if (currency !== "XOF") {
        // Convert monthly price
        const rawPrice = obj.monthlyPrice * conv.rate;
        obj.monthlyPrice = Math.ceil(rawPrice / conv.round) * conv.round;

        // Convert yearly price
        const rawYearly = yearlyPrice * conv.rate;
        obj.yearlyPrice = Math.ceil(rawYearly / conv.round) * conv.round;

        obj.currency = currency;

        // Convert setup options
        if (obj.setupOptions) {
          obj.setupOptions = obj.setupOptions.map((opt: any) => ({
            ...opt,
            price: opt.price > 0 ? Math.ceil((opt.price * conv.rate) / conv.round) * conv.round : 0
          }));
        }
      }
      return obj;
    });

    res.json(formattedOffers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// INITIALIZE CHECKOUT
router.post("/checkout", authenticate, async (req, res) => {
  const userId = (req as any).user.id;
  const { offerSlug, email, setupOption, billingInterval } = req.body;

  try {
    const data = await commerceService.initializeCheckout(userId, offerSlug, email, setupOption, billingInterval || 'monthly');
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CONFIRM CHECKOUT AFTER PAYSTACK POPUP (frontend-triggered, idempotent)
// Called by the client immediately after PaystackPop.onSuccess fires.
// Activates the subscription without waiting for the Paystack webhook
// (which cannot reach localhost in dev mode).
router.post("/checkout/confirm", authenticate, async (req, res) => {
  const userId = (req as any).user.id;
  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ error: "Transaction reference is required" });
  }

  try {
    // Idempotency: if already processed, return success immediately
    const existing = await TransactionModel.findOne({ reference, status: "success" });
    if (existing) {
      console.log(`[Checkout Confirm] Already processed reference ${reference}. Returning success.`);
      return res.json({ success: true, alreadyProcessed: true });
    }

    // Verify with Paystack
    const data = await paystackService.verifyTransaction(reference);

    if (!data || data.status !== "success") {
      return res.status(400).json({ error: "Transaction non confirmée par Paystack", status: data?.status });
    }

    const { type, offerSlug, setupOption, billingInterval } = data.metadata || {};

    // 1. Find offer
    const offer = await OfferModel.findOne({ slug: offerSlug || "essential" });

    // 2. Upsert Subscription
    const isYearly = billingInterval === 'yearly';
    const existingSub = await SubscriptionModel.findOne({ userId });
    const existingMerchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    const now = new Date();
    const currentValidUntil = (existingSub?.currentPeriodEnd && new Date(existingSub.currentPeriodEnd) > now)
      ? new Date(existingSub.currentPeriodEnd)
      : (existingMerchant?.subscription?.expiresAt && new Date(existingMerchant.subscription.expiresAt) > now)
      ? new Date(existingMerchant.subscription.expiresAt)
      : now;

    const expiresAt = new Date(currentValidUntil);
    if (isYearly) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    await SubscriptionModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          offerId: offer?._id,
          status: "active",
          billingInterval: isYearly ? 'yearly' : 'monthly',
          price: data.amount / 100,
          currency: data.currency,
          currentPeriodStart: new Date(),
          currentPeriodEnd: expiresAt,
          paymentMethod: data.channel === "card" ? "card" : "mobile_money",
          providerSubscriptionId: data.subscription_code || null,
          nextBillingDate: data.next_payment_date ? new Date(data.next_payment_date) : null
        }
      },
      { upsert: true, new: true }
    );

    // 3. Upsert WhatsApp Connection
    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    const hasPhone = !!(merchant?.whatsappNumber || merchant?.phone);

    await WhatsAppConnectionModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          status: hasPhone ? "CONNECTED" : "NOT_CONNECTED",
          connectionType: "meta",
          connectedAt: hasPhone ? new Date() : null,
          disconnectedAt: null
        }
      },
      { upsert: true }
    );

    // 4. Record transaction
    const newTransaction = await TransactionModel.create({
      merchantId: merchant?._id,
      ownerId: userId,
      reference: data.reference,
      amount: data.amount / 100,
      currency: data.currency,
      type: type || "SUBSCRIPTION_INITIAL",
      status: "success",
      paymentMethod: data.channel,
      paidAt: new Date(data.paid_at),
      metadata: data.metadata
    });

    // 5. Merchant sync
    await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: userId },
      {
        $set: {
          "subscription.plan": offerSlug || "essential",
          "subscription.status": "active",
          "subscription.billingInterval": isYearly ? 'yearly' : 'monthly',
          "subscription.expiresAt": expiresAt
        }
      }
    );

    // 6. Referral reward (only on first successful transaction)
    const successCount = await TransactionModel.countDocuments({ ownerId: userId, status: "success" });
    if (successCount === 1 && merchant) {
      commerceService.processReferralReward(merchant._id.toString()).catch((err: any) =>
        console.error("[Referral] processReferralReward failed:", err)
      );
    }

    // 7. Send receipt & trigger Expert Setup notifications if applicable
    if (newTransaction && merchant) {
      if (type === 'pack_pro' || setupOption === 'EXPERT') {
        billingReceiptService.notifyExpertSetupOrdered(merchant._id.toString(), newTransaction as any).catch((err: any) =>
          console.error("[Receipt] notifyExpertSetupOrdered failed:", err)
        );
      } else {
        billingReceiptService.sendDigitalReceipt(merchant._id.toString(), newTransaction as any).catch((err: any) =>
          console.error("[Receipt] sendDigitalReceipt failed:", err)
        );
      }
    }

    console.log(`[Checkout Confirm] ✅ Subscription activated for user ${userId} (${reference})`);
    res.json({ success: true });
  } catch (error: any) {
    console.error(`[Checkout Confirm] Error for user ${userId}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/activate-premium", authenticate, async (req, res) => {
  const { email } = req.body;
  const userId = (req as any).user.id;
  try {
    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    const currency = merchant?.billingCurrency || merchant?.currency || "XOF";
    const settings = await SystemSettingsModel.findOne();

    let amount = 5000;
    const regional = settings?.pricing?.regional?.find(r => r.currency === currency);
    if (regional) {
      amount = regional.premiumMonthly;
    } else if (settings?.pricing?.premiumSubscriptionMonthly) {
      amount = settings.pricing.premiumSubscriptionMonthly;
    }

    const data = await paystackService.initializeSubscription(email, amount, {
      type: "subscription",
      plan: "premium",
      planCode: env.PAYSTACK_PLAN_PREMIUM,
      userId,
      currency
    });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/activate-business", authenticate, async (req, res) => {
  const { email } = req.body;
  const userId = (req as any).user.id;
  try {
    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    const currency = merchant?.billingCurrency || merchant?.currency || "XOF";
    const settings = await SystemSettingsModel.findOne();

    let amount = 25000;
    const regional = settings?.pricing?.regional?.find(r => r.currency === currency);
    if (regional) {
      amount = regional.businessMonthly;
    } else if (settings?.pricing?.packProFee) {
      amount = settings.pricing.packProFee;
    }

    const data = await paystackService.initializeSubscription(email, amount, {
      type: "subscription",
      plan: "business",
      planCode: env.PAYSTACK_PLAN_BUSINESS,
      userId,
      currency
    });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/buy-pack-pro", authenticate, async (req, res) => {
  const { email } = req.body;
  const userId = (req as any).user.id;
  try {
    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    const currency = merchant?.billingCurrency || merchant?.currency || "XOF";
    const settings = await SystemSettingsModel.findOne();

    let amount = 25000;
    const regional = settings?.pricing?.regional?.find(r => r.currency === currency);
    if (regional) {
      amount = regional.businessMonthly;
    } else if (settings?.pricing?.packProFee) {
      amount = settings.pricing.packProFee;
    } else if (currency !== "XOF") {
      const conv = CURRENCY_CONVERSION_RATES[currency.toUpperCase()] || CURRENCY_CONVERSION_RATES.XOF;
      const raw = 25000 * conv.rate;
      amount = Math.ceil(raw / conv.round) * conv.round;
    }

    // Pack Pro standalone setup – one-off payment
    const data = await paystackService.initializeSubscription(email || "billing@vendeur-ia.com", amount, {
      type: "pack_pro",
      setupOption: "EXPERT",
      userId,
      currency
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/subscription/cancel", authenticate, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    if (!merchant || !merchant.subscription?.subscriptionCode) {
      return res.status(400).json({ error: "Aucun abonnement récurrent actif trouvé." });
    }

    await paystackService.cancelSubscription(
      merchant.subscription.subscriptionCode,
      merchant.subscription.emailToken!
    );

    // Update DB: stop recurring, but keep status active until expiresAt
    merchant.subscription.subscriptionCode = undefined;
    merchant.subscription.emailToken = undefined;
    merchant.subscription.nextPaymentDate = undefined;
    await merchant.save();

    res.json({ success: true, message: "Abonnement annulé avec succès." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/verify-payment", authenticate, async (req, res) => {
  const { reference, type } = req.body;
  const userId = (req as any).user.id;

  try {
    const transaction = await paystackService.verifyTransaction(reference);

    if (transaction.status === "success") {
      const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
      if (!merchant) return res.status(404).json({ error: "Merchant not found" });

      // Save Transaction for Admin Visibility
      await TransactionModel.create({
        merchantId: merchant._id,
        ownerId: userId,
        reference: transaction.reference,
        amount: transaction.amount / 100,
        currency: transaction.currency,
        type: type || "subscription",
        status: "success",
        paymentMethod: transaction.channel,
        paidAt: new Date(transaction.paid_at)
      });

      if (type === "ram_contribution" || type === "subscription") {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month validity

        if (merchant.whatsappConfig) {
          merchant.whatsappConfig.lastBillingDate = new Date();
        } else {
          merchant.whatsappConfig = {
            status: 'disconnected',
            lastBillingDate: new Date()
          } as any;
        }

        // Standardize subscription field usage
        merchant.subscription = {
          plan: type === "ram_contribution" ? "premium" : "business",
          status: "active",
          expiresAt: expiresAt,
          paymentMethod: 'card',
          billingInterval: 'monthly'
        };

        await merchant.save();
      }

      res.json({ success: true, message: "Payment verified" });
    } else {
      res.status(400).json({ success: false, message: "Payment failed" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Paystack Webhook (Public) - Needs raw body
router.post("/webhooks/paystack", async (req, res) => {
  const signature = req.headers['x-paystack-signature'] as string;
  const rawBody = (req as any).rawBody ? (req as any).rawBody.toString('utf8') : (req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body));

  if (!paystackService.verifyWebhookSignature(rawBody, signature)) {
    console.error(`[Paystack Webhook] Invalid signature received.`);
    return res.status(401).send('Invalid signature');
  }

  const event = typeof req.body === 'object' && !(req.body instanceof Buffer) ? req.body : JSON.parse(rawBody);
  console.log(`[Paystack Webhook] Event received: "${event.event}" for reference: ${event?.data?.reference}`);

  // IDEMPOTENCY CHECK: Check if this event was already processed
  const existingTransaction = await TransactionModel.findOne({ reference: event.data?.reference, status: 'success' });
  if (existingTransaction) {
    console.log(`[Paystack Webhook] Event ${event.data?.reference} already processed. Skipping.`);
    return res.status(200).send('OK');
  }

  if (event.event === 'charge.success') {
    const data = event.data;
    console.log(`[Paystack Webhook] Charge SUCCESS for reference ${data.reference}, amount: ${data.amount / 100} ${data.currency}, channel: ${data.channel}`);
    const { type, userId, offerSlug, setupOption, billingInterval } = data.metadata || {};

    if (userId && (type === 'SUBSCRIPTION_INITIAL' || type === 'subscription' || type === 'pack_pro' || type === 'ram_contribution')) {
      console.log(`[Paystack Webhook] Charge Success for User: ${userId} (${type}, interval: ${billingInterval || 'monthly'})`);

      // 1. Find Offer or fallback to essential
      const offer = await OfferModel.findOne({ slug: offerSlug || (type === 'pack_pro' ? 'pro' : 'essential') });

      // 2. Update/Create Subscription
      const isYearly = billingInterval === 'yearly';
      const existingSub = await SubscriptionModel.findOne({ userId });
      const existingMerchant = await CommerceMerchantModel.findOne({ ownerId: userId });
      const now = new Date();
      const currentValidUntil = (existingSub?.currentPeriodEnd && new Date(existingSub.currentPeriodEnd) > now)
        ? new Date(existingSub.currentPeriodEnd)
        : (existingMerchant?.subscription?.expiresAt && new Date(existingMerchant.subscription.expiresAt) > now)
        ? new Date(existingMerchant.subscription.expiresAt)
        : now;

      const expiresAt = new Date(currentValidUntil);
      if (isYearly) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const subscription = await SubscriptionModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            offerId: offer?._id,
            status: 'active',
            billingInterval: isYearly ? 'yearly' : 'monthly',
            price: data.amount / 100,
            currency: data.currency,
            currentPeriodStart: new Date(),
            currentPeriodEnd: expiresAt,
            paymentMethod: data.channel === 'card' ? 'card' : 'mobile_money',
            providerSubscriptionId: data.subscription_code,
            nextBillingDate: data.next_payment_date ? new Date(data.next_payment_date) : null
          }
        },
        { upsert: true, new: true }
      );

      // 3. Update/Create WhatsApp Connection record
      const currentMerchant = await CommerceMerchantModel.findOne({ ownerId: userId });
      const hasPhone = !!(currentMerchant?.whatsappNumber || currentMerchant?.phone);

      await WhatsAppConnectionModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            status: hasPhone ? 'CONNECTED' : 'NOT_CONNECTED',
            connectionType: 'meta',
            connectedAt: hasPhone ? new Date() : null,
            disconnectedAt: null
          }
        },
        { upsert: true }
      );

      // 4. Record Transaction
      const newTransaction = await TransactionModel.create({
        merchantId: currentMerchant?._id,
        ownerId: userId,
        reference: data.reference,
        amount: data.amount / 100,
        currency: data.currency,
        type: type || 'SUBSCRIPTION_INITIAL',
        status: 'success',
        paymentMethod: data.channel,
        paidAt: new Date(data.paid_at),
        metadata: data.metadata
      });

      // 5. Merchant Sync
      await CommerceMerchantModel.findOneAndUpdate(
        { ownerId: userId },
        {
          $set: {
            "subscription.plan": offerSlug || (type === 'pack_pro' ? 'pro' : 'essential'),
            "subscription.status": "active",
            "subscription.billingInterval": isYearly ? 'yearly' : 'monthly',
            "subscription.expiresAt": expiresAt
          }
        }
      );

      // 6. Referral Reward
      const successfulTransactions = await TransactionModel.countDocuments({
        ownerId: userId,
        status: 'success'
      });
      if (successfulTransactions === 1) {
        const m = await CommerceMerchantModel.findOne({ ownerId: userId });
        if (m) await commerceService.processReferralReward(m._id.toString());
      }

      if (newTransaction) {
        const m = await CommerceMerchantModel.findOne({ ownerId: userId });
        if (m) {
          if (type === 'pack_pro' || setupOption === 'EXPERT') {
            await billingReceiptService.notifyExpertSetupOrdered(m._id.toString(), newTransaction as any);
          } else {
            await billingReceiptService.sendDigitalReceipt(m._id.toString(), newTransaction as any);
          }
        }
      }
    }
  }

  if (event.event === 'subscription.create') {
    // Already handled in charge.success for the first one, but useful for recurring
    const data = event.data;
    const { userId } = data.metadata || {};
    if (userId) {
      await SubscriptionModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            providerSubscriptionId: data.subscription_code,
            nextBillingDate: new Date(data.next_payment_date),
            status: "active"
          }
        }
      );
    }
  }

  if (event.event === 'invoice.payment_failed') {
    const data = event.data;
    const metadata = data.subscription?.metadata || data.metadata;
    const { userId } = metadata || {};
    if (userId) {
      await SubscriptionModel.findOneAndUpdate(
        { userId },
        { $set: { status: "past_due" } }
      );

      const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
      if (merchant) {
        const waMessage = `⚠️ *Échec de paiement - ${merchant.businessName}*\n\n` +
          `Le prélèvement automatique pour votre abonnement a échoué. Votre service risque d'être suspendu.\n\n` +
          `Veuillez vérifier votre moyen de paiement sur votre tableau de bord.`;
        try {
          await messagingService.sendMessage(merchant, 'whatsapp', merchant.whatsappNumber || "", waMessage);
        } catch (err) {
          console.error("[Paystack Webhook] Failed to send payment failed notice", err);
        }
      }
    }
  }

  res.status(200).send('OK');
});

router.get("/merchant", authenticate, async (req, res) => {
  const ownerId = (req as any).user.id;
  try {
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) {
      return res.json({ merchant: null, onboardingCompleted: false });
    }
    res.json(merchant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/merchant", authenticate, async (req, res) => {
  const ownerId = (req as any).user.id;
  try {
    const merchant = await commerceService.createMerchant(ownerId, req.body);
    res.status(201).json(merchant);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Merchant already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

router.patch("/merchant", authenticate, validate(UpdateMerchantSchema), async (req, res) => {
  const ownerId = (req as any).user.id;
  try {
    const merchant = await commerceService.updateMerchant(ownerId, req.body);
    res.json(merchant);
  } catch (error: any) {
    logger.error(`[Merchant Update Error] ${error.message}`, { userId: ownerId });
    res.status(500).json({ error: error.message });
  }
});

router.get("/knowledge", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) {
      return res.json({
        businessRules: {
          deliveryZones: [],
          deliveryFees: [],
          openingHours: "09:00 - 18:00",
          returnPolicy: "Retours acceptés sous 48h.",
          paymentMethods: []
        },
        faq: [],
        customInstructions: ""
      });
    }

    const knowledge = await commerceService.getKnowledge(merchant._id.toString());
    res.json(knowledge);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/knowledge", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const knowledge = await commerceService.updateKnowledge(merchant._id.toString(), req.body);
    res.json(knowledge);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/products", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.json([]);

    const isFounder = (merchant.whatsappNumber && isFounderNumber(merchant.whatsappNumber)) ||
                      (merchant.phone && isFounderNumber(merchant.phone)) ||
                      merchant.businessName === "Vendeur IA";

    if (isFounder) {
      await commerceService.ensureFounderMerchantConfigured(ownerId);
    }

    const products = await CommerceProductModel.find({ merchantId: merchant._id });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/products", authenticate, validate(CreateProductSchema), async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    logger.info(`[Product] Creating new product for merchant ${merchant.businessName}`);

    const productData = { ...req.body };
    if (productData.imageUrl && (!productData.images || productData.images.length === 0)) {
      productData.images = [productData.imageUrl];
    }
    delete productData.imageUrl;

    const product = await CommerceProductModel.create({
      ...productData,
      currency: productData.currency || merchant.currency || "XOF",
      merchantId: merchant._id
    });
    res.status(201).json(product);
  } catch (error: any) {
    logger.error(`[Product Creation Error] ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

router.post("/products/vision", authenticate, aiLimiter, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    const userId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    const currency = merchant?.currency || "XOF";
    const country = merchant?.country || "CI";

    logger.info(`[Vision] Image analysis requested by user ${userId} (Currency: ${currency}, Country: ${country})`);

    const analysis = await commerceService.analyzeProductImage(
      req.file.buffer,
      req.file.mimetype,
      currency,
      country
    );

    res.json(analysis);
  } catch (error: any) {
    logger.error(`[Vision Error] ${error.message}`, {
      userId: (req as any).user.id,
      stack: error.stack,
      details: error.response?.data
    });
    res.status(500).json({ error: error.message });
  }
});

router.patch("/products/:id", authenticate, validate(UpdateProductSchema), async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const product = await CommerceProductModel.findOneAndUpdate(
      { _id: req.params.id, merchantId: merchant._id },
      { $set: req.body },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/products/:id/toggle-featured", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Marchand non trouvé" });

    const product = await CommerceProductModel.findOne({
      _id: req.params.id,
      merchantId: merchant._id
    });
    if (!product) return res.status(404).json({ error: "Produit non trouvé" });

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/products/:id", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    await CommerceProductModel.findOneAndDelete({
      _id: req.params.id,
      merchantId: merchant._id
    });
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/products/:id/caption", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const product = await CommerceProductModel.findOne({
      _id: req.params.id,
      merchantId: merchant._id
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const result = await commerceService.generateProductCaption(product._id.toString());
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/ai-settings", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(req.body || {})) {
      updates[`aiSettings.${key}`] = value;
    }
    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId },
      { $set: updates },
      { new: true }
    );
    res.json(merchant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/customers", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.json([]);

    const customers = await CommerceCustomerModel.find({ merchantId: merchant._id })
      .sort({ updatedAt: -1 })
      .limit(100);

    const sanitized = customers.map(c => {
      const obj = c.toObject();
      if (obj.phone) {
        obj.phone = obj.phone.replace(/@s\.whatsapp\.net|@c\.us/g, "").replace(/^\+/, "").trim();
      }
      return obj;
    });

    res.json(sanitized);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/customers/lookup-or-create", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const { phone, location, name } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Le numéro de téléphone est obligatoire." });
    }

    const cleanPhone = phone.trim();
    let customer = await CommerceCustomerModel.findOne({
      merchantId: merchant._id,
      phone: cleanPhone
    });

    if (!customer) {
      customer = await CommerceCustomerModel.create({
        merchantId: merchant._id,
        phone: cleanPhone,
        name: name?.trim() || "Nouveau Client",
        location: location?.trim() || "",
        platform: "whatsapp"
      });
    } else {
      let modified = false;
      if (location?.trim() && (!customer.location || customer.location !== location.trim())) {
        customer.location = location.trim();
        modified = true;
      }
      if (name?.trim() && (!customer.name || customer.name === "Nouveau Client")) {
        customer.name = name.trim();
        modified = true;
      }
      if (modified) {
        await customer.save();
      }
    }

    res.json(customer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/orders", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.json([]);

    const orders = await CommerceOrderModel.find({ merchantId: merchant._id })
      .populate("customerId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/orders", authenticate, validate(CreateOrderSchema), async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const order = await CommerceOrderModel.create({
      ...req.body,
      merchantId: merchant._id
    });

    // Update customer location if delivery address is provided
    if (req.body.customerId && req.body.deliveryAddress) {
      await CommerceCustomerModel.findByIdAndUpdate(
        req.body.customerId,
        { $set: { location: req.body.deliveryAddress } },
        { new: true }
      );
    }

    // Record campaign conversion & ROI attribution if customer bought following a broadcast
    if (req.body.customerId) {
      await marketingService.recordCampaignConversion(
        merchant._id.toString(),
        req.body.customerId,
        order._id.toString(),
        order.totalAmount || 0
      );
    }

    // If created from Inbox, we might want to send a confirmation message automatically
    if (req.body.conversationId) {
      const customer = await CommerceCustomerModel.findById(req.body.customerId);
      if (customer) {
        const itemsList = req.body.items.map((i: any) => `- ${i.name} (x${i.quantity})`).join("\n");
        const messageContent = `✅ Commande validée !\n\nRécapitulatif :\n${itemsList}\n\nTotal : ${req.body.totalAmount.toLocaleString()} XOF\n\nMerci pour votre confiance ! ✨`;

        await messagingService.sendMessage(merchant, customer.platform || "whatsapp", customer.phone, messageContent);

        // Save confirmation message to history
        await CommerceMessageModel.create({
          conversationId: req.body.conversationId,
          sender: "ai",
          content: messageContent
        });
      }
    }

    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/orders/:id", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const orderId = req.params.id;
    const updateData = req.body;

    // Special handling for payment confirmation
    if (updateData.status === "paid") {
      await commerceService.confirmOrderPayment(orderId);
      const receipt = await commerceService.generateDigitalReceipt(orderId);

      // Send receipt via WhatsApp (Meta or Baileys)
      const updatedOrder = await CommerceOrderModel.findById(orderId).populate("customerId");
      if (updatedOrder) {
        const customer = updatedOrder.customerId as any;
        const merchantObj = await CommerceMerchantModel.findById(merchant._id);

        if (merchantObj && customer?.phone) {
          try {
            await messagingService.sendMessage(merchantObj, 'whatsapp', customer.phone, receipt);
          } catch (err: any) {
            console.error("[Order Receipt] Failed to send receipt WhatsApp:", err?.message || err);
          }
        }
      }

      return res.json(updatedOrder);
    }

    const existingOrder = await CommerceOrderModel.findOne({ _id: orderId, merchantId: merchant._id });
    if (!existingOrder) return res.status(404).json({ error: "Order not found" });

    if (updateData.deliveryGuyPhone) {
      let rawPhone = updateData.deliveryGuyPhone.replace(/[^0-9]/g, "");
      if (rawPhone.startsWith("0") && rawPhone.length === 10) {
        rawPhone = "225" + rawPhone;
      }
      updateData.deliveryGuyPhone = rawPhone;
      updateData.dispatchedAt = new Date();
      if (!updateData.status && (existingOrder.status === "pending" || existingOrder.status === "confirmed")) {
        updateData.status = "dispatched";
      }
    }

    const order = await CommerceOrderModel.findOneAndUpdate(
      { _id: orderId, merchantId: merchant._id },
      { $set: updateData },
      { new: true }
    );

    // Schedule automated J+3 post-purchase loyalty followup if order is delivered / completed
    if (order && (updateData.status === "delivered" || updateData.status === "completed")) {
      const customerId = order.customerId?.toString();
      if (customerId) {
        await aiQueue.add(
          'post-purchase-followup',
          {
            merchantId: merchant._id.toString(),
            customerId,
            orderId: order._id.toString(),
            items: order.items
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000 // 72h delay
          }
        );
        logger.info(`[Commerce] Scheduled automated post-purchase followup (J+3) for order ${order._id}`);
      }
    }

    // Handle delivery guy assignment & WhatsApp notification if provided
    if (order && updateData.deliveryGuyPhone && updateData.notifyDeliveryGuy) {
      const customer = await CommerceCustomerModel.findById(order.customerId);
      const cleanCustomerPhone = customer?.phone?.replace(/@s\.whatsapp\.net|@c\.us/g, "") || "Client";
      const itemsList = order.items.map((i: any) => `• ${i.quantity}x ${i.name}`).join("\n");
      const deliveryMsg = `🛵 *NOUVELLE COURSE - ${merchant.businessName}*\n\n` +
        `📦 *Commande:* #${order._id.toString().slice(-6).toUpperCase()}\n` +
        `👤 *Client à livrer:* ${cleanCustomerPhone}\n` +
        `📍 *Adresse / Quartier:* ${order.shippingAddress || customer?.location || "À convenir avec le client"}\n\n` +
        `📦 *Articles :*\n${itemsList}\n\n` +
        `💰 *Montant à encaisser :* ${order.status === "paid" ? "0 (Déjà payé ✅)" : `${order.totalAmount.toLocaleString()} ${order.currency || "XOF"} (À encaisser)`}\n` +
        (updateData.deliveryNotes ? `📝 *Note :* ${updateData.deliveryNotes}\n` : "") +
        `\nMerci d'assurer la livraison dès que possible ! 🚀`;

      try {
        await messagingService.sendMessage(merchant, 'whatsapp', updateData.deliveryGuyPhone, deliveryMsg);
        logger.info(`[Delivery Dispatch] Dispatched order ${order._id} to courier ${updateData.deliveryGuyPhone}`);
      } catch (err: any) {
        logger.warn(`[Delivery Dispatch] Could not send WhatsApp to delivery guy: ${err.message}`);
      }
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

import { aiAgentService } from "../../services/ai-agent.service.js";
import { pushService } from "../../services/push.service.js";

// ... existing imports ...

// Demo AI Processing Route (Unified with Main Agent)
router.post("/demo/process", async (req, res) => {
  try {
    const { businessName, city, category, description, message, history, phone } = req.body;

    const [merchantInstructions, merchantPayments] = (description || "").split("---");

    // Parse simulated payment channels if provided in description
    const paymentChannels = merchantPayments?.split(',').map((p: string) => {
      const [label, number] = p.trim().split(':');
      return { label: label?.trim(), number: number?.trim() };
    }).filter((p: any) => p.label && p.number) || [];

    // Get mock products for the selected category
    const mockProducts = CATEGORY_MOCKS[category] || CATEGORY_MOCKS["other"];

    // Refined instructions to PRIORITIZE user location
    const customInstructions = `Ceci est une démonstration pour un commerce de type "${category}".

    LIEU DE VENTE / LIVRAISON : Ton commerce est situé à ${city || "sa ville"}, précisément à "${req.body.address || city || "son adresse"}".
    IMPORTANT : Tu dois ABSOLUMENT te situer dans la ville spécifiée par l'utilisateur (${city || "sa ville"}). Ne mentionne JAMAIS une autre ville (comme Abidjan) par défaut.

    IMPORTANT : L'utilisateur a décrit précisément ce qu'il vend : "${description || "Pas de description spécifiée"}".
    SI l'utilisateur a mentionné des produits spécifiques (ex: "Tchep", "Thieboudienne", "Attiéké", "Robes rouges"), tu dois ABSOLUMENT parler de CES produits en priorité.
    Les produits du catalogue mocké (ex: Burgers, Sneakers) ne sont que des EXEMPLES génériques. Ne les utilise PAS si l'utilisateur a spécifié ses propres articles.

    TON BUT : Faire croire à l'utilisateur que tu as lu et compris SA description.
    Si il dit qu'il vend du "Tchep", parle avec passion de son Tchep, demande s'il veut du piment ou du poisson.
    Invente des prix réalistes (en XOF) et des stocks pour les produits mentionnés par l'utilisateur.

    Personnalisation maximale : ignore les mocks si ils contredisent la description de l'utilisateur.`;

    const isInitialGreeting = message === "SYSTEM_INITIAL_GREETING";
    const processedHistory = Array.isArray(history)
      ? history
          .filter((h: any) => h && typeof h.text === "string" && h.text.trim())
          .map((h: any) => ({
            role: (h.role === "customer" ? "customer" : "ai") as "customer" | "ai",
            text: h.text.trim()
          }))
      : [];

    const userMessage = isInitialGreeting
      ? `Bonjour ! Accueille-moi chaleureusement chez ${businessName || "notre boutique"}, mentionne nos spécialités en ${category || "commerce"} (${description || "nos créations phares"}) et propose de me conseiller.`
      : (message || "Bonjour !");

    const reply = await aiAgentService.generateResponse({
      merchant: {
        businessName,
        category,
        city,
        country: req.body.country || "CI",
        currency: req.body.currency || "XOF",
        description: description,
        paymentChannels
      },
      products: mockProducts,
      knowledge: {
        businessRules: {
          deliveryZones: [city, req.body.address].filter(Boolean),
          paymentMethods: paymentChannels.length > 0 ? paymentChannels : [
            { provider: "Orange Money", number: "07 00 00 00 00" },
            { provider: "Wave", number: "05 00 00 00 00" }
          ]
        },
        customInstructions: customInstructions
      },
      history: isInitialGreeting ? [] : processedHistory,
      message: userMessage,
      customerPhone: phone
    });

    res.json({ reply: reply.text });
  } catch (error) {
    console.error("Demo AI Error:", error);
    res.status(500).json({ error: "ai_demo_error" });
  }
});

router.post("/demo/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio provided" });

    const transcription = await aiProvider.transcribeAudio(
      req.file.buffer,
      req.file.mimetype,
      "Démonstration Landing Page"
    );

    res.json({ transcription });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/push/vapid-public-key", async (req, res) => {
  try {
    const publicKey = await pushService.getPublicKey();
    res.json({ publicKey });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/push/subscribe", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await pushService.subscribe(userId, req.body);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/commerce/payment-proofs - List payment proofs audit log
router.get("/payment-proofs", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const { decision, limit = 50 } = req.query;
    const query: any = { merchantId: merchant._id };
    if (decision) query.decision = decision;

    const proofs = await PaymentProofLogModel.find(query)
      .populate("customerId", "phone name")
      .populate("orderId", "totalAmount currency status items")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ proofs });
  } catch (error: any) {
    logger.error(`[Payment Proofs] Error fetching proofs: ${error.message}`);
    res.status(500).json({ error: "failed_to_fetch_proofs" });
  }
});

// POST /api/commerce/payment-proofs/:logId/review - Review flagged proof
router.post("/payment-proofs/:logId/review", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const { logId } = req.params;
    const { action } = req.body; // "approve" | "reject"

    const proof = await PaymentProofLogModel.findOne({ _id: logId, merchantId: merchant._id });
    if (!proof) return res.status(404).json({ error: "Proof log not found" });

    proof.reviewedByMerchant = true;
    proof.merchantDecision = action === "approve" ? "approved" : "rejected";

    if (action === "approve" && proof.orderId) {
      const order = await CommerceOrderModel.findById(proof.orderId);
      if (order && order.status !== "paid") {
        await commerceService.confirmOrderPayment(order._id.toString());
        order.paymentMethod = proof.platform;
        order.status = "paid";
        await order.save();
      }
    }

    await proof.save();
    res.json({ success: true, proof });
  } catch (error: any) {
    logger.error(`[Payment Proofs Review] Error: ${error.message}`);
    res.status(500).json({ error: "review_failed" });
  }
});

// POST /api/commerce/payment-proofs/scan - Direct forensic scan test
router.post("/payment-proofs/scan", authenticate, upload.single("image"), async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    if (!req.file) {
      return res.status(400).json({ error: "image_required" });
    }

    const { orderId } = req.body;
    const expectedOrder = orderId ? await CommerceOrderModel.findById(orderId) : undefined;
    const customer = expectedOrder
      ? await CommerceCustomerModel.findById(expectedOrder.customerId)
      : { _id: merchant._id, phone: "SCAN_TEST" };

    const result = await paymentShieldService.evaluatePaymentProof({
      merchant,
      customer: customer as any,
      expectedOrder,
      imageBuffer: req.file.buffer,
      mimeType: req.file.mimetype || "image/jpeg"
    });

    res.json(result);
  } catch (error: any) {
    logger.error(`[Payment Proof Scan] Error: ${error.message}`);
    res.status(500).json({ error: error.message || "scan_failed" });
  }
});

// --- WHATSAPP STATUS ASSISTANT ROUTES ---

// GET /api/commerce/whatsapp-status/pack - Generate 3 daily status propositions
router.get("/whatsapp-status/pack", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const pack = await whatsappStatusService.generateStatusPack(merchant._id.toString());
    res.json({ pack });
  } catch (error: any) {
    logger.error(`[WhatsApp Status Pack] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/commerce/whatsapp-status/send-to-me - Send status pack to merchant's WhatsApp
router.post("/whatsapp-status/send-to-me", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const result = await whatsappStatusService.sendDailyStatusPackToMerchant(merchant._id.toString());
    res.json({
      success: true,
      message: "Pack statuts envoyé avec succès sur votre WhatsApp !",
      targetPhone: result.targetPhone,
      pack: result.statuses
    });
  } catch (error: any) {
    logger.error(`[WhatsApp Status Send] Error: ${error.message}`);
    res.status(400).json({ error: error.message || "Erreur lors de l'envoi des statuts" });
  }
});

// POST /api/commerce/whatsapp-status/auto-publish - Direct broadcast publication (Baileys only)
router.post("/whatsapp-status/auto-publish", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const { statusIndex = 0 } = req.body;
    const result = await whatsappStatusService.publishAutoStatus(merchant._id.toString(), statusIndex);
    res.json(result);
  } catch (error: any) {
    logger.error(`[WhatsApp Status Auto Publish] Error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// --- PAYMENT INTENTS & MANUAL MONEY RAILS ---
// ==========================================

// GET /api/commerce/payments/config - Get available payment methods and recipient numbers
router.get("/payments/config", async (req, res) => {
  try {
    const country = req.query.country as string;
    const config = await paymentService.getPaymentConfig(country);
    res.json(config);
  } catch (error: any) {
    logger.error(`[Payment Config] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/commerce/payments/intent - Create a new payment intent
router.post("/payments/intent", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { offerSlug, billingInterval, paymentMethod, senderPhoneNumber, senderName, country } = req.body;

    const intent = await paymentService.createPaymentIntent(userId, {
      offerSlug: offerSlug || "essential",
      billingInterval: billingInterval || "monthly",
      paymentMethod: paymentMethod || "wave",
      senderPhoneNumber,
      senderName,
      country
    });

    res.status(201).json(intent);
  } catch (error: any) {
    logger.error(`[Payment Intent Create] Error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/commerce/payments/intent/:id - Fetch intent by ID
router.get("/payments/intent/:id", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const intent = await PaymentIntentModel.findOne({ _id: req.params.id, userId });
    if (!intent) {
      return res.status(404).json({ error: "Intention de paiement introuvable." });
    }
    res.json(intent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/commerce/payments/intent/:id/scan-proof - Scan and run Vision Forensic Audit on receipt
const receiptUpload = multer({ dest: "uploads/temp/", limits: { fileSize: 15 * 1024 * 1024 } });
router.post("/payments/intent/:id/scan-proof", authenticate, receiptUpload.single("receipt"), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    if (!req.file) {
      return res.status(400).json({ error: "Veuillez sélectionner ou prendre en photo une capture de reçu." });
    }

    const result = await paymentService.scanReceiptProof(req.params.id, userId, req.file);
    res.json(result);
  } catch (error: any) {
    logger.error(`[Payment Scan Proof] Error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/commerce/payments/intent/:id/submit-proof - Submit transaction proof
router.post("/payments/intent/:id/submit-proof", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { transactionId, proofImageUrl, senderPhoneNumber, senderName, notes } = req.body;

    const result = await paymentService.submitPaymentProof(req.params.id, userId, {
      transactionId,
      proofImageUrl,
      senderPhoneNumber,
      senderName,
      notes
    });

    res.json(result);
  } catch (error: any) {
    logger.error(`[Payment Submit Proof] Error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/commerce/payments/history - Get payment intents history for merchant
router.get("/payments/history", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const intents = await PaymentIntentModel.find({ userId }).sort({ createdAt: -1 }).limit(30);
    res.json(intents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/commerce/upload - Upload route alias (supports logo, cover, products)
const commerceMediaUpload = multer({ dest: "uploads/temp/" });
router.post("/upload", authenticate, commerceMediaUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier fourni" });
    }
    const folder = req.body.folder || "branding";
    const result = await storageService.uploadFile(req.file, folder);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/commerce/newsletter/subscribe - Public newsletter subscription with validation & idempotency
router.post("/newsletter/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Adresse email obligatoire." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: "Format d'adresse email invalide." });
    }

    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    const existing = await NewsletterSubscriberModel.findOne({ email: cleanEmail });
    if (existing) {
      if (!existing.active) {
        existing.active = true;
        await existing.save();
      }
      return res.json({
        success: true,
        isNew: false,
        message: "Vous êtes déjà inscrit ! Nous vous tiendrons informé de nos prochaines actualités."
      });
    }

    await NewsletterSubscriberModel.create({
      email: cleanEmail,
      ipAddress: typeof ipAddress === "string" ? ipAddress.split(",")[0].trim() : "",
      userAgent,
      source: "landing_footer",
      active: true
    });

    console.log(`[Newsletter] Nouvel abonné inscrit : ${cleanEmail}`);

    res.json({
      success: true,
      isNew: true,
      message: "Merci pour votre inscription ! Vous recevrez nos meilleures analyses et stratégies de vente WhatsApp."
    });
  } catch (error: any) {
    console.error("[Newsletter Error]:", error);
    res.status(500).json({ error: "Une erreur est survenue lors de l'inscription à la newsletter." });
  }
});

export default router;
