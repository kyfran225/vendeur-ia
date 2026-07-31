import { Router } from "express";
import { commerceService } from "./commerce.service.js";
import { paystackService } from "../../services/paystack.service.js";
import { env } from "../../config/env.js";
import { authenticate } from "../../middleware/authenticate.js";
import { CommerceMerchantModel, CommerceProductModel, CommerceConversationModel, CommerceMessageModel } from "./commerce.model.js";
import axios from "axios";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/dashboard", authenticate, async (req, res) => {
  const ownerId = (req as any).user?.id;
  const data = await commerceService.getDashboard(ownerId);
  res.json(data);
});

router.get("/conversations", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

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

router.post("/activate-premium", authenticate, async (req, res) => {
  const { email } = req.body;
  try {
    const data = await paystackService.initializeSubscription(email, 5000);
    res.json(data);
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
    res.status(500).json({ error: error.message });
  }
});

router.post("/products", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const product = await CommerceProductModel.create({
      ...req.body,
      merchantId: merchant._id
    });
    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/products/vision", authenticate, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    const analysis = await commerceService.analyzeProductImage(
      req.file.buffer,
      req.file.mimetype
    );

    res.json(analysis);
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

import { aiAgentService } from "../../services/ai-agent.service.js";

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

    const reply = await aiAgentService.generateResponse({
      merchant: {
        businessName,
        category,
        city,
        country: "CI", // Default for demo
        description: merchantInstructions,
        paymentChannels
      },
      products: [], // Demo starts with no products, or we could add mock ones
      knowledge: {
        businessRules: {
          deliveryZones: merchantInstructions ? [merchantInstructions] : ["Abidjan"]
        },
        customInstructions: "Ceci est une démonstration. Sois ultra-convaincant pour que l'utilisateur veuille activer sa machine."
      },
      history: history.map((h: any) => ({
        role: h.role === "customer" ? "customer" : "ai",
        text: h.text
      })),
      message: message === "SYSTEM_INITIAL_GREETING" ? "Bonjour !" : message,
      customerPhone: phone
    });

    res.json({ reply });
  } catch (error) {
    console.error("Demo AI Error:", error);
    res.status(500).json({ error: "ai_demo_error" });
  }
});

export default router;
