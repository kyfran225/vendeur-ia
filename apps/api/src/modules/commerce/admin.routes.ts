import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { SystemSettingsModel } from "./admin.model.js";
import { CommerceMerchantModel, CommerceConversationModel } from "./commerce.model.js";
import { TransactionModel } from "./transaction.model.js";

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

// GET Global Stats
router.get("/stats", authenticate, isAdmin, async (req, res) => {
  try {
    const totalMerchants = await CommerceMerchantModel.countDocuments();
    const activeSessions = await CommerceMerchantModel.countDocuments({ "whatsappConfig.status": "connected" });
    const totalConversations = await CommerceConversationModel.countDocuments();

    // Revenue aggregation
    const revenueStats = await TransactionModel.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalRevenue = revenueStats[0]?.total || 0;

    const recentTransactions = await TransactionModel.find()
      .populate("merchantId", "businessName")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalMerchants,
      activeSessions,
      totalConversations,
      totalRevenue,
      recentTransactions
    });
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
