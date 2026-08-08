import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { SystemSettingsModel } from "./admin.model.js";
import { CommerceMerchantModel, CommerceConversationModel, CommerceMessageModel, CommerceOrderModel } from "./commerce.model.js";
import { TransactionModel } from "./transaction.model.js";
import { aiQueue } from "../../services/ai-queue.service.js";
import { aiProvider } from "../../services/ai-provider.js";

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

// UPDATE Global Settings
router.patch("/settings", authenticate, isAdmin, async (req, res) => {
  try {
    const settings = await SystemSettingsModel.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true }
    );
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

    // QUEUE STATS
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      aiQueue.getWaitingCount(),
      aiQueue.getActiveCount(),
      aiQueue.getCompletedCount(),
      aiQueue.getFailedCount(),
      aiQueue.getDelayedCount(),
    ]);

    res.json({
      totalMerchants,
      activeSessions,
      totalConversations,
      totalRevenue,
      totalAiCost,
      totalGMV,
      recentTransactions,
      providerUsage,
      queue: {
        waiting,
        active,
        completed,
        failed,
        delayed
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Billing Details (MRR, Plans, etc.)
router.get("/billing/stats", authenticate, isAdmin, async (req, res) => {
  try {
    const merchants = await CommerceMerchantModel.find();

    const planStats = {
      starter: 0,
      premium: 0,
      business: 0,
      trial: 0,
      pastDue: 0,
      reconquestReady: 0
    };

    let estimatedMRR = 0;
    const monthlyPrices: any = {
      starter: 0,
      premium: 5000,
      business: 25000
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    merchants.forEach(m => {
      const plan = m.subscription?.plan || "starter";
      const status = m.subscription?.status || "trial";
      const expiresAt = m.subscription?.expiresAt;

      if (status === "active") {
        (planStats as any)[plan]++;
        estimatedMRR += monthlyPrices[plan] || 0;
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

// GET Failed Jobs Details
router.get("/queue/failed", authenticate, isAdmin, async (req, res) => {
  try {
    const failedJobs = await aiQueue.getFailed(0, 50);
    const details = failedJobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      timestamp: job.timestamp
    }));
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

export default router;
