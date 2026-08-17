import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { SystemSettingsModel } from "./admin.model.js";
import { CommerceMerchantModel, CommerceConversationModel, CommerceMessageModel, CommerceOrderModel } from "./commerce.model.js";
import { TransactionModel } from "./transaction.model.js";
import { UserModel } from "../auth/user.model.js";
import { messagingService } from "../../services/messaging.service.js";
import { pushService } from "../../services/push.service.js";
import { aiQueue } from "../../services/ai-queue.service.js";
import { aiProvider } from "../../services/ai-provider.js";
import { PaymentIntentModel } from "./payment-intent.model.js";
import { paymentService } from "../../services/payment.service.js";

const router = Router();

// Middleware to check for Admin role
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user?.roles?.includes("admin") || req.user?.email === "franck@vendeur-ia.com") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admin only." });
  }
};

// GET Global Settings
router.get("/settings", authenticate, isAdmin, async (req, res) => {
  try {
    let settings = await SystemSettingsModel.findOne();
    if (!settings) {
      settings = await SystemSettingsModel.create({});
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

import { logger } from "../../services/logger.service.js";

// UPDATE Global Settings
router.patch("/settings", authenticate, isAdmin, async (req, res) => {
  try {
    const settings = await SystemSettingsModel.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true }
    );
    logger.info("[Admin MasterControl] Clés et configuration IA mises à jour avec succès ✅");
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET AI Status & Connectivity
router.get("/ai/status", authenticate, isAdmin, async (req, res) => {
  try {
    const providers = ['gemini', 'openai', 'groq', 'openrouter', 'elevenlabs'];
    const results = await Promise.all(providers.map(p => aiProvider.testConnectivity(p)));

    const status = providers.map((p, i) => ({
      name: p,
      ...results[i]
    }));

    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// TEST SPECIFIC PROVIDER
router.post("/ai/test/:provider", authenticate, isAdmin, async (req, res) => {
  try {
    const result = await aiProvider.testConnectivity(req.params.provider);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Global Stats
router.get("/stats", authenticate, isAdmin, async (req, res) => {
  try {
    const totalMerchants = await CommerceMerchantModel.countDocuments();
    const activeSessions = await CommerceMerchantModel.countDocuments({ "whatsappConfig.status": "connected" });
    const totalConversations = await CommerceConversationModel.countDocuments();

    // AI Costs & Tokens aggregation
    const aiStats = await CommerceMessageModel.aggregate([
      { $match: { sender: "ai", "aiMetadata.provider": { $exists: true } } },
      {
        $group: {
          _id: "$aiMetadata.provider",
          totalCost: { $sum: "$aiMetadata.cost" },
          totalTokens: { $sum: "$aiMetadata.tokensUsed" }
        }
      }
    ]);

    const totalAiCost = aiStats.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
    const providerUsage = aiStats.map(s => ({
      provider: s._id,
      tokens: s.totalTokens || 0,
      cost: s.totalCost || 0
    }));

    // Gross Merchandise Value (GMV) of all merchants
    const gmvStats = await CommerceOrderModel.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalGMV = gmvStats[0]?.total || 0;

    // Total Revenue (from successful transactions)
    const revenueStats = await TransactionModel.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalRevenue = revenueStats[0]?.total || 0;

    const recentTransactions = await TransactionModel.find()
      .populate("merchantId", "businessName")
      .sort({ createdAt: -1 })
      .limit(10);

    // QUEUE STATS (with fallback if Redis is unavailable)
    let queueStats = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0
    };

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        aiQueue.getWaitingCount(),
        aiQueue.getActiveCount(),
        aiQueue.getCompletedCount(),
        aiQueue.getFailedCount(),
        aiQueue.getDelayedCount(),
      ]);
      queueStats = { waiting, active, completed, failed, delayed };
    } catch (queueErr: any) {
      logger.warn(`[Admin Stats] BullMQ/Redis inaccessible: ${queueErr.message}`);
    }

    res.json({
      totalMerchants,
      activeSessions,
      totalConversations,
      totalRevenue,
      totalAiCost,
      totalGMV,
      recentTransactions,
      providerUsage,
      queue: queueStats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Billing Details (MRR, Plans, etc.)
router.get("/billing/stats", authenticate, isAdmin, async (req, res) => {
  try {
    const merchants = await CommerceMerchantModel.find();
    const settings = await SystemSettingsModel.findOne();

    const planStats = {
      starter: 0,
      premium: 0,
      business: 0,
      trial: 0,
      pastDue: 0,
      reconquestReady: 0
    };

    let estimatedMRR = 0;

    // Default prices
    const defaultMonthlyPrices: any = {
      starter: 0,
      premium: settings?.pricing?.premiumSubscriptionMonthly || 5000,
      business: settings?.pricing?.ramContributionFee || 25000
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    merchants.forEach(m => {
      const plan = m.subscription?.plan || "starter";
      const status = m.subscription?.status || "trial";
      const expiresAt = m.subscription?.expiresAt;
      const currency = m.currency || "XOF";

      if (status === "active") {
        (planStats as any)[plan]++;

        // Use regional pricing if available, else fallback to default
        const regionalPricing = settings?.pricing?.regional?.find(r => r.currency === currency);
        if (regionalPricing) {
            estimatedMRR += plan === "business" ? regionalPricing.businessMonthly : regionalPricing.premiumMonthly;
        } else {
            estimatedMRR += defaultMonthlyPrices[plan] || 0;
        }
      } else if (status === "trial") {
        planStats.trial++;
      } else if (status === "past_due") {
        planStats.pastDue++;
        if (expiresAt && new Date(expiresAt) <= sevenDaysAgo) {
          planStats.reconquestReady++;
        }
      }
    });

    const recentTransactions = await TransactionModel.find()
      .populate("merchantId", "businessName")
      .sort({ createdAt: -1 })
      .limit(20);

    const revenueByMonth = await TransactionModel.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": -1 } },
      { $limit: 6 }
    ]);

    res.json({
      planStats,
      estimatedMRR,
      revenueByMonth,
      recentTransactions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// EXPORT TRANSACTIONS AS CSV
router.get("/billing/export", authenticate, isAdmin, async (req, res) => {
  try {
    const transactions = await TransactionModel.find()
      .populate("merchantId", "businessName")
      .sort({ createdAt: -1 });

    let csv = "ID,Merchant,Type,Amount,Currency,Status,Date,Method,Reference\n";

    transactions.forEach(t => {
      const date = new Date(t.paidAt || t.createdAt).toISOString();
      const merchant = (t.merchantId as any)?.businessName || "Unknown";
      csv += `${t._id},"${merchant}",${t.type},${t.amount},${t.currency},${t.status},${date},${t.paymentMethod},${t.reference}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=vendeur-ia-transactions.csv");
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Failed Jobs Details
router.get("/queue/failed", authenticate, isAdmin, async (req, res) => {
  try {
    let details: any[] = [];
    try {
      const failedJobs = await aiQueue.getFailed(0, 50);
      details = failedJobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        failedReason: job.failedReason,
        timestamp: job.timestamp
      }));
    } catch (queueErr: any) {
      logger.warn(`[Admin Queue Failed] BullMQ/Redis inaccessible: ${queueErr.message}`);
    }
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// LIST ALL MERCHANTS with status and usage
router.get("/merchants", authenticate, isAdmin, async (req, res) => {
  try {
    const merchants = await CommerceMerchantModel.find().sort({ createdAt: -1 }).lean();

    // Enrich with usage and last message data
    const enrichedMerchants = await Promise.all(merchants.map(async (m) => {
      const lastMessage = await CommerceMessageModel.findOne({
        conversationId: { $in: await CommerceConversationModel.find({ merchantId: m._id }).distinct("_id") }
      }).sort({ timestamp: -1 }).limit(1);

      const aiUsage = await CommerceMessageModel.aggregate([
        { $match: {
          sender: "ai",
          conversationId: { $in: await CommerceConversationModel.find({ merchantId: m._id }).distinct("_id") }
        } },
        { $group: { _id: null, tokens: { $sum: "$aiMetadata.tokensUsed" }, cost: { $sum: "$aiMetadata.cost" } } }
      ]);

      return {
        ...m,
        lastActiveAt: lastMessage?.timestamp,
        usage: {
          tokens: aiUsage[0]?.tokens || 0,
          cost: aiUsage[0]?.cost || 0
        }
      };
    }));

    res.json(enrichedMerchants);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET MERCHANT AUDIT (Last 10 AI responses)
router.get("/merchants/:id/audit", authenticate, isAdmin, async (req, res) => {
  try {
    const conversations = await CommerceConversationModel.find({ merchantId: req.params.id }).distinct("_id");
    const logs = await CommerceMessageModel.find({
      conversationId: { $in: conversations },
      sender: "ai"
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .populate({
      path: "conversationId",
      populate: { path: "customerId", select: "phone name" }
    });

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// FORCE REACTIVATE MERCHANT
router.post("/merchants/:id/reactivate", authenticate, isAdmin, async (req, res) => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const merchant = await CommerceMerchantModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          "subscription.status": "active",
          "subscription.expiresAt": expiresAt,
          "whatsappConfig.status": "connected" // Try to force status to allow boot
        }
      },
      { new: true }
    );

    res.json({ message: "Marchand réactivé avec succès pour 30 jours", merchant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// LIST ALL EXPERT SETUPS (Pack Pro Orders)
router.get("/expert-setups", authenticate, isAdmin, async (req, res) => {
  try {
    const merchants = await CommerceMerchantModel.find({
      $or: [
        { "expertSetup.status": { $in: ["pending", "in_progress", "completed"] } },
        { "whatsappConfig.packProAssistance": true }
      ]
    }).sort({ "expertSetup.orderedAt": -1, createdAt: -1 }).lean();

    const enriched = await Promise.all(merchants.map(async (m) => {
      const user = await UserModel.findOne({ ownerId: m.ownerId }).select("email displayName phone");
      const transaction = await TransactionModel.findOne({
        merchantId: m._id,
        $or: [{ type: "pack_pro" }, { "metadata.setupOption": "EXPERT" }]
      }).sort({ createdAt: -1 });

      return {
        _id: m._id,
        businessName: m.businessName,
        slug: m.slug,
        whatsappNumber: m.whatsappNumber,
        userEmail: user?.email,
        userName: user?.displayName,
        expertSetup: m.expertSetup || {
          status: m.whatsappConfig?.packProAssistance ? "pending" : "none",
          orderedAt: transaction?.createdAt || m.createdAt
        },
        transaction: transaction ? {
          reference: transaction.reference,
          amount: transaction.amount,
          currency: transaction.currency,
          paidAt: transaction.paidAt
        } : null,
        whatsappStatus: m.whatsappConfig?.status || "disconnected",
        provider: m.whatsappConfig?.provider || "meta",
        metaConfig: m.whatsappConfig?.meta || {
          phoneNumberId: "",
          accessToken: "",
          wabaId: ""
        }
      };
    }));

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE EXPERT SETUP STATUS & META CONFIG
router.patch("/expert-setups/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const { status, assignedTo, notes, metaConfig } = req.body;
    const update: any = {};

    if (status) {
      update["expertSetup.status"] = status;
      if (status === "completed") {
        update["expertSetup.completedAt"] = new Date();
        update["whatsappConfig.status"] = "connected";
        update["whatsappConfig.provider"] = "meta";
      }
    }
    if (assignedTo !== undefined) update["expertSetup.assignedTo"] = assignedTo;
    if (notes !== undefined) update["expertSetup.notes"] = notes;

    if (metaConfig) {
      if (metaConfig.phoneNumberId !== undefined) update["whatsappConfig.meta.phoneNumberId"] = metaConfig.phoneNumberId;
      if (metaConfig.accessToken !== undefined) update["whatsappConfig.meta.accessToken"] = metaConfig.accessToken;
      if (metaConfig.wabaId !== undefined) update["whatsappConfig.meta.wabaId"] = metaConfig.wabaId;
      if (metaConfig.phoneNumberId && metaConfig.accessToken) {
        update["whatsappConfig.provider"] = "meta";
        update["whatsappConfig.status"] = "connected";
      }
    }

    const merchant = await CommerceMerchantModel.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );

    if (!merchant) {
      return res.status(404).json({ error: "Marchand non trouvé." });
    }

    // If marked as completed, notify merchant via WhatsApp & Push
    if (status === "completed") {
      const completionMessage = `🎉 *VOTRE INSTALLATION VIP PACK PRO EST TERMINÉE !*\n\n` +
        `Excellente nouvelle *${merchant.businessName}* : Votre API WhatsApp Meta officielle et votre catalogue sont 100% opérationnels !\n\n` +
        `Votre Vendeur IA répond dès maintenant à vos clients 24h/24. 🚀\n\n` +
        `Rendez-vous sur votre tableau de bord pour tester vos premières conversations en direct.`;

      if (merchant.whatsappNumber) {
        await messagingService.sendMessage(merchant, "whatsapp", merchant.whatsappNumber, completionMessage).catch(err =>
          console.warn("[Admin Expert Setup] Completion WhatsApp message failed:", err.message)
        );
      }

      if (merchant.ownerId) {
        await pushService.sendNotification(merchant.ownerId, {
          title: "Installation Pack Pro Terminée ! 🚀",
          body: "Votre Vendeur IA Meta Cloud officiel est 100% opérationnel.",
          data: { url: "/dashboard" }
        }).catch(err =>
          console.warn("[Admin Expert Setup] Completion Push notification failed:", err.message)
        );
      }
    }

    res.json({ success: true, merchant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

import { vipFollowUpService } from "../../services/vip-followup.service.js";

// TRIGGER SMART REMINDER TO MERCHANT
router.post("/expert-setups/:id/remind", authenticate, isAdmin, async (req, res) => {
  try {
    const merchant = await CommerceMerchantModel.findById(req.params.id);
    if (!merchant) {
      return res.status(404).json({ error: "Marchand non trouvé." });
    }

    await vipFollowUpService.sendMerchantReminder(merchant, true);

    const updated = await CommerceMerchantModel.findById(req.params.id);
    res.json({ success: true, message: "Rappel bienveillant envoyé avec succès au marchand !", merchant: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// --- ADMIN PAYMENT INTENTS & AUDIT ---
// ==========================================

// GET /api/commerce/admin/payments - List all payment intents with filters
router.get("/payments", authenticate, isAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const intents = await PaymentIntentModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("merchantId", "businessName phone whatsappNumber");

    res.json(intents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/commerce/admin/payments/:id/decision - Approve or Reject a payment intent
router.post("/payments/:id/decision", authenticate, isAdmin, async (req, res) => {
  try {
    const adminId = (req as any).user.id || (req as any).user.email;
    const { action, adminNotes } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "L'action doit être 'approve' ou 'reject'." });
    }

    const result = await paymentService.processAdminDecision(req.params.id, adminId, {
      action,
      adminNotes
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/commerce/admin/payments/config - Update manual payment configuration & numbers
router.patch("/payments/config", authenticate, isAdmin, async (req, res) => {
  try {
    const settings = await SystemSettingsModel.findOneAndUpdate(
      {},
      { $set: { manualPaymentConfig: req.body } },
      { new: true, upsert: true }
    );
    res.json({ success: true, manualPaymentConfig: (settings as any).manualPaymentConfig });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
