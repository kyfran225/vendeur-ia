import "dotenv/config";
import { aiAgentService } from "../services/ai-agent.service.js";
import { commerceService } from "../modules/commerce/commerce.service.js";
import { CommerceProductModel, CommerceConversationModel, CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import mongoose from "mongoose";
import { env } from "../config/env.js";

async function test() {
  await mongoose.connect(env.MONGODB_URI || "mongodb://localhost:27017/vendeuria-local");
  console.log("Connected to MongoDB");

  try {
    // 1. Test Stock Urgency in AI Prompt
    console.log("\n--- Testing Stock Urgency Logic ---");
    const merchant = await CommerceMerchantModel.findOne();
    if (merchant) {
      const products = [
        { name: "Produit Rare", price: 10000, stock: 2, availability: "available", description: "Très demandé" },
        { name: "Produit Épuisé", price: 5000, stock: 0, availability: "available", description: "Plus rien" }
      ];

      const response = await aiAgentService.generateResponse({
        merchant: merchant.toObject() as any,
        products: products as any,
        knowledge: { businessRules: {} },
        history: [],
        message: "Est-ce que le Produit Rare est dispo ? Et le Produit Épuisé ?",
        customerPhone: "22507000000"
      });

      console.log("AI Response (with stock context):", response);
    }

    // 2. Test Follow-up Generation
    console.log("\n--- Testing Follow-up Generation ---");
    const conversation = await CommerceConversationModel.findOne();
    if (conversation) {
      const result = await commerceService.generateFollowUp(conversation._id.toString());
      console.log("Generated Follow-up:", result.followup);
    }

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

test();
