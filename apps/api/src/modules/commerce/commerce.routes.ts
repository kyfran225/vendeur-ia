import express, { Router } from "express";
import { commerceService } from "./commerce.service.js";
import { whatsappService } from "../whatsapp/whatsapp.service.js";
import { messagingService } from "../../services/messaging.service.js";
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
import { CATEGORY_MOCKS } from "./demo.data.js";
import { billingReceiptService } from "../../services/billing-receipt.service.js";
import { marketingService } from "../../services/marketing.service.js";
import { aiQueue } from "../../services/ai-queue.service.js";
import axios from "axios";
import multer from "multer";

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
        const { type, offerSlug } = data.metadata || {};
        const offer = await OfferModel.findOne({ slug: offerSlug || (type === 'pack_pro' ? 'pro' : 'essential') });

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await SubscriptionModel.findOneAndUpdate(
          { userId },
          {
            $set: {
              offerId: offer?._id,
              status: 'active',
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

        await WhatsAppConnectionModel.findOneAndUpdate(
          { userId },
          {
            $setOnInsert: {
              userId,
              status: 'NOT_CONNECTED',
              connectionType: offerSlug === 'pro' || type === 'pack_pro' ? 'meta' : 'baileys'
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

        const currentMerchantForStatus = await CommerceMerchantModel.findOne({ ownerId: userId });
        await CommerceMerchantModel.findOneAndUpdate(
          { ownerId: userId },
          {
            $set: {
              "subscription.plan": offerSlug || (type === 'pack_pro' ? 'pro' : 'essential'),
              "subscription.status": "active",
              "subscription.expiresAt": expiresAt,
              "whatsappConfig.provider": offerSlug === 'pro' || type === 'pack_pro' ? 'meta' : 'baileys',
              "whatsappConfig.status": currentMerchantForStatus?.whatsappConfig?.status || "disconnected"
            }
          }
        );

        console.log(`[Verify Route] Activation effectuée avec succès pour le paiement ${reference}`);
        const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
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

// PUBLIC SHOP ENDPOINT
router.get("/public/shop/:merchantId", async (req, res) => {
  try {
    const merchant = await CommerceMerchantModel.findById(req.params.merchantId);
    if (!merchant) return res.status(404).json({ error: "Boutique non trouvée" });

    const products = await CommerceProductModel.find({
      merchantId: merchant._id,
      availability: { $ne: "hidden" }
    }).sort({ createdAt: -1 });

    res.json({ merchant, products });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/conversations", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.json([]);

    const conversations = await CommerceConversationModel.find({ merchantId: merchant._id })
      .populate("customerId")
      .sort({ lastMessageAt: -1 });
    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/conversations/:id/messages", authenticate, async (req, res) => {
  try {
    const messages = await CommerceMessageModel.find({ conversationId: req.params.id })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/conversations/:id/status", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const { status } = req.body;
    if (!["active", "needs_human", "converted", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const conversation = await CommerceConversationModel.findOneAndUpdate(
      { _id: req.params.id, merchantId: merchant._id },
      { $set: { status } },
      { new: true }
    );
    res.json(conversation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/conversations/:id/generate-followup", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const result = await commerceService.generateFollowUp(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/conversations/:id/messages", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const { content } = req.body;
    const conversation = await CommerceConversationModel.findOne({
      _id: req.params.id,
      merchantId: merchant._id
    }).populate("customerId");

    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    // 1. Save message to DB
    const message = await CommerceMessageModel.create({
      conversationId: conversation._id,
      sender: "human",
      content
    });

    // 2. Send via Platform Messaging
    const customer = conversation.customerId as any;
    const platform = conversation.platform || "whatsapp";
    const remoteId = platform === "web" ? (customer.platformId || "WEB_VISITOR") : customer.phone;

    try {
      await messagingService.sendMessage(merchant, platform, remoteId, content);
    } catch (sendError: any) {
      console.error(`[Messaging] Failed to send to ${platform}:`, sendError.message);
      // Continue even if external send fails, as we saved it to DB
    }

    // 3. Force "needs_human" status to stop AI from intervening

    res.status(201).json(message);
  } catch (error: any) {
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
    let currency = (req.query.currency as string) || "XOF";

    // If user is authenticated, use their actual merchant billing currency
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
        // Fallback to query param or XOF if token is invalid
      }
    }

    const offers = await OfferModel.find({ isActive: true }).sort({ sortOrder: 1 });
    const conv = CURRENCY_CONVERSION_RATES[currency.toUpperCase()] || CURRENCY_CONVERSION_RATES.XOF;

    const formattedOffers = offers.map(offer => {
      const obj = offer.toObject();
      if (currency !== "XOF") {
        // Convert monthly price
        const rawPrice = obj.monthlyPrice * conv.rate;
        obj.monthlyPrice = Math.ceil(rawPrice / conv.round) * conv.round;
        obj.currency = currency;

        // Convert setup options
        if (obj.setupOptions) {
          obj.setupOptions = obj.setupOptions.map(opt => ({
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
  const { offerSlug, email, setupOption } = req.body;

  try {
    const data = await commerceService.initializeCheckout(userId, offerSlug, email, setupOption);
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

    const { type, offerSlug, setupOption } = data.metadata || {};

    // 1. Find offer
    const offer = await OfferModel.findOne({ slug: offerSlug || "essential" });

    // 2. Upsert Subscription
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await SubscriptionModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          offerId: offer?._id,
          status: "active",
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

    // 3. Upsert WhatsApp Connection (initial state, do not overwrite if already exists)
    await WhatsAppConnectionModel.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          status: "NOT_CONNECTED",
          connectionType: offerSlug === "pro" || type === "pack_pro" ? "meta" : "baileys"
        }
      },
      { upsert: true }
    );

    // 4. Record transaction
    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
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

    // 5. Legacy Merchant sync
    const currentMerchantManual = await CommerceMerchantModel.findOne({ ownerId: userId });
    await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: userId },
      {
        $set: {
          "subscription.plan": offerSlug || "essential",
          "subscription.status": "active",
          "subscription.expiresAt": expiresAt,
          "whatsappConfig.status": currentMerchantManual?.whatsappConfig?.status || "disconnected"
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

    // 7. Send receipt
    if (newTransaction && merchant) {
      billingReceiptService.sendDigitalReceipt(merchant._id.toString(), newTransaction as any).catch((err: any) =>
        console.error("[Receipt] sendDigitalReceipt failed:", err)
      );
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
      amount = regional.businessMonthly; // Or a specific packProFee from regional
    } else if (settings?.pricing?.packProFee) {
      amount = settings.pricing.packProFee;
    }

    // Pack Pro – amount is in the merchant's regional billing currency
    const data = await paystackService.initializeSubscription(email, amount, {
      type: "pack_pro",
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
          paymentMethod: 'card'
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
router.post("/webhooks/paystack", express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-paystack-signature'] as string;
  const body = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);

  if (!paystackService.verifyWebhookSignature(body, signature)) {
    console.error(`[Paystack Webhook] Invalid signature received.`);
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(body);
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
    const { type, userId, offerSlug, setupOption } = data.metadata || {};

    if (userId && (type === 'SUBSCRIPTION_INITIAL' || type === 'subscription' || type === 'pack_pro' || type === 'ram_contribution')) {
      console.log(`[Paystack Webhook] Charge Success for User: ${userId} (${type})`);

      // 1. Find Offer or fallback to essential
      const offer = await OfferModel.findOne({ slug: offerSlug || (type === 'pack_pro' ? 'pro' : 'essential') });

      // 2. Update/Create Subscription
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const subscription = await SubscriptionModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            offerId: offer?._id,
            status: 'active',
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

      // 3. Update/Create WhatsApp Connection record (Initial state)
      await WhatsAppConnectionModel.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            userId,
            status: 'NOT_CONNECTED',
            connectionType: offerSlug === 'pro' || type === 'pack_pro' ? 'meta' : 'baileys'
          }
        },
        { upsert: true }
      );

      // 4. Record Transaction
      const newTransaction = await TransactionModel.create({
        merchantId: (await CommerceMerchantModel.findOne({ ownerId: userId }))?._id,
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

      // 5. Legacy Sync (Keep Merchant model in sync for now to avoid breaking other parts)
      const currentMerchant = await CommerceMerchantModel.findOne({ ownerId: userId });
      await CommerceMerchantModel.findOneAndUpdate(
        { ownerId: userId },
        {
          $set: {
            "subscription.plan": offerSlug || (type === 'pack_pro' ? 'pro' : 'essential'),
            "subscription.status": "active",
            "subscription.expiresAt": expiresAt,
            "whatsappConfig.status": currentMerchant?.whatsappConfig?.status || "disconnected"
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
        if (m) await billingReceiptService.sendDigitalReceipt(m._id.toString(), newTransaction as any);
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
    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId },
      { $set: { aiSettings: req.body } },
      { new: true }
    );
    res.json(merchant);
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
      const order = await CommerceOrderModel.findById(orderId).populate("customerId");
      if (order) {
        const customer = order.customerId as any;
        const merchantObj = await CommerceMerchantModel.findById(merchant._id);

        if (merchantObj?.whatsappConfig?.provider === 'meta') {
          await whatsappService.sendMetaMessage(merchantObj, customer.phone, receipt);
        } else {
          const sock = (whatsappService as any).activeSessions?.get(ownerId);
          if (sock) {
            await sock.sendMessage(customer.phone, { text: receipt });
          }
        }
      }

      return res.json({ success: true, message: "Paiement confirmé et reçu envoyé." });
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

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

import { aiAgentService } from "../../services/ai-agent.service.js";
import { aiProvider } from "../../services/ai-provider.js";
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
      history: history.map((h: any) => ({
        role: h.role === "customer" ? "customer" : "ai",
        text: h.text
      })),
      message: message === "SYSTEM_INITIAL_GREETING" ? "Bonjour !" : message,
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

router.post("/push/subscribe", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await pushService.subscribe(userId, req.body);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Briefing Room Route (Merchant training their AI)
router.post("/briefing", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const { message, history } = req.body;

    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const products = await CommerceProductModel.find({ merchantId: merchant._id });
    const knowledge = await CommerceKnowledgeModel.findOne({ merchantId: merchant._id });

    // --- RECENT DATA FOR REPORTING ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ordersToday = await CommerceOrderModel.find({
      merchantId: merchant._id,
      createdAt: { $gte: today }
    });
    const revenueToday = ordersToday
      .filter(o => o.status === 'paid')
      .reduce((acc, o) => acc + o.totalAmount, 0);

    const lowStockProducts = products.filter(p => p.stock <= 5);

    // Specialized Briefing & Reporting Prompt
    const systemPrompt = `Tu es l'Employé Numérique Vendeur et Consultant Business de "${merchant.businessName}".
    TU PARLES DIRECTEMENT À TON PATRON (le marchand).

    TON RÔLE :
    1. Écouter ses instructions (ex: "Change le prix de X").
    2. RÉPONDRE À SES QUESTIONS SUR LES CHIFFRES, LES STOCKS ET LA STRATÉGIE.
    3. Confirmer que tu as compris comment il veut que tu vendes.

    CHIFFRES DU JOUR :
    - Commandes aujourd'hui : ${ordersToday.length}
    - Revenu encaissé : ${revenueToday} XOF

    STOCKS & CATALOGUE :
    - Nombre total de produits : ${products.length}
    - Alerte stock bas : ${lowStockProducts.map(p => `${p.name} (${p.stock} restants)`).join(', ') || "Aucune alerte"}
    - Liste complète : ${products.map(p => `${p.name}: ${p.price} XOF (Stock: ${p.stock})`).join(' | ')}

    INSTRUCTIONS DU PATRON :
    - Sois un bras droit intelligent et respectueux. Dis "Oui Chef", "C'est noté Patron".
    - Si le patron te demande "On en est où ?", donne-lui les stats du jour et les alertes stock.

    RÉPONSE : Courte, impactante et basée sur les DONNÉES réelles ci-dessus.`;

    const reply = await aiAgentService.generateResponse({
      merchant: merchant.toObject() as any,
      products: products.map(p => p.toObject()),
      knowledge: knowledge ? (knowledge.toObject() as any) : { businessRules: {} },
      history: history.map((h: any) => ({
        role: h.role === "customer" ? "customer" : "ai",
        text: h.text
      })),
      message,
      customerPhone: "BOSS",
      platform: "whatsapp",
      aiSummary: `Briefing et Reporting en cours avec le propriétaire de ${merchant.businessName}.`
    }, systemPrompt); // Pass the specialized system prompt

    res.json({ reply: reply.text });
  } catch (error) {
    console.error("Briefing Error:", error);
    res.status(500).json({ error: "briefing_error" });
  }
});

export default router;
