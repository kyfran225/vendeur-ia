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

// LIST ALL MERCHANTS
router.get("/merchants", authenticate, isAdmin, async (req, res) => {
  try {
    const merchants = await CommerceMerchantModel.find().sort({ createdAt: -1 });
    res.json(merchants);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
